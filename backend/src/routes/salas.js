import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

// Listar todas las salas
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM salas ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear una nueva sala
router.post('/', async (req, res) => {
  const { nombre, precio_base } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO salas(nombre, precio_base) VALUES($1, $2) RETURNING *',
      [nombre, precio_base]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar una sala
router.put('/:id', async (req, res) => {
  const { nombre, precio_base } = req.body;
  try {
    const result = await db.query(
      'UPDATE salas SET nombre = $1, precio_base = $2 WHERE id = $3 RETURNING *',
      [nombre, precio_base, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Sala no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar una sala
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM salas WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Sala no encontrada' });
    res.json({ message: 'Sala eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
