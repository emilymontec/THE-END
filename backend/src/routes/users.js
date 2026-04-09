import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

// Función auxiliar para generar un username único
async function generateUniqueUsername(nombre, apellidos, userId = null) {
  const baseUsername = `${nombre}_${apellidos}`.toLowerCase().replace(/\s+/g, '');
  let username = baseUsername;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    const query = userId 
      ? 'SELECT id FROM usuarios WHERE username = $1 AND id != $2'
      : 'SELECT id FROM usuarios WHERE username = $1';
    const params = userId ? [username, userId] : [username];
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      isUnique = true;
    } else {
      username = `${baseUsername}${counter}`;
      counter++;
    }
  }
  return username;
}

// Registro de clientes
router.post('/register', async (req, res) => {
  const { nombre, apellidos, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  
  try {
    const username = await generateUniqueUsername(nombre, apellidos);

    const result = await db.query(
      'INSERT INTO usuarios(nombre, apellidos, email, username, password, rol) VALUES($1, $2, $3, $4, $5, $6) RETURNING id, nombre, apellidos, email, username, rol',
      [nombre, apellidos, normalizedEmail, username, password, 'cliente']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: 'Email ya registrado o datos inválidos' });
  }
});

// Login universal
router.post('/login', async (req, res) => {
  let { email, password } = req.body;
  try {
    // Si el usuario ingresa con @username, removemos el @ para buscar en DB
    let input = email.trim();
    if (input.startsWith('@')) input = input.slice(1);

    const result = await db.query(
      'SELECT id, nombre, apellidos, email, username, rol FROM usuarios WHERE (LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)) AND password = $2',
      [input, password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar perfil
router.put('/profile/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, apellidos, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  
  try {
    const username = await generateUniqueUsername(nombre, apellidos, id);

    let result;
    if (password && password.trim() !== '') {
      result = await db.query(
        'UPDATE usuarios SET nombre = $1, apellidos = $2, email = $3, username = $4, password = $5 WHERE id = $6 RETURNING id, nombre, apellidos, email, username, rol',
        [nombre, apellidos, normalizedEmail, username, password, id]
      );
    } else {
      result = await db.query(
        'UPDATE usuarios SET nombre = $1, apellidos = $2, email = $3, username = $4 WHERE id = $5 RETURNING id, nombre, apellidos, email, username, rol',
        [nombre, apellidos, normalizedEmail, username, id]
      );
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: 'Error al actualizar perfil. El email ya podría estar en uso.' });
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
