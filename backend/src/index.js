import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import moviesRouter from './routes/movies.js';
import showtimesRouter from './routes/showtimes.js';
import ticketsRouter from './routes/tickets.js';
import usersRouter from './routes/users.js';
import uploadRouter from './routes/upload.js';
import salasRouter from './routes/salas.js';
import categoriasRouter from './routes/categorias.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Rutas modulares
app.use('/movies', moviesRouter);
app.use('/showtimes', showtimesRouter);
app.use('/tickets', ticketsRouter);
app.use('/users', usersRouter);
app.use('/upload', uploadRouter);
app.use('/salas', salasRouter);
app.use('/categorias', categoriasRouter);

app.get("/", (_, res) => {
  res.json("The-End backend running...");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server → http://localhost:${PORT}`);
});
