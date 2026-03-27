import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

// Listar
router.get('/', (req,res)=>{
  const movies = db.prepare('SELECT * FROM peliculas').all();
  res.json(movies);
});

// Crear
router.post('/', (req,res)=>{
  const { titulo, genero, duracion } = req.body;
  const info = db.prepare('INSERT INTO peliculas(titulo,genero,duracion) VALUES(?,?,?)')
                .run(titulo,genero,duracion);
  const movie = db.prepare('SELECT * FROM peliculas WHERE id=?').get(info.lastInsertRowid);
  res.json(movie);
});

export default router;