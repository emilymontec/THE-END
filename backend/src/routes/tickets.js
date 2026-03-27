import express from 'express';
import { db } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 1. Generación de tiquete con código único
router.post('/', async (req, res) => {
  const { funcion_id, asientos, usuario_id, es_taquilla } = req.body;

  try {
    await db.query('BEGIN');

    // Obtener precio de la función
    const funcResult = await db.query('SELECT precio FROM funciones WHERE id = $1', [funcion_id]);
    if (funcResult.rows.length === 0) throw new Error('Función no encontrada');
    const precio = funcResult.rows[0].precio;

    // Verificar disponibilidad de cada asiento con bloqueo de fila (FOR UPDATE)
    for (let a of asientos) {
      const check = await db.query(
        `SELECT ocupado FROM funcion_asiento WHERE funcion_id=$1 AND asiento_id=$2 FOR UPDATE`,
        [funcion_id, a]
      );
      if (check.rows.length === 0) throw new Error('Asiento inexistente');
      if (check.rows[0].ocupado) throw new Error('Asiento ya vendido o reservado');
    }

    // Crear tiquete
    const codigo = uuidv4().split('-')[0].toUpperCase();
    const total = asientos.length * precio;
    
    const ticketResult = await db.query(
      'INSERT INTO tiquetes(codigo, funcion_id, usuario_id, total, estado, es_taquilla) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
      [codigo, funcion_id, usuario_id || null, total, 'activo', !!es_taquilla]
    );
    const ticketId = ticketResult.rows[0].id;

    for (let a of asientos) {
      await db.query(
        'UPDATE funcion_asiento SET ocupado = TRUE, bloqueado_hasta = NULL WHERE funcion_id=$1 AND asiento_id=$2',
        [funcion_id, a]
      );
      await db.query(
        'INSERT INTO detalle_tiquete(tiquete_id, asiento_id, precio_unitario) VALUES($1, $2, $3)',
        [ticketId, a, precio]
      );
    }

    await db.query('COMMIT');
    res.json({ id: ticketId, codigo, total, estado: 'activo' });
  } catch (e) {
    await db.query('ROLLBACK');
    res.status(400).json({ error: e.message });
  }
});

// Listar todas las ventas (Admin o Cliente filtrado)
router.get('/', async (req, res) => {
  const { usuario_id } = req.query;
  try {
    let query = `
      SELECT t.*, f.fecha, f.hora, p.titulo, u.nombre as usuario_nombre,
             (SELECT string_agg(a.fila || a.columna, ', ') 
              FROM detalle_tiquete dt 
              JOIN asientos a ON dt.asiento_id = a.id 
              WHERE dt.tiquete_id = t.id) as asientos
      FROM tiquetes t
      JOIN funciones f ON t.funcion_id = f.id
      JOIN peliculas p ON f.pelicula_id = p.id
      LEFT JOIN usuarios u ON t.usuario_id = u.id
    `;

    const params = [];
    if (usuario_id) {
      query += ` WHERE t.usuario_id = $1 `;
      params.push(usuario_id);
    }

    query += ` ORDER BY t.fecha_compra DESC `;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancelar tiquete (Admin)
router.delete('/:id', async (req, res) => {
  try {
    await db.query('BEGIN');
    
    // Obtener detalles para liberar asientos
    const details = await db.query('SELECT funcion_id, asiento_id FROM detalle_tiquete dt JOIN tiquetes t ON dt.tiquete_id = t.id WHERE t.id = $1', [req.params.id]);
    
    for (let row of details.rows) {
      await db.query('UPDATE funcion_asiento SET ocupado = FALSE WHERE funcion_id = $1 AND asiento_id = $2', [row.funcion_id, row.asiento_id]);
    }

    const result = await db.query('UPDATE tiquetes SET estado = \'cancelado\' WHERE id = $1 RETURNING *', [req.params.id]);
    
    await db.query('COMMIT');
    res.json({ message: 'Tiquete cancelado y asientos liberados', ticket: result.rows[0] });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// 2. Validación de tiquetes
router.get('/validate/:codigo', async (req, res) => {
  const { codigo } = req.params;
  try {
    const query = `
      SELECT t.*, f.fecha, f.hora, p.titulo 
      FROM tiquetes t
      JOIN funciones f ON t.funcion_id = f.id
      JOIN peliculas p ON f.pelicula_id = p.id
      WHERE t.codigo = $1
    `;
    const result = await db.query(query, [codigo.toUpperCase()]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'Inválido', message: 'Tiquete no encontrado' });
    }

    const ticket = result.rows[0];
    if (ticket.estado === 'usado') {
      return res.json({ status: 'Usado', message: 'Tiquete ya fue utilizado', ticket });
    }

    res.json({ status: 'Válido', message: 'Tiquete activo', ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Marcar tiquete como usado
router.post('/use/:codigo', async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE tiquetes SET estado = $1, fecha_uso = CURRENT_TIMESTAMP WHERE codigo = $2 AND estado = $3 RETURNING *',
      ['usado', req.params.codigo.toUpperCase(), 'activo']
    );
    
    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Tiquete no válido para usar' });
    }
    res.json({ message: 'Tiquete usado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Estadísticas administrativas mejoradas
router.get('/stats/summary', async (req, res) => {
  const { start_date, end_date } = req.query;
  
  let dateFilter = '';
  const params = [];
  if (start_date && end_date) {
    dateFilter = 'WHERE fecha_compra BETWEEN $1 AND $2';
    params.push(start_date, end_date);
  }

  try {
    // 1. Ventas totales e ingresos
    const salesQuery = `SELECT SUM(total) as total, COUNT(*) as count FROM tiquetes ${dateFilter}`;
    const salesResult = await db.query(salesQuery, params);
    
    // 2. Ocupación por función (siempre actual)
    const occupancyQuery = `
      SELECT f.id, p.titulo, f.fecha, f.hora,
             (SELECT COUNT(*) FROM funcion_asiento WHERE funcion_id = f.id AND ocupado = TRUE) as ocupados,
             (SELECT COUNT(*) FROM funcion_asiento WHERE funcion_id = f.id) as total_asientos
      FROM funciones f
      JOIN peliculas p ON f.pelicula_id = p.id
      ORDER BY f.fecha DESC, f.hora DESC
      LIMIT 10
    `;
    const occupancyResult = await db.query(occupancyQuery);

    // 3. Películas más vistas (Top 5)
    const topMoviesQuery = `
      SELECT p.titulo, COUNT(dt.id) as total_tickets, SUM(dt.precio_unitario) as total_revenue
      FROM tiquetes t
      JOIN detalle_tiquete dt ON t.id = dt.tiquete_id
      JOIN funciones f ON t.funcion_id = f.id
      JOIN peliculas p ON f.pelicula_id = p.id
      ${dateFilter.replace('fecha_compra', 't.fecha_compra')}
      GROUP BY p.id, p.titulo
      ORDER BY total_tickets DESC
      LIMIT 5
    `;
    const topMoviesResult = await db.query(topMoviesQuery, params);

    res.json({
      totalMoney: salesResult.rows[0].total || 0,
      totalTickets: salesResult.rows[0].count || 0,
      occupancy: occupancyResult.rows.map(row => ({
        ...row,
        percent: row.total_asientos > 0 ? (row.ocupados * 100 / row.total_asientos).toFixed(1) : 0
      })),
      topMovies: topMoviesResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
