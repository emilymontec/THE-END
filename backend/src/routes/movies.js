import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

// Listar todas las películas (Admin ve todas, otros solo activas)
router.get('/', async (req, res) => {
  const { role } = req.query; // Pasamos el rol por query para simplificar
  try {
    let query = 'SELECT * FROM peliculas';
    if (role !== 'admin') {
      query += " WHERE estado = 'activa'";
    }
    query += ' ORDER BY id ASC';
    const result = await db.query(query);
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
  const { titulo, genero, duracion, clasificacion, descripcion, imagen_url, estado } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO peliculas(titulo, genero, duracion, clasificacion, descripcion, imagen_url, estado) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [titulo, genero, duracion, clasificacion, descripcion, imagen_url || null, estado || 'activa']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Editar una película
router.put('/:id', async (req, res) => {
  const { titulo, genero, duracion, clasificacion, descripcion, imagen_url, estado } = req.body;
  try {
    const result = await db.query(
      'UPDATE peliculas SET titulo=$1, genero=$2, duracion=$3, clasificacion=$4, descripcion=$5, imagen_url=$6, estado=$7 WHERE id=$8 RETURNING *',
      [titulo, genero, duracion, clasificacion, descripcion, imagen_url, estado, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Película no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Cambiar estado (Activar/Desactivar)
router.patch('/:id/status', async (req, res) => {
  const { estado } = req.body;
  try {
    const result = await db.query(
      'UPDATE peliculas SET estado=$1 WHERE id=$2 RETURNING *',
      [estado, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Película no encontrada' });
    res.json(result.rows[0]);
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
