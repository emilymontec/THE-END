import { useState, useEffect } from 'react';
import { api } from './api';
import './App.css';

export default function App() {
  const [role, setRole] = useState('cliente');
  const [page, setPage] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [message, setMessage] = useState(null);
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [movieForm, setMovieForm] = useState({ titulo: '', genero: '', duracion: '', clasificacion: '', descripcion: '' });
  const [stats, setStats] = useState(null);
  const [ticketCode, setTicketCode] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => { loadMovies(); }, []);

  useEffect(() => {
    if (role === 'admin') loadStats();
    setPage('movies');
    setSelectedMovie(null);
    setSelectedShowtime(null);
  }, [role]);

  const loadMovies = async () => {
    try {
      const res = await api.get('/movies');
      setMovies(res.data);
    } catch (err) {
      showMsg('error', 'CONNECTION ERROR');
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.get('/tickets/stats/summary');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSelectMovie = async (movie) => {
    setSelectedMovie(movie);
    try {
      const res = await api.get('/showtimes');
      const filtered = res.data.filter(s => s.pelicula_id === movie.id);
      setShowtimes(filtered);
      setPage('showtimes');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      showMsg('error', 'DATA ERROR');
    }
  };

  const handleSelectShowtime = async (showtime) => {
    setSelectedShowtime(showtime);
    setSelectedSeats([]);
    try {
      const res = await api.get(`/showtimes/${showtime.id}/seats`);
      setSeats(res.data);
      setPage('seats');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      showMsg('error', 'SEAT ERROR');
    }
  };

  const toggleSeat = (seatId) => {
    if (role !== 'cliente') return;
    setSelectedSeats(prev =>
      prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId]
    );
  };

  const handleBuyTickets = async () => {
    if (selectedSeats.length === 0) return showMsg('error', 'SELECT SEATS');
    try {
      const res = await api.post('/tickets', {
        funcion_id: selectedShowtime.id,
        asientos: selectedSeats
      });
      showMsg('success', `CODE: ${res.data.codigo}`);
      setPage('movies');
    } catch (err) {
      showMsg('error', 'PURCHASE ERROR');
    }
  };

  const handleValidateTicket = async () => {
    if (!ticketCode) return;
    setValidationResult(null);
    try {
      const res = await api.get(`/tickets/validate/${ticketCode}`);
      setValidationResult(res.data);
    } catch (err) {
      setValidationResult({ status: 'INVALID', message: 'NOT FOUND' });
    }
  };

  const handleUseTicket = async () => {
    try {
      await api.post(`/tickets/use/${ticketCode}`);
      showMsg('success', 'VALIDATED');
      handleValidateTicket();
      if (role === 'admin') loadStats();
    } catch (err) {
      showMsg('error', 'VALIDATION ERROR');
    }
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    try {
      if (movieForm.id) await api.put(`/movies/${movieForm.id}`, movieForm);
      else await api.post('/movies', movieForm);
      showMsg('success', 'SAVED');
      setShowMovieModal(false);
      setMovieForm({ titulo: '', genero: '', duracion: '', clasificacion: '', descripcion: '' });
      loadMovies();
    } catch (err) {
      showMsg('error', 'SAVE ERROR');
    }
  };

  const handleDeleteMovie = async (id) => {
    if (!window.confirm('DELETE?')) return;
    try {
      await api.delete(`/movies/${id}`);
      showMsg('success', 'DELETED');
      loadMovies();
    } catch (err) {
      showMsg('error', 'DELETE ERROR');
    }
  };

  return (
    <div className="container">
      <header>
        <h1>THE<span>END</span><span className="admin-badge">{role}</span></h1>
        
        <div className="nav-buttons">
          <select value={role} onChange={(e) => setRole(e.target.value)} className="btn-outline">
            <option value="cliente">GUEST</option>
            <option value="operario">STAFF</option>
            <option value="admin">ADMIN</option>
          </select>

          {role === 'admin' && page === 'movies' && (
            <button className="btn-primary" onClick={() => { setMovieForm({ titulo: '', genero: '', duracion: '', clasificacion: '', descripcion: '' }); setShowMovieModal(true); }}>
              ADD MOVIE
            </button>
          )}

          {role === 'operario' && (
            <button className="btn-outline" onClick={() => setPage(page === 'validar' ? 'movies' : 'validar')}>
              {page === 'validar' ? 'BACK' : 'VALIDATE'}
            </button>
          )}

          {role === 'admin' && (
            <button className="btn-outline" onClick={() => setPage(page === 'dashboard' ? 'movies' : 'dashboard')}>
              {page === 'dashboard' ? 'BACK' : 'STATS'}
            </button>
          )}
        </div>
      </header>

      {message && <div className={`message ${message.type}`}>{message.text}</div>}

      {role === 'admin' && page === 'dashboard' && (
        <div className="admin-panel">
          <div className="stats-grid">
            <div className="stat-card">
              <label>REVENUE</label>
              <h3>${stats?.totalMoney.toLocaleString() || 0}</h3>
            </div>
            <div className="stat-card">
              <label>TICKETS</label>
              <h3>{stats?.totalTickets || 0}</h3>
            </div>
          </div>

          <label>OCCUPANCY</label>
          <div className="grid">
            {stats?.occupancy.map(occ => (
              <div key={occ.id} className="card">
                <p className="badge">{occ.fecha} • {occ.hora}</p>
                <h4 className="movie-title">{occ.titulo}</h4>
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: `${(occ.ocupados/occ.total_asientos)*100}%` }}></div>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.7rem'}}>
                  <span>{occ.ocupados} / {occ.total_asientos} SEATS</span>
                  <span>{Math.round((occ.ocupados/occ.total_asientos)*100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(page === 'validar' || (role === 'admin' && page === 'dashboard')) && (
        <div style={{maxWidth:'600px', margin: role === 'admin' ? '4rem auto' : '0 auto'}}>
          <div className="card">
            <label>TICKET VALIDATION</label>
            <div style={{display:'flex', gap:'1rem', marginTop:'1rem'}}>
              <input placeholder="ENTER CODE" value={ticketCode} onChange={e => setTicketCode(e.target.value.toUpperCase())} style={{textAlign:'center', letterSpacing:'5px'}} />
              <button className="btn-primary" onClick={handleValidateTicket}>GO</button>
            </div>

            {validationResult && (
              <div style={{marginTop:'3rem', padding:'2rem', border: '1px solid var(--border)'}}>
                <h3 style={{color: validationResult.status === 'Válido' ? 'var(--success)' : 'var(--danger)', fontSize:'0.8rem', letterSpacing:'2px'}}>{validationResult.status}</h3>
                <p style={{fontSize:'1.2rem', margin:'1rem 0', color:'var(--text-bright)'}}>{validationResult.message}</p>
                {validationResult.ticket && (
                  <div style={{fontSize:'0.8rem'}}>
                    <p>{validationResult.ticket.titulo}</p>
                    <p>{validationResult.ticket.fecha} {validationResult.ticket.hora}</p>
                    {validationResult.status === 'Válido' && (
                      <button className="btn-primary" style={{marginTop:'2rem', width:'100%'}} onClick={handleUseTicket}>USE TICKET</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {(page === 'movies' || page === 'showtimes' || page === 'seats') && (
        <>
          {page === 'movies' && (
            <div className="grid">
              {movies.map(m => (
                <div key={m.id} className="card">
                  <span className="badge">{m.genero}</span>
                  <h3 className="movie-title">{m.titulo}</h3>
                  <p className="movie-desc">{m.descripcion}</p>
                  <div className="card-footer" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span style={{fontSize:'0.7rem'}}>{m.duracion} MIN | {m.clasificacion}</span>
                    <button className="btn-outline" onClick={() => handleSelectMovie(m)}>VIEW</button>
                  </div>
                  {role === 'admin' && (
                    <div style={{display:'flex', gap:'0.5rem', marginTop:'1rem'}}>
                      <button className="btn-outline" style={{flex:1, fontSize:'0.6rem'}} onClick={() => { setMovieForm(m); setShowMovieModal(true); }}>EDIT</button>
                      <button className="btn-outline" style={{flex:1, fontSize:'0.6rem', color:'var(--danger)'}} onClick={() => handleDeleteMovie(m.id)}>DELETE</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {page === 'showtimes' && (
            <div>
              <button className="btn-outline" style={{marginBottom:'3rem'}} onClick={() => setPage('movies')}>BACK</button>
              <h2 className="movie-title" style={{fontSize:'2.5rem'}}>{selectedMovie.titulo}</h2>
              <div className="grid">
                {showtimes.map(s => (
                  <div key={s.id} className="card">
                    <label>{s.sala_nombre}</label>
                    <h3 className="movie-title">{s.fecha} • {s.hora}</h3>
                    <p style={{fontSize:'1.2rem', color:'var(--primary)'}}>${parseFloat(s.precio).toLocaleString()}</p>
                    <button className="btn-primary" style={{width:'100%', marginTop:'2rem'}} onClick={() => handleSelectShowtime(s)}>RESERVE</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {page === 'seats' && (
            <div style={{textAlign:'center'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'4rem'}}>
                <button className="btn-outline" onClick={() => setPage('showtimes')}>BACK</button>
                <div style={{textAlign:'right'}}>
                  <h2 className="movie-title">{selectedMovie.titulo}</h2>
                  <p style={{fontSize:'0.8rem'}}>{selectedShowtime.fecha} • {selectedShowtime.hora}</p>
                </div>
              </div>
              
              <div className="seats-container">
                <div className="screen"></div>
                <div className="seats-grid">
                  {seats.map(seat => (
                    <button
                      key={seat.mapping_id}
                      className={`seat ${seat.estado === 'vendido' ? 'occupied' : ''} ${selectedSeats.includes(seat.asiento_id) ? 'selected' : ''}`}
                      disabled={seat.estado === 'vendido' || role !== 'cliente'}
                      onClick={() => toggleSeat(seat.asiento_id)}
                    >
                      {seat.fila}{seat.columna}
                    </button>
                  ))}
                </div>
              </div>

              {role === 'cliente' && (
                <div className="card" style={{maxWidth:'400px', margin:'0 auto', textAlign:'left'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1.5rem'}}>
                    <label>TOTAL</label>
                    <h3 style={{fontSize:'2rem', color:'var(--primary)'}}>${(selectedSeats.length * parseFloat(selectedShowtime.precio)).toLocaleString()}</h3>
                  </div>
                  <button className="btn-primary" style={{width:'100%'}} onClick={handleBuyTickets}>CHECKOUT</button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showMovieModal && (
        <div className="modal-overlay">
          <div className="modal">
            <label>MOVIE MANAGEMENT</label>
            <form onSubmit={handleSaveMovie} style={{marginTop:'3rem'}}>
              <div className="form-group">
                <label>TITLE</label>
                <input required value={movieForm.titulo} onChange={e => setMovieForm({...movieForm, titulo: e.target.value})} />
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem'}}>
                <div className="form-group">
                  <label>GENRE</label>
                  <input required value={movieForm.genero} onChange={e => setMovieForm({...movieForm, genero: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>CLASS</label>
                  <input required value={movieForm.clasificacion} onChange={e => setMovieForm({...movieForm, clasificacion: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>DURATION</label>
                <input required type="number" value={movieForm.duracion} onChange={e => setMovieForm({...movieForm, duracion: e.target.value})} />
              </div>
              <div className="form-group">
                <label>DESCRIPTION</label>
                <textarea rows="3" value={movieForm.descripcion} onChange={e => setMovieForm({...movieForm, descripcion: e.target.value})} />
              </div>
              <div style={{display:'flex', gap:'1rem', marginTop:'3rem'}}>
                <button type="button" className="btn-outline" style={{flex:1}} onClick={() => setShowMovieModal(false)}>CANCEL</button>
                <button type="submit" className="btn-primary" style={{flex:1}}>SAVE</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
