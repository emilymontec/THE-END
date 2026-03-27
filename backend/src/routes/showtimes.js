import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

// Listar funciones
router.get('/', (req,res)=>{
  const functions = db.prepare(`
    SELECT f.*, p.titulo 
    FROM funciones f
    JOIN peliculas p ON f.pelicula_id = p.id
  `).all();
  res.json(functions);
});

// Crear función
router.post('/', (req,res)=>{
  const { pelicula_id, fecha_hora, precio } = req.body;
  const info = db.prepare('INSERT INTO funciones(pelicula_id,fecha_hora,precio) VALUES(?,?,?)')
                 .run(pelicula_id, fecha_hora, precio);

  // Crear registros de asientos disponibles
  const funcId = info.lastInsertRowid;
  const asientos = db.prepare('SELECT id FROM asientos').all();
  const stmt = db.prepare('INSERT INTO funcion_asientos(funcion_id,asiento_id) VALUES(?,?)');
  for(let a of asientos){
    stmt.run(funcId,a.id);
  }

  const funcion = db.prepare('SELECT * FROM funciones WHERE id=?').get(funcId);
  res.json(funcion);
});

export default router;