// backend/db.js
import Database from 'better-sqlite3';

// Esto crea cine.db si no existe
export const db = new Database('cine.db');

// Crear tabla de películas si no existe
db.prepare(`
  CREATE TABLE IF NOT EXISTS peliculas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    genero TEXT,
    duracion INTEGER
  )
`).run();

// Crear tabla de funciones
db.prepare(`
  CREATE TABLE IF NOT EXISTS funciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pelicula_id INTEGER NOT NULL,
    fecha_hora TEXT NOT NULL,
    precio REAL DEFAULT 10000,
    FOREIGN KEY(pelicula_id) REFERENCES peliculas(id)
  )
`).run();

// Crear tabla de asientos
db.prepare(`
  CREATE TABLE IF NOT EXISTS asientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fila TEXT,
    columna INTEGER
  )
`).run();

// Crear tabla de función-asientos (disponibilidad)
db.prepare(`
  CREATE TABLE IF NOT EXISTS funcion_asientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    funcion_id INTEGER NOT NULL,
    asiento_id INTEGER NOT NULL,
    estado TEXT DEFAULT 'disponible',
    UNIQUE(funcion_id, asiento_id),
    FOREIGN KEY(funcion_id) REFERENCES funciones(id),
    FOREIGN KEY(asiento_id) REFERENCES asientos(id)
  )
`).run();

// Crear tabla de tiquetes
db.prepare(`
  CREATE TABLE IF NOT EXISTS tiquetes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE,
    funcion_id INTEGER NOT NULL,
    total REAL,
    estado TEXT DEFAULT 'activo',
    fecha_compra TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(funcion_id) REFERENCES funciones(id)
  )
`).run();

// Crear tabla detalle_tiquete (asientos comprados)
db.prepare(`
  CREATE TABLE IF NOT EXISTS detalle_tiquete (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tiquete_id INTEGER NOT NULL,
    asiento_id INTEGER NOT NULL,
    precio_unitario REAL,
    FOREIGN KEY(tiquete_id) REFERENCES tiquetes(id),
    FOREIGN KEY(asiento_id) REFERENCES asientos(id)
  )
`).run();

// Insertar asientos si no existen
const count = db.prepare('SELECT COUNT(*) as count FROM asientos').get().count;
if (count === 0) {
  const stmt = db.prepare('INSERT INTO asientos(fila, columna) VALUES(?,?)');
  for (let fila = 'A'; fila <= 'F'; fila = String.fromCharCode(fila.charCodeAt(0) + 1)) {
    for (let col = 1; col <= 5; col++) {
      stmt.run(fila, col);
    }
  }
}