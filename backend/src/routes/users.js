import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

// Registro de clientes
router.post('/register', async (req, res) => {
  const { nombre, email, password } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO usuarios(nombre, email, password, rol) VALUES($1, $2, $3, $4) RETURNING id, nombre, email, rol',
      [nombre, email, password, 'cliente']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: 'Email ya registrado o datos inválidos' });
  }
});

// Login universal
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query(
      'SELECT id, nombre, email, rol FROM usuarios WHERE email = $1 AND password = $2',
      [email, password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gestión de usuarios por Admin (Crear operarios)
router.post('/admin/users', async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO usuarios(nombre, email, password, rol) VALUES($1, $2, $3, $4) RETURNING id, nombre, email, rol',
      [nombre, email, password, rol]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listar usuarios (solo Admin)
router.get('/admin/users', async (req, res) => {
  try {
    const result = await db.query('SELECT id, nombre, email, rol, fecha_creacion FROM usuarios ORDER BY rol ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar usuario
router.delete('/admin/users/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
