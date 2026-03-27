import express from 'express';
import { db } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 1. Generación de tiquete con código único
router.post('/', async (req, res) => {
  const { funcion_id, asientos, usuario_id } = req.body;

  try {
    await db.query('BEGIN');

    // Obtener precio de la función
    const funcResult = await db.query('SELECT precio FROM funciones WHERE id = $1', [funcion_id]);
    if (funcResult.rows.length === 0) throw new Error('Función no encontrada');
    const precio = funcResult.rows[0].precio;

    // Verificar disponibilidad de cada asiento
    for (let a of asientos) {
      const check = await db.query(
        'SELECT ocupado FROM funcion_asiento WHERE funcion_id=$1 AND asiento_id=$2',
        [funcion_id, a]
      );
      if (check.rows.length === 0) throw new Error('Asiento inexistente: ' + a);
      if (check.rows[0].ocupado) throw new Error('Asiento ya ocupado: ' + a);
    }

    // Crear tiquete con código único
    const codigo = uuidv4().split('-')[0].toUpperCase();
    const total = asientos.length * precio;
    
    const ticketResult = await db.query(
      'INSERT INTO tiquetes(codigo, funcion_id, usuario_id, total, estado) VALUES($1, $2, $3, $4, $5) RETURNING *',
      [codigo, funcion_id, usuario_id || null, total, 'activo']
    );
    const ticketId = ticketResult.rows[0].id;

    // Marcar asientos como vendidos y guardar detalle
    for (let a of asientos) {
      await db.query(
        'UPDATE funcion_asiento SET ocupado = TRUE WHERE funcion_id=$1 AND asiento_id=$2',
        [funcion_id, a]
      );
      await db.query(
        'INSERT INTO detalle_tiquete(tiquete_id, asiento_id, precio_unitario) VALUES($1, $2, $3)',
        [ticketId, a, precio]
      );
    }

    await db.query('COMMIT');
    res.json({ codigo, total, estado: 'activo' });
  } catch (e) {
    await db.query('ROLLBACK');
    res.status(400).json({ error: e.message });
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
      'UPDATE tiquetes SET estado = $1 WHERE codigo = $2 AND estado = $3 RETURNING *',
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

// 4. Estadísticas administrativas
router.get('/stats/summary', async (req, res) => {
  try {
    const salesResult = await db.query('SELECT SUM(total) as total, COUNT(*) as count FROM tiquetes');
    
    const occupancyQuery = `
      SELECT f.id, p.titulo, f.fecha, f.hora,
             (SELECT COUNT(*) FROM funcion_asiento WHERE funcion_id = f.id AND ocupado = TRUE) as ocupados,
             (SELECT COUNT(*) FROM funcion_asiento WHERE funcion_id = f.id) as total_asientos
      FROM funciones f
      JOIN peliculas p ON f.pelicula_id = p.id
    `;
    const occupancyResult = await db.query(occupancyQuery);

    res.json({
      totalMoney: salesResult.rows[0].total || 0,
      totalTickets: salesResult.rows[0].count || 0,
      occupancy: occupancyResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
