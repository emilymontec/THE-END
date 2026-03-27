import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

// Listar funciones (con detalle de película y sala)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT f.*, p.titulo, f.sala as sala_nombre, 150 as capacidad
      FROM funciones f
      JOIN peliculas p ON f.pelicula_id = p.id
      ORDER BY f.fecha ASC, f.hora ASC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear una nueva función
router.post('/', async (req, res) => {
  const { pelicula_id, sala, fecha, hora, precio } = req.body;
  try {
    await db.query('BEGIN');
    
    const insertQuery = `
      INSERT INTO funciones(pelicula_id, sala, fecha, hora, precio) 
      VALUES($1, $2, $3, $4, $5) 
      RETURNING *
    `;
    const result = await db.query(insertQuery, [pelicula_id, sala, fecha, hora, precio]);
    const funcId = result.rows[0].id;

    const asientosResult = await db.query('SELECT id FROM asientos');
    
    if (asientosResult.rows.length > 0) {
      const insertFuncAsiento = 'INSERT INTO funcion_asiento(funcion_id, asiento_id) VALUES($1, $2)';
      for (const asiento of asientosResult.rows) {
        await db.query(insertFuncAsiento, [funcId, asiento.id]);
      }
    }

    await db.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  }
});

// Obtener asientos de una función específica (con lógica de bloqueo temporal)
router.get('/:id/seats', async (req, res) => {
  try {
    const query = `
      SELECT fa.id as mapping_id, 
             a.fila, a.columna, a.id as asiento_id,
             CASE 
               WHEN fa.ocupado THEN 'vendido' 
               WHEN fa.bloqueado_hasta > CURRENT_TIMESTAMP THEN 'bloqueado'
               ELSE 'disponible' 
             END as estado
      FROM funcion_asiento fa
      JOIN asientos a ON fa.asiento_id = a.id
      WHERE fa.funcion_id = $1
      ORDER BY a.fila ASC, a.columna ASC
    `;
    const result = await db.query(query, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bloqueo temporal de asientos (5 minutos)
router.post('/:id/lock-seats', async (req, res) => {
  const { seats } = req.body; // Array de asiento_id
  const funcId = req.params.id;
  try {
    const query = `
      UPDATE funcion_asiento 
      SET bloqueado_hasta = CURRENT_TIMESTAMP + interval '5 minutes'
      WHERE funcion_id = $1 AND asiento_id = ANY($2) 
      AND ocupado = FALSE 
      AND (bloqueado_hasta IS NULL OR bloqueado_hasta < CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const result = await db.query(query, [funcId, seats]);
    
    if (result.rowCount < seats.length) {
      return res.status(409).json({ error: 'Algunos asientos ya no están disponibles' });
    }
    
    res.json({ message: 'Asientos bloqueados por 5 minutos' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar una función
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM funciones WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Función no encontrada' });
    res.json({ message: 'Función eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
