import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

// Inicializar SQLite
const db = new Database(path.join(__dirname, '../../cine.db'));

// Crear tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS peliculas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    genero TEXT,
    duracion INTEGER
  );

  CREATE TABLE IF NOT EXISTS funciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pelicula_id INTEGER NOT NULL,
    fecha_hora TEXT NOT NULL,
    precio REAL DEFAULT 10000,
    FOREIGN KEY(pelicula_id) REFERENCES peliculas(id)
  );

  CREATE TABLE IF NOT EXISTS tiquetes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE,
    funcion_id INTEGER NOT NULL,
    total REAL,
    asientos TEXT
  );
`);

// Insertar datos si está vacío
const count = db.prepare('SELECT COUNT(*) as count FROM peliculas').get();
if (count.count === 0) {
  const insertMovie = db.prepare('INSERT INTO peliculas(titulo,genero,duracion) VALUES(?,?,?)');
  insertMovie.run('Avengers', 'Acción', 180);
  insertMovie.run('Inception', 'Sci-Fi', 148);
  insertMovie.run('Parasite', 'Drama', 132);

  const insertShow = db.prepare('INSERT INTO funciones(pelicula_id,fecha_hora,precio) VALUES(?,?,?)');
  insertShow.run(1, '2024-03-25 20:00', 10000);
  insertShow.run(2, '2024-03-25 18:00', 10000);
  insertShow.run(3, '2024-03-25 22:00', 10000);
}

// Rutas
app.get('/movies', (req, res) => {
  try {
    const movies = db.prepare('SELECT * FROM peliculas').all();
    res.json(movies);
  } catch (err) {
    console.error('Error en /movies:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/showtimes', (req, res) => {
  try {
    const showtimes = db.prepare(`
      SELECT f.*, p.titulo 
      FROM funciones f 
      JOIN peliculas p ON f.pelicula_id = p.id
    `).all();
    res.json(showtimes);
  } catch (err) {
    console.error('Error en /showtimes:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/tickets', (req, res) => {
  try {
    const { funcion_id, asientos } = req.body;
    if (!funcion_id || !asientos || !Array.isArray(asientos)) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    const codigo = Math.random().toString(36).substring(2, 11).toUpperCase();
    const total = asientos.length * 10000;

    const result = db.prepare(
      'INSERT INTO tiquetes(codigo,funcion_id,total,asientos) VALUES(?,?,?,?)'
    ).run(codigo, funcion_id, total, JSON.stringify(asientos));

    res.json({ id: result.lastInsertRowid, codigo, total, asientos });
  } catch (err) {
    console.error('Error en /tickets:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, () => {
  console.log('✅ Backend en http://localhost:4000 (SQLite)');
});
