import { db } from './config/db.js';

// Agregar películas de ejemplo
const movies = [
  { titulo: 'Avengers: Endgame', genero: 'Acción', duracion: 180 },
  { titulo: 'The Shawshank Redemption', genero: 'Drama', duracion: 142 },
  { titulo: 'Inception', genero: 'Ciencia Ficción', duracion: 148 }
];

for (let m of movies) {
  db.prepare('INSERT OR IGNORE INTO peliculas(titulo,genero,duracion) VALUES(?,?,?)')
     .run(m.titulo, m.genero, m.duracion);
}

// Agregar funciones
const funcs = [
  { pelicula_id: 1, fecha_hora: '2024-03-25 20:00' },
  { pelicula_id: 2, fecha_hora: '2024-03-25 18:00' },
  { pelicula_id: 3, fecha_hora: '2024-03-25 22:00' }
];

for (let f of funcs) {
  const info = db.prepare('INSERT OR IGNORE INTO funciones(pelicula_id,fecha_hora) VALUES(?,?)')
                 .run(f.pelicula_id, f.fecha_hora);
  if (info.changes > 0) {
    const funcId = info.lastInsertRowid;
    const asientos = db.prepare('SELECT id FROM asientos').all();
    const stmt = db.prepare('INSERT OR IGNORE INTO funcion_asientos(funcion_id,asiento_id) VALUES(?,?)');
    for (let a of asientos) {
      stmt.run(funcId, a.id);
    }
  }
}

console.log('Datos poblados');