import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

// Listar todas las categorías
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categorias ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear una categoría
router.post('/', async (req, res) => {
  const { nombre } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO categorias(nombre) VALUES($1) RETURNING *',
      [nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: 'La categoría ya existe o datos inválidos' });
  }
});

// Eliminar una categoría
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM categorias WHERE id = $1', [req.params.id]);
    res.json({ message: 'Categoría eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
