import express from 'express';
import cors from 'cors';
import moviesRouter from './routes/movies.js';
import showtimesRouter from './routes/showtimes.js';
import ticketsRouter from './routes/tickets.js';

const app = express();

app.use(cors());
app.use(express.json());

// Rutas modulares
app.use('/movies', moviesRouter);
app.use('/showtimes', showtimesRouter);
app.use('/tickets', ticketsRouter);

app.get("/", (_, res) => {
  res.json("The-End backend running...");
});

app.listen(4000, () => {
  console.log("Server → http://localhost:4000");
});
