import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

// Listar todas las películas
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM peliculas ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener una película por ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM peliculas WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Película no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear una película
router.post('/', async (req, res) => {
  const { titulo, genero, duracion, clasificacion, descripcion } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO peliculas(titulo, genero, duracion, clasificacion, descripcion) VALUES($1, $2, $3, $4, $5) RETURNING *',
      [titulo, genero, duracion, clasificacion, descripcion]
    );
    res.status(21).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Editar una película
router.put('/:id', async (req, res) => {
  const { titulo, genero, duracion, clasificacion, descripcion } = req.body;
  try {
    const result = await db.query(
      'UPDATE peliculas SET titulo=$1, genero=$2, duracion=$3, clasificacion=$4, descripcion=$5 WHERE id=$6 RETURNING *',
      [titulo, genero, duracion, clasificacion, descripcion, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Película no encontrada' });
    res.json({ message: 'Película actualizada', movie: result.rows[0] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar una película
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM peliculas WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Película no encontrada' });
    res.json({ message: 'Película eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
