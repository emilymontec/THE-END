import { useState, useEffect } from 'react';
import { api } from './api';
import './App.css';

export default function App() {
  const [page, setPage] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/movies');
      setMovies(res.data);
      setMessage(null);
    } catch (err) {
      setMessage({ type: 'error', text: 'Error cargando películas' });
    } finally {
      setLoading(false);
    }
  };

  const handleShowMovieShowtimes = async (movie) => {
    setSelectedMovie(movie);
    try {
      const res = await api.get('/showtimes');
      const filtered = res.data.filter(s => s.pelicula_id === movie.id);
      setShowtimes(filtered);
      setPage('showtimes');
    } catch (err) {
      setMessage({ type: 'error', text: 'Error cargando funciones' });
    }
  };

  const handleSelectShowtime = (showtime) => {
    setSelectedShowtime(showtime);
    setSelectedSeats([]);
    setPage('seats');
  };

  const toggleSeat = (seat) => {
    setSelectedSeats(prev =>
      prev.includes(seat)
        ? prev.filter(s => s !== seat)
        : [...prev, seat]
    );
  };

  const handleBuyTicket = async () => {
    if (selectedSeats.length === 0) {
      setMessage({ type: 'error', text: 'Selecciona al menos un asiento' });
      return;
    }
    try {
      const res = await api.post('/tickets', {
        funcion_id: selectedShowtime.id,
        asientos: selectedSeats
      });
      setMessage({ 
        type: 'success', 
        text: `✅ ¡Compra exitosa! Código: ${res.data.codigo}` 
      });
      setTimeout(() => {
        setPage('movies');
        setSelectedSeats([]);
        setMessage(null);
      }, 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al comprar ticket' });
    }
  };

  return (
    <div className="container">
      <h1>🎬 Cine</h1>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {page === 'movies' && (
        <div>
          <h2>Películas Disponibles</h2>
          {loading ? (
            <div className="message loading">Cargando películas...</div>
          ) : movies.length === 0 ? (
            <div className="message error">No hay películas disponibles</div>
          ) : (
            <div className="grid">
              {movies.map(m => (
                <div key={m.id} className="card">
                  <h3>{m.titulo}</h3>
                  <p><strong>Género:</strong> {m.genero}</p>
                  <p><strong>Duración:</strong> {m.duracion} min</p>
                  <button onClick={() => handleShowMovieShowtimes(m)}>
                    Ver Funciones
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {page === 'showtimes' && (
        <div>
          <button className="back-btn" onClick={() => setPage('movies')}>
            ← Volver a Películas
          </button>
          <h2>{selectedMovie?.titulo}</h2>
          <h3>Funciones disponibles</h3>
          {showtimes.length === 0 ? (
            <div className="message error">No hay funciones disponibles</div>
          ) : (
            <div className="grid">
              {showtimes.map(s => (
                <div key={s.id} className="card">
                  <p><strong>Fecha y Hora:</strong> {s.fecha_hora}</p>
                  <p><strong>Precio:</strong>${s.precio.toLocaleString()}</p>
                  <button onClick={() => handleSelectShowtime(s)}>
                    Comprar Tickets
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {page === 'seats' && (
        <div>
          <button className="back-btn" onClick={() => setPage('showtimes')}>
            ← Volver
          </button>
          <h2>Selecciona tus asientos</h2>
          <p style={{marginBottom: '20px', color: '#666'}}>
            Función: {selectedShowtime?.fecha_hora}
          </p>
          <div className="seats-grid">
            {[...Array(30)].map((_, i) => (
              <button
                key={i + 1}
                className={`seat ${selectedSeats.includes(i + 1) ? 'selected' : ''}`}
                onClick={() => toggleSeat(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="stats">
            <p>Asientos seleccionados: <span className="amount">{selectedSeats.length}</span></p>
            <p>Total a pagar: <span className="amount">${(selectedSeats.length * 10000).toLocaleString()}</span></p>
          </div>
          <button className="buy-btn" onClick={handleBuyTicket}>
            Confirmar Compra ({selectedSeats.length})
          </button>
        </div>
      )}
    </div>
  );
}