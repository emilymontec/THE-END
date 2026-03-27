import express from 'express';
import { db } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.post('/', (req,res)=>{
  const { funcion_id, asientos } = req.body;

  try{
    db.prepare('BEGIN').run();

    // Verificar disponibilidad
    for(let a of asientos){
      const check = db.prepare('SELECT * FROM funcion_asientos WHERE funcion_id=? AND asiento_id=? AND estado="vendido"')
                      .get(funcion_id,a);
      if(check) throw new Error('Asiento ocupado: '+a);
    }

    // Crear tiquete
    const codigo = uuidv4();
    const total = asientos.length * 10000;
    const info = db.prepare('INSERT INTO tiquetes(codigo,funcion_id,total) VALUES(?,?,?)')
                   .run(codigo,funcion_id,total);
    const ticketId = info.lastInsertRowid;

    // Marcar asientos como vendidos y guardar detalle
    const updateSeat = db.prepare('UPDATE funcion_asientos SET estado="vendido" WHERE funcion_id=? AND asiento_id=?');
    const insertDetail = db.prepare('INSERT INTO detalle_tiquete(tiquete_id,asiento_id,precio_unitario) VALUES(?,?,?)');
    for(let a of asientos){
      updateSeat.run(funcion_id,a);
      insertDetail.run(ticketId,a,10000);
    }

    db.prepare('COMMIT').run();
    res.json({codigo,total});
  }catch(e){
    db.prepare('ROLLBACK').run();
    res.status(400).json({error:e.message});
  }
});

export default router;