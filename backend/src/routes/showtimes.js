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

    // Nota: En Postgres/Nhost, la inicialización de asientos podría hacerse de forma diferente,
    // pero seguiremos la lógica de insertar registros en funcion_asiento.
    // Asumimos que los asientos ya existen en la tabla 'asientos'.
    const asientosResult = await db.query('SELECT id FROM asientos');
    
    if (asientosResult.rows.length > 0) {
      const insertFuncAsiento = 'INSERT INTO funcion_asiento(funcion_id, asiento_id) VALUES($1, $2)';
      for (const asiento of asientosResult.rows) {
        await db.query(insertFuncAsiento, [funcId, asiento.id]);
      }
    }

    await db.query('COMMIT');
    res.status(21).json(result.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  }
});

// Obtener asientos de una función específica
router.get('/:id/seats', async (req, res) => {
  try {
    const query = `
      SELECT fa.id as mapping_id, 
             CASE WHEN fa.ocupado THEN 'vendido' ELSE 'disponible' END as estado, 
             a.fila, a.columna, a.id as asiento_id
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

export default router;
