import { useState, useEffect } from 'react';
import { api } from './api';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [role, setRole] = useState(user?.rol || 'guest');
  const [page, setPage] = useState('movies');
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loginForm, setLoginForm] = useState({ email: '', password: '', nombre: '' });
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [message, setMessage] = useState(null);
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [movieForm, setMovieForm] = useState({ titulo: '', genero: '', duracion: '', clasificacion: '', descripcion: '', imagen_url: '', estado: 'activa' });
  const [userForm, setUserForm] = useState({ nombre: '', email: '', password: '', rol: 'operario' });
  const [stats, setStats] = useState(null);
  const [ticketCode, setTicketCode] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [allSales, setAllSales] = useState([]);
  const [myPurchases, setMyPurchases] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [accessHistory, setAccessHistory] = useState([]);
  const [lastTicket, setLastTicket] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [adminTab, setAdminTab] = useState('sales'); // 'sales' | 'history' | 'reports' | 'users'
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Filtros
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('todos');

  const uniqueGenres = ['todos', ...new Set(movies.map(m => m.genero).filter(Boolean))];
  const filteredMovies = movies.filter(m => {
    const matchesSearch = (m.titulo || '').toLowerCase().includes(search.toLowerCase());
    const matchesGenre = genreFilter === 'todos' || m.genero === genreFilter;
    return matchesSearch && matchesGenre;
  });

  useEffect(() => { loadMovies(); }, [role]);

  useEffect(() => {
    if (role === 'admin' || role === 'operario') {
      loadStats();
      loadAllSales();
      loadAccessHistory();
      if (role === 'admin') loadAllUsers();
    }
    if (role === 'cliente' && user) {
      loadMyPurchases();
    }
    
    // Redirigir según el rol al cambiar de sesión
    if (role === 'admin') setPage('dashboard');
    else if (role === 'operario') setPage('validar');
    else setPage('movies');

    setSelectedMovie(null);
    setSelectedShowtime(null);
    setLastTicket(null);
    setAdminTab('sales');
  }, [role]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/users/login', loginForm);
      setUser(res.data);
      setRole(res.data.rol);
      localStorage.setItem('user', JSON.stringify(res.data));
      showMsg('success', `WELCOME ${res.data.nombre.toUpperCase()}`);
    } catch (err) {
      showMsg('error', 'INVALID CREDENTIALS');
    } finally { setIsLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/users/register', loginForm);
      setUser(res.data);
      setRole(res.data.rol);
      localStorage.setItem('user', JSON.stringify(res.data));
      showMsg('success', 'ACCOUNT CREATED');
    } catch (err) {
      showMsg('error', 'EMAIL ALREADY REGISTERED');
    } finally { setIsLoading(false); }
  };

  const handleLogout = () => {
    if (!window.confirm('¿CERRAR SESIÓN?')) return;
    setUser(null);
    setRole('guest');
    localStorage.removeItem('user');
    setPage('movies');
    showMsg('success', 'LOGGED OUT');
  };

  const loadAllUsers = async () => {
    try {
      const res = await api.get('/users/admin/users');
      setAllUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const loadMyPurchases = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/tickets?usuario_id=${user.id}`);
      setMyPurchases(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/users/admin/users', userForm);
      showMsg('success', 'USER CREATED');
      setShowUserModal(false);
      setUserForm({ nombre: '', email: '', password: '', rol: 'operario' });
      loadAllUsers();
    } catch (err) { showMsg('error', 'SAVE ERROR'); }
    finally { setIsLoading(false); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('DELETE USER?')) return;
    setIsLoading(true);
    try {
      await api.delete(`/users/admin/users/${id}`);
      showMsg('success', 'USER DELETED');
      loadAllUsers();
    } catch (err) { showMsg('error', 'DELETE ERROR'); }
    finally { setIsLoading(false); }
  };

  // Auto-refresh stats/sales
  useEffect(() => {
    let interval;
    if (role === 'admin' || role === 'operario') {
      interval = setInterval(() => {
        loadStats();
        loadAllSales();
        loadAccessHistory();
      }, 10000);
    }
    if (role === 'cliente' && user) {
      interval = setInterval(() => {
        loadMyPurchases();
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [role, dateRange, user]);

  // Auto-refresh seats
  useEffect(() => {
    let interval;
    if (page === 'seats' && selectedShowtime) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/showtimes/${selectedShowtime.id}/seats`);
          setSeats(res.data);
        } catch (err) { console.error(err); }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [page, selectedShowtime]);

  const loadMovies = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/movies?role=${role}`);
      setMovies(res.data);
    } catch (err) {
      showMsg('error', 'CONNECTION ERROR');
    } finally { setIsLoading(false); }
  };

  const loadStats = async () => {
    try {
      const query = dateRange.start && dateRange.end 
        ? `?start_date=${dateRange.start}&end_date=${dateRange.end}` 
        : '';
      const res = await api.get(`/tickets/stats/summary${query}`);
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const loadAllSales = async () => {
    try {
      const res = await api.get('/tickets');
      setAllSales(res.data);
    } catch (err) { console.error(err); }
  };

  const loadAccessHistory = async () => {
    try {
      const res = await api.get('/tickets');
      const used = res.data.filter(t => t.estado === 'usado');
      setAccessHistory(used);
    } catch (err) { console.error(err); }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSelectMovie = async (movie) => {
    setSelectedMovie(movie);
    setIsLoading(true);
    try {
      const res = await api.get('/showtimes');
      const filtered = res.data.filter(s => s.pelicula_id === movie.id);
      setShowtimes(filtered);
      setPage('showtimes');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      showMsg('error', 'DATA ERROR');
    } finally { setIsLoading(false); }
  };

  const handleSelectShowtime = async (showtime) => {
    setSelectedShowtime(showtime);
    setSelectedSeats([]);
    setIsLoading(true);
    try {
      const res = await api.get(`/showtimes/${showtime.id}/seats`);
      setSeats(res.data);
      setPage('seats');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      showMsg('error', 'SEAT ERROR');
    } finally { setIsLoading(false); }
  };

  const toggleSeat = async (seatId) => {
    if (role === 'admin') return; // Admin solo observa
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(prev => prev.filter(id => id !== seatId));
      return;
    }
    try {
      // Bloqueo temporal para evitar doble selección
      await api.post(`/showtimes/${selectedShowtime.id}/lock-seats`, { seats: [seatId] });
      setSelectedSeats(prev => [...prev, seatId]);
    } catch (err) {
      showMsg('error', 'ASIENTO NO DISPONIBLE');
      const res = await api.get(`/showtimes/${selectedShowtime.id}/seats`);
      setSeats(res.data);
    }
  };

  const handleProcessPayment = () => {
    if (!window.confirm(`¿PROCEDER CON LA COMPRA DE ${selectedSeats.length} ASIENTO(S)? TOTAL: $${(selectedSeats.length * parseFloat(selectedShowtime.precio)).toLocaleString()}`)) {
      return;
    }
    setIsPaying(true);
    setTimeout(() => {
      handleBuyTickets();
      setIsPaying(false);
    }, 2000);
  };

  const handleBuyTickets = async () => {
    setIsLoading(true);
    try {
      const res = await api.post('/tickets', {
        funcion_id: selectedShowtime.id,
        asientos: selectedSeats,
        usuario_id: user?.id,
        es_taquilla: role === 'operario'
      });
      setLastTicket({
        ...res.data,
        movie: selectedMovie.titulo,
        time: `${selectedShowtime.fecha} ${selectedShowtime.hora}`,
        seats: seats.filter(s => selectedSeats.includes(s.asiento_id)).map(s => `${s.fila}${s.columna}`).join(', ')
      });
      showMsg('success', 'COMPRA COMPLETADA');
      setPage('confirmation');
      if (role === 'admin') loadStats();
      if (role === 'cliente') loadMyPurchases();
    } catch (err) { showMsg('error', 'ERROR EN COMPRA'); }
    finally { setIsLoading(false); }
  };

  const handleCancelTicket = async (id) => {
    if (!window.confirm('¿CANCELAR TIQUETE Y LIBERAR ASIENTOS?')) return;
    setIsLoading(true);
    try {
      await api.delete(`/tickets/${id}`);
      showMsg('success', 'CANCELADO');
      loadAllSales();
      loadStats();
      if (role === 'cliente') loadMyPurchases();
    } catch (err) { showMsg('error', 'ERROR AL CANCELAR'); }
    finally { setIsLoading(false); }
  };

  const handleValidateTicket = async () => {
    if (!ticketCode) return;
    setValidationResult(null);
    setIsLoading(true);
    try {
      const res = await api.get(`/tickets/validate/${ticketCode}`);
      setValidationResult(res.data);
    } catch (err) {
      setValidationResult({ status: 'INVALID', message: 'NOT FOUND' });
    } finally { setIsLoading(false); }
  };

  const handleUseTicket = async () => {
    setIsLoading(true);
    try {
      await api.post(`/tickets/use/${ticketCode}`);
      showMsg('success', 'VALIDATED');
      handleValidateTicket();
      if (role === 'admin') loadStats();
    } catch (err) {
      showMsg('error', 'VALIDATION ERROR');
    } finally { setIsLoading(false); }
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (movieForm.id) await api.put(`/movies/${movieForm.id}`, movieForm);
      else await api.post('/movies', movieForm);
      showMsg('success', 'SAVED');
      setShowMovieModal(false);
      setMovieForm({ titulo: '', genero: '', duracion: '', clasificacion: '', descripcion: '', imagen_url: '', estado: 'activa' });
      loadMovies();
    } catch (err) {
      showMsg('error', 'SAVE ERROR');
    } finally { setIsLoading(false); }
  };

  const handleDeleteMovie = async (id) => {
    if (!window.confirm('DELETE?')) return;
    setIsLoading(true);
    try {
      await api.delete(`/movies/${id}`);
      showMsg('success', 'DELETED');
      loadMovies();
    } catch (err) {
      showMsg('error', 'DELETE ERROR');
    } finally { setIsLoading(false); }
  };

  const toggleMovieStatus = async (movie) => {
    const nextStatus = movie.estado === 'activa' ? 'inactiva' : 'activa';
    setIsLoading(true);
    try {
      await api.patch(`/movies/${movie.id}/status`, { estado: nextStatus });
      showMsg('success', `MOVIE ${nextStatus.toUpperCase()}`);
      loadMovies();
    } catch (err) {
      showMsg('error', 'STATUS ERROR');
    } finally { setIsLoading(false); }
  };

  const downloadTicketPDF = async () => {
    const ticketElement = document.getElementById('ticket-confirmation');
    if (!ticketElement) return;

    setIsLoading(true);
    try {
      const canvas = await html2canvas(ticketElement, { backgroundColor: '#0a0a0a', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Ticket_${lastTicket.codigo}.pdf`);
      showMsg('success', 'PDF DOWNLOADED');
    } catch (err) {
      showMsg('error', 'PDF ERROR');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="app-root">
      <div className="grain"></div>
      {isLoading && <div className="loader-overlay"><div className="loader"></div></div>}
      
      <header>
        <div className="logo" onClick={() => setPage('movies')} style={{cursor:'pointer'}}>
          THE <span>END</span>
        </div>
        <nav className="nav-links">
          <span className={page === 'movies' ? 'active' : ''} onClick={() => setPage('movies')}>Cartelera</span>
          <span className={page === 'showtimes' ? 'active' : ''} onClick={() => setPage('movies')}>Funciones</span>
          {user && role === 'cliente' && (
            <span className={page === 'my-purchases' ? 'active' : ''} onClick={() => setPage('my-purchases')}>Mis Compras</span>
          )}
          {user && role !== 'cliente' && (
            <span className={page === 'dashboard' || page === 'validar' ? 'active' : ''} onClick={() => setPage(role === 'admin' ? 'dashboard' : 'validar')}>Administración</span>
          )}
          {!user ? (
            <button className="btn-login" onClick={() => setPage('auth')}>ACCEDER</button>
          ) : (
            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
              <span className="admit-one" style={{fontSize:'0.7rem', opacity: 0.6}}>{user.rol.toUpperCase()}</span>
              <span onClick={handleLogout} style={{color:'var(--primary)', fontWeight:'900', cursor:'pointer', fontSize:'0.8rem', letterSpacing:'0.1em'}}>SALIR</span>
            </div>
          )}
        </nav>
      </header>

      {message && <div className={`message ${message.type}`}>{message.text}</div>}

      <main style={{paddingTop: '80px'}}>
        {/* Editorial Header - Only on movies page */}
        {page === 'movies' && (
          <section className="editorial-header">
            <span className="pre-title">Desde 1945 • Cinema Vintage</span>
            <h1 className="main-title">THE END</h1>
            <div className="tapered-line"></div>
            <p className="hero-desc">
              Sumérgete en la época dorada del cine. Una selección curada de obras maestras te espera en las salas de terciopelo de THE END.
            </p>
          </section>
        )}

        <div className="container">
          {/* AUTH */}
          {page === 'auth' && (
            <div className="gold-frame" style={{maxWidth:'450px', margin:'60px auto', background:'white', padding:'40px'}}>
              <div style={{textAlign:'center', marginBottom:'32px'}}>
                <span className="pre-title">Box Office</span>
                <h3 className="movie-meta-title" style={{fontSize:'2rem'}}>{authMode === 'login' ? 'LOGIN' : 'REGISTER'}</h3>
              </div>
              <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                {authMode === 'register' && (
                  <input placeholder="NAME" required value={loginForm.nombre} onChange={e => setLoginForm({...loginForm, nombre: e.target.value})} />
                )}
                <input type="text" placeholder="USERNAME / EMAIL" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
                <input type="password" placeholder="PASSWORD" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                <button type="submit" className="btn-marquee" style={{marginTop:'10px'}}>{authMode === 'login' ? 'ENTER THEATER' : 'CREATE ACCOUNT'}</button>
                <button type="button" style={{background:'transparent', border:'none', color:'var(--secondary)', cursor:'pointer', fontStyle:'italic'}} onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                  {authMode === 'login' ? 'Need an account? Register' : 'Already registered? Login'}
                </button>
              </form>
            </div>
          )}

          {/* MOVIES LIST (Bento Grid) */}
          {page === 'movies' && (
            <div className="movie-grid">
              {movies.length > 0 && (
                <>
                  {/* Featured Movie (The first one) */}
                  <article className="featured-movie">
                    <div className="gold-frame">
                      <div className="featured-poster-container">
                        <img src={movies[0].imagen_url} alt={movies[0].titulo} className="featured-poster" />
                        <div className="featured-overlay">
                          <span className="featured-badge">Featured Presentation</span>
                          <h2 className="featured-title">{movies[0].titulo}</h2>
                        </div>
                      </div>
                    </div>
                    <div className="movie-meta" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'24px'}}>
                      <div style={{flex:1}}>
                        <div className="movie-header">
                          <div className="rating-box">{movies[0].clasificacion || 'A'}</div>
                          <span className="movie-sub-meta">{movies[0].genero} • {movies[0].duracion} MIN</span>
                        </div>
                        <p className="movie-summary">{movies[0].descripcion}</p>
                      </div>
                      <button className="btn-marquee" style={{width:'auto', padding:'15px 30px'}} onClick={() => handleSelectMovie(movies[0])}>VER FUNCIONES</button>
                    </div>
                  </article>

                  {/* Secondary Movies Section */}
                  <div className="secondary-grid" style={{gridColumn: 'span 12', marginTop: '40px'}}>
                    {movies.slice(1).map(m => (
                      <article key={m.id} className="secondary-movie-item">
                        <div className="poster-frame">
                          <div className="secondary-poster-container">
                            <img src={m.imagen_url} alt={m.titulo} className="secondary-poster" />
                          </div>
                        </div>
                        <div className="movie-meta">
                          <div className="movie-header">
                            <div className="rating-box" style={{width:'30px', height:'30px', fontSize:'0.7rem'}}>{m.clasificacion || 'B'}</div>
                            <h3 className="movie-meta-title" style={{fontSize:'1.2rem'}}>{m.titulo}</h3>
                          </div>
                          <p className="movie-sub-meta">{m.genero} • {m.duracion} MIN</p>
                          <button className="btn-marquee" style={{marginTop:'16px', padding:'10px'}} onClick={() => handleSelectMovie(m)}>COMPRAR</button>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* SHOWTIMES */}
          {page === 'showtimes' && (
            <div className="gold-frame" style={{marginTop:'40px', background:'white', padding:'48px'}}>
              <span className="pre-title">Schedule</span>
              <h2 className="main-title" style={{fontSize:'3rem', textAlign:'left', marginBottom:'40px'}}>{selectedMovie.titulo}</h2>
              <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'48px'}}>
                <div className="poster-frame">
                  <img src={selectedMovie.imagen_url} alt={selectedMovie.titulo} style={{width:'100%', aspectRatio:'2/3', objectFit:'cover'}} />
                </div>
                <div>
                  <p className="movie-summary" style={{fontSize:'1.5rem', marginBottom:'32px'}}>{selectedMovie.descripcion}</p>
                  <div className="movie-grid" style={{gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'16px'}}>
                    {showtimes.map(s => (
                      <div key={s.id} className="time-slot evening" onClick={() => handleSelectShowtime(s)}>
                        <span className="time-label">{s.fecha}</span>
                        <span className="time-value">{s.hora}</span>
                        <span className="time-label" style={{marginTop:'8px'}}>${parseFloat(s.precio).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <button className="btn-marquee" style={{marginTop:'40px', width:'200px'}} onClick={() => setPage('movies')}>BACK</button>
                </div>
              </div>
            </div>
          )}

          {/* SEATS (Architectural Style) */}
          {page === 'seats' && (
            <div className="movie-grid" style={{marginTop:'40px'}}>
              <section className="architect-area">
                <div className="architect-grid-pattern"></div>
                <div className="screen-indicator">
                  <div className="screen-line"></div>
                  <span className="screen-text">Projection Surface</span>
                </div>
                <div className="seats-grid-stitch">
                  {seats.map(seat => (
                    <div 
                      key={seat.mapping_id} 
                      className={`seat-stitch ${seat.estado} ${selectedSeats.includes(seat.asiento_id) ? 'selected' : ''}`}
                      onClick={() => seat.estado !== 'vendido' && toggleSeat(seat.asiento_id)}
                    >
                      {seat.fila}{seat.columna}
                    </div>
                  ))}
                </div>
              </section>

              <aside className="ticket-panel">
                <div className="stitch-ticket">
                  <div className="ticket-header-stitch">
                    <span className="admit-one">ADMIT ONE</span>
                    <span className="movie-sub-meta">#MARQUEE-2026</span>
                  </div>
                  <div style={{marginTop:'24px'}}>
                    <span className="pre-title" style={{fontSize:'0.6rem'}}>Presentation</span>
                    <p className="movie-meta-title" style={{fontSize:'1.2rem'}}>{selectedMovie.titulo}</p>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginTop:'16px'}}>
                      <div>
                        <span className="pre-title" style={{fontSize:'0.6rem'}}>Date</span>
                        <p className="movie-sub-meta" style={{fontSize:'0.8rem', color:'black'}}>{selectedShowtime.fecha}</p>
                      </div>
                      <div>
                        <span className="pre-title" style={{fontSize:'0.6rem'}}>Time</span>
                        <p className="movie-sub-meta" style={{fontSize:'0.8rem', color:'black'}}>{selectedShowtime.hora}</p>
                      </div>
                    </div>
                    <div style={{marginTop:'24px', padding:'16px', border:'1px dashed var(--secondary)', textAlign:'center'}}>
                      <span className="pre-title" style={{fontSize:'0.6rem'}}>Seats Selected</span>
                      <p className="main-title" style={{fontSize:'1.5rem', margin:'8px 0'}}>{selectedSeats.length > 0 ? selectedSeats.length : '0'}</p>
                    </div>
                  </div>
                </div>

                <div className="gold-frame" style={{background:'var(--surface-container-high)', border:'none'}}>
                  <h3 className="admit-one" style={{borderBottom:'1px solid rgba(0,0,0,0.1)', paddingBottom:'12px', marginBottom:'16px'}}>Summary</h3>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                    <span className="movie-sub-meta">Tickets x{selectedSeats.length}</span>
                    <span className="movie-meta-title" style={{fontSize:'1rem'}}>${(selectedSeats.length * parseFloat(selectedShowtime.precio)).toLocaleString()}</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid rgba(0,0,0,0.1)', paddingTop:'12px', marginTop:'12px'}}>
                    <span className="admit-one">Total</span>
                    <span className="movie-meta-title" style={{fontSize:'1.5rem'}}>${(selectedSeats.length * parseFloat(selectedShowtime.precio)).toLocaleString()}</span>
                  </div>
                  <button className="btn-marquee" style={{marginTop:'24px'}} disabled={selectedSeats.length === 0} onClick={handleProcessPayment}>
                    {isPaying ? 'PROCESSING...' : 'CONFIRM PURCHASE'}
                  </button>
                </div>
              </aside>
            </div>
          )}

          {/* MY PURCHASES (Cliente) */}
          {page === 'my-purchases' && (
            <div style={{marginTop:'40px'}}>
              <div style={{marginBottom:'32px', textAlign:'center'}}>
                <span className="pre-title">Historial</span>
                <h2 className="main-title" style={{fontSize:'2.5rem'}}>Mis Tiquetes</h2>
              </div>
              {myPurchases.length === 0 ? (
                <div className="poster-frame" style={{textAlign:'center', padding:'48px'}}>
                  <p className="movie-summary">No tienes compras registradas aún.</p>
                  <button className="btn-marquee" style={{marginTop:'24px', width:'auto', padding:'12px 32px'}} onClick={() => setPage('movies')}>VER CARTELERA</button>
                </div>
              ) : (
                <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                  {myPurchases.map(ticket => (
                    <div key={ticket.id} className="gold-frame" style={{background:'white', padding:'24px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:'16px', alignItems:'center'}}>
                      <div>
                        <span className="pre-title" style={{fontSize:'0.6rem'}}>Película</span>
                        <p className="movie-meta-title" style={{fontSize:'1rem', marginTop:'4px'}}>{ticket.titulo}</p>
                      </div>
                      <div>
                        <span className="pre-title" style={{fontSize:'0.6rem'}}>Función</span>
                        <p className="movie-sub-meta" style={{color:'black', marginTop:'4px'}}>{ticket.fecha} {ticket.hora}</p>
                      </div>
                      <div>
                        <span className="pre-title" style={{fontSize:'0.6rem'}}>Asientos</span>
                        <p className="movie-sub-meta" style={{color:'black', marginTop:'4px'}}>{ticket.asientos || '—'}</p>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <p className="movie-meta-title" style={{fontSize:'1.2rem', color:'var(--primary)'}}>${parseFloat(ticket.total).toLocaleString()}</p>
                        <span className={`featured-badge`} style={{margin:0, background: ticket.estado === 'activo' ? 'var(--secondary)' : ticket.estado === 'usado' ? '#555' : '#a00'}}>{ticket.estado.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONFIRMATION (Ticket Visual) */}
          {page === 'confirmation' && lastTicket && (
            <div className="stitch-ticket" style={{maxWidth:'500px', margin:'60px auto', padding:'48px'}} id="ticket-confirmation">
              <div style={{textAlign:'center', marginBottom:'32px'}}>
                <div style={{background:'white', padding:'16px', display:'inline-block', border:'1px solid #eee'}}>
                  <QRCodeSVG value={lastTicket.codigo} size={150} />
                </div>
                <h2 className="main-title" style={{fontSize:'2rem', marginTop:'24px'}}>#{lastTicket.codigo}</h2>
              </div>
              <div style={{borderTop:'1px solid #eee', paddingTop:'24px'}}>
                <p className="movie-sub-meta">Film: <span style={{color:'black', fontStyle:'normal'}}>{lastTicket.movie}</span></p>
                <p className="movie-sub-meta">Time: <span style={{color:'black', fontStyle:'normal'}}>{lastTicket.time}</span></p>
                <p className="movie-sub-meta">Seats: <span style={{color:'black', fontStyle:'normal'}}>{lastTicket.seats}</span></p>
                <p className="movie-sub-meta" style={{fontSize:'1.2rem', marginTop:'16px'}}>Total: <span style={{color:'var(--primary)', fontStyle:'normal', fontWeight:'900'}}>${parseFloat(lastTicket.total).toLocaleString()}</span></p>
              </div>
              <div style={{display:'flex', gap:'16px', marginTop:'32px'}}>
                <button className="btn-marquee" style={{flex:1, padding:'12px'}} onClick={() => setPage('movies')}>HOME</button>
                <button className="btn-marquee" style={{flex:1, padding:'12px', background:'var(--secondary)'}} onClick={downloadTicketPDF}>PDF</button>
              </div>
            </div>
          )}

          {/* MANAGEMENT (Simplified Admin/Staff View) */}
          {(page === 'dashboard' || page === 'validar') && (
            <div className="movie-grid" style={{marginTop:'40px'}}>
              <aside className="secondary-movie" style={{gridColumn:'span 3'}}>
                <div className="gold-frame" style={{background:'var(--surface-container-high)', border:'none', padding:'24px'}}>
                  <h2 className="admit-one" style={{marginBottom:'24px'}}>Management</h2>
                  <nav style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                    {role === 'admin' && (
                      <>
                        <button className="btn-marquee" style={{padding:'12px', fontSize:'0.7rem', background: adminTab==='sales' ? 'var(--primary-container)' : ''}} onClick={() => setAdminTab('sales')}>Ventas</button>
                        <button className="btn-marquee" style={{padding:'12px', fontSize:'0.7rem', background: adminTab==='movies' ? 'var(--primary-container)' : ''}} onClick={() => setAdminTab('movies')}>Películas</button>
                        <button className="btn-marquee" style={{padding:'12px', fontSize:'0.7rem', background: adminTab==='users' ? 'var(--primary-container)' : ''}} onClick={() => setAdminTab('users')}>Personal</button>
                      </>
                    )}
                    <button className="btn-marquee" style={{padding:'12px', fontSize:'0.7rem', background:'var(--secondary)'}} onClick={() => setPage('validar')}>Ticket Scanner</button>
                  </nav>
                </div>
              </aside>

              <main style={{gridColumn:'span 9'}}>
                {page === 'validar' ? (
                  <div className="gold-frame" style={{background:'white', padding:'48px', textAlign:'center'}}>
                    <span className="pre-title">Security Check</span>
                    <h3 className="main-title" style={{fontSize:'2rem'}}>Validate Ticket</h3>
                    <input placeholder="ENTER 8-DIGIT SERIAL" value={ticketCode} onChange={e => setTicketCode(e.target.value.toUpperCase())} style={{fontSize:'2rem', textAlign:'center', letterSpacing:'8px', width:'100%', marginBottom:'32px'}} />
                    <button className="btn-marquee" onClick={handleValidateTicket}>SEARCH ARCHIVES</button>
                    {validationResult && (
                      <div className="poster-frame" style={{marginTop:'32px', padding:'24px'}}>
                        <p className="admit-one">Status: <span style={{color: validationResult.status === 'Válido' ? 'green' : 'red'}}>{validationResult.status}</span></p>
                        {validationResult.ticket && (
                          <div style={{marginTop:'16px'}}>
                            <p className="movie-meta-title">{validationResult.ticket.titulo}</p>
                            {validationResult.status === 'Válido' && (
                              <button className="btn-marquee" style={{marginTop:'24px'}} onClick={handleUseTicket}>ADMIT CLIENT</button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="gold-frame" style={{background:'white', padding:'32px'}}>
                    {adminTab === 'users' ? (
                      <div>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px'}}>
                          <h3 className="movie-meta-title">Staff Records</h3>
                          <button className="btn-marquee" style={{width:'auto', padding:'10px 20px'}} onClick={() => setShowUserModal(true)}>+ ADD STAFF</button>
                        </div>
                        <table style={{width:'100%', borderCollapse:'collapse'}}>
                          <thead>
                            <tr style={{borderBottom:'2px solid var(--secondary)'}}>
                              <th className="admit-one" style={{textAlign:'left', padding:'12px'}}>Name</th>
                              <th className="admit-one" style={{textAlign:'left', padding:'12px'}}>Identity</th>
                              <th className="admit-one" style={{textAlign:'left', padding:'12px'}}>Role</th>
                              <th className="admit-one" style={{textAlign:'left', padding:'12px'}}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allUsers.map(u => (
                              <tr key={u.id} style={{borderBottom:'1px solid #eee'}}>
                                <td className="movie-sub-meta" style={{color:'black', padding:'12px'}}>{u.nombre}</td>
                                <td className="movie-sub-meta" style={{color:'black', padding:'12px'}}>{u.email}</td>
                                <td className="movie-sub-meta" style={{color:'black', padding:'12px'}}><span className="featured-badge" style={{margin:0}}>{u.rol}</span></td>
                                <td style={{padding:'12px'}}>{u.email !== 'admin@cinema.com' && <button onClick={() => handleDeleteUser(u.id)} style={{color:'red', background:'none', border:'none', cursor:'pointer'}}>VOID</button>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : adminTab === 'movies' ? (
                      <div>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px'}}>
                          <h3 className="movie-meta-title">Gestión de Películas</h3>
                          <button className="btn-marquee" style={{width:'auto', padding:'10px 20px'}} onClick={() => { setMovieForm({ titulo:'', genero:'', duracion:'', clasificacion:'', descripcion:'', imagen_url:'', estado:'activa' }); setShowMovieModal(true); }}>+ AGREGAR</button>
                        </div>
                        <table style={{width:'100%', borderCollapse:'collapse'}}>
                          <thead>
                            <tr style={{borderBottom:'2px solid var(--secondary)'}}>
                              <th className="admit-one" style={{textAlign:'left', padding:'12px'}}>Título</th>
                              <th className="admit-one" style={{textAlign:'left', padding:'12px'}}>Género</th>
                              <th className="admit-one" style={{textAlign:'left', padding:'12px'}}>Estado</th>
                              <th className="admit-one" style={{textAlign:'left', padding:'12px'}}>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {movies.map(m => (
                              <tr key={m.id} style={{borderBottom:'1px solid #eee'}}>
                                <td className="movie-sub-meta" style={{color:'black', padding:'12px', fontStyle:'normal'}}>{m.titulo}</td>
                                <td className="movie-sub-meta" style={{color:'black', padding:'12px'}}>{m.genero}</td>
                                <td style={{padding:'12px'}}><span className="featured-badge" style={{margin:0, background: m.estado==='activa' ? 'var(--secondary)' : '#999'}}>{m.estado}</span></td>
                                <td style={{padding:'12px', display:'flex', gap:'8px'}}>
                                  <button onClick={() => { setMovieForm({...m}); setShowMovieModal(true); }} style={{color:'var(--primary)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-headline)', fontWeight:700, fontSize:'0.7rem', letterSpacing:'0.1em'}}>EDITAR</button>
                                  <button onClick={() => toggleMovieStatus(m)} style={{color:'var(--secondary)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-headline)', fontWeight:700, fontSize:'0.7rem', letterSpacing:'0.1em'}}>{m.estado==='activa' ? 'DESACTIVAR' : 'ACTIVAR'}</button>
                                  <button onClick={() => handleDeleteMovie(m.id)} style={{color:'red', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-headline)', fontWeight:700, fontSize:'0.7rem', letterSpacing:'0.1em'}}>ELIMINAR</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div>
                        <h3 className="movie-meta-title" style={{marginBottom:'32px'}}>Panel de Ventas</h3>
                        <div className="movie-grid" style={{gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'16px'}}>
                          <div className="poster-frame" style={{textAlign:'center'}}>
                            <span className="admit-one">Ingresos Totales</span>
                            <p className="main-title" style={{fontSize:'2rem', margin:'8px 0'}}>${parseFloat(stats?.totalMoney || 0).toLocaleString()}</p>
                          </div>
                          <div className="poster-frame" style={{textAlign:'center'}}>
                            <span className="admit-one">Tiquetes Vendidos</span>
                            <p className="main-title" style={{fontSize:'2rem', margin:'8px 0'}}>{stats?.totalTickets || 0}</p>
                          </div>
                        </div>
                        {allSales.length > 0 && (
                          <div style={{marginTop:'32px'}}>
                            <h4 className="admit-one" style={{marginBottom:'16px'}}>Últimas Ventas</h4>
                            <table style={{width:'100%', borderCollapse:'collapse'}}>
                              <thead>
                                <tr style={{borderBottom:'2px solid var(--secondary)'}}>
                                  <th className="admit-one" style={{textAlign:'left', padding:'8px'}}>Código</th>
                                  <th className="admit-one" style={{textAlign:'left', padding:'8px'}}>Película</th>
                                  <th className="admit-one" style={{textAlign:'left', padding:'8px'}}>Cliente</th>
                                  <th className="admit-one" style={{textAlign:'left', padding:'8px'}}>Total</th>
                                  <th className="admit-one" style={{textAlign:'left', padding:'8px'}}>Estado</th>
                                  <th className="admit-one" style={{textAlign:'left', padding:'8px'}}>Acción</th>
                                </tr>
                              </thead>
                              <tbody>
                                {allSales.slice(0, 20).map(ticket => (
                                  <tr key={ticket.id} style={{borderBottom:'1px solid #eee'}}>
                                    <td className="movie-sub-meta" style={{color:'black', padding:'8px', fontFamily:'monospace', fontStyle:'normal'}}>{ticket.codigo}</td>
                                    <td className="movie-sub-meta" style={{color:'black', padding:'8px', fontStyle:'normal'}}>{ticket.titulo}</td>
                                    <td className="movie-sub-meta" style={{color:'black', padding:'8px', fontStyle:'normal'}}>{ticket.usuario_nombre || 'Taquilla'}</td>
                                    <td className="movie-sub-meta" style={{color:'black', padding:'8px', fontStyle:'normal'}}>${parseFloat(ticket.total).toLocaleString()}</td>
                                    <td style={{padding:'8px'}}><span className="featured-badge" style={{margin:0, background: ticket.estado==='activo' ? 'var(--secondary)' : ticket.estado==='usado' ? '#555' : '#a00'}}>{ticket.estado}</span></td>
                                    <td style={{padding:'8px'}}>{ticket.estado !== 'cancelado' && <button onClick={() => handleCancelTicket(ticket.id)} style={{color:'red', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-headline)', fontWeight:700, fontSize:'0.65rem', letterSpacing:'0.1em'}}>CANCELAR</button>}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </main>
            </div>
          )}
        </div>
      </main>

      <footer>
        <div className="footer-credits">
          © 1945 THE END. Conservando la magia del séptimo arte desde la época dorada.
        </div>
        <div style={{display:'flex', gap:'24px'}}>
          <span className="admit-one" style={{fontSize:'0.6rem', opacity: 0.5}}>Archivos</span>
          <span className="admit-one" style={{fontSize:'0.6rem', opacity: 0.5}}>Privacidad</span>
          <span className="admit-one" style={{fontSize:'0.6rem', opacity: 0.5}}>Boletería</span>
        </div>
      </footer>

      {/* MODALS */}
      {showMovieModal && (
        <div className="modal-overlay">
          <div className="gold-frame" style={{background:'white', width:'90%', maxWidth:'500px', padding:'40px'}}>
            <h3 className="movie-meta-title" style={{marginBottom:'24px'}}>{movieForm.id ? 'UPDATE FILM' : 'REGISTER FILM'}</h3>
            <form onSubmit={handleSaveMovie} style={{display:'flex', flexDirection:'column', gap:'16px'}}>
              <input placeholder="TITLE" required value={movieForm.titulo} onChange={e => setMovieForm({...movieForm, titulo: e.target.value})} />
              <input placeholder="GENRE" required value={movieForm.genero} onChange={e => setMovieForm({...movieForm, genero: e.target.value})} />
              <input placeholder="POSTER URL" value={movieForm.imagen_url} onChange={e => setMovieForm({...movieForm, imagen_url: e.target.value})} />
              <textarea placeholder="SYNOPSIS" value={movieForm.descripcion} onChange={e => setMovieForm({...movieForm, descripcion: e.target.value})} rows="4" />
              <div style={{display:'flex', gap:'16px', marginTop:'16px'}}>
                <button type="button" className="btn-marquee" style={{background:'var(--secondary)', flex:1}} onClick={() => setShowMovieModal(false)}>CANCEL</button>
                <button type="submit" className="btn-marquee" style={{flex:1}}>COMMIT</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="modal-overlay">
          <div className="gold-frame" style={{background:'white', width:'90%', maxWidth:'500px', padding:'40px'}}>
            <h3 className="movie-meta-title" style={{marginBottom:'24px'}}>STAFF REGISTRATION</h3>
            <form onSubmit={handleSaveUser} style={{display:'flex', flexDirection:'column', gap:'16px'}}>
              <input placeholder="NAME" required value={userForm.nombre} onChange={e => setUserForm({...userForm, nombre: e.target.value})} />
              <input placeholder="IDENTITY / EMAIL" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
              <input placeholder="SECURITY CODE" required type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
              <select value={userForm.rol} onChange={e => setUserForm({...userForm, rol: e.target.value})} style={{padding:'15px', border:'1px solid var(--accent)'}}>
                <option value="operario">Operario (Staff)</option>
                <option value="admin">Administrator</option>
              </select>
              <div style={{display:'flex', gap:'16px', marginTop:'16px'}}>
                <button type="button" className="btn-marquee" style={{background:'var(--secondary)', flex:1}} onClick={() => setShowUserModal(false)}>CANCEL</button>
                <button type="submit" className="btn-marquee" style={{flex:1}}>REGISTER</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
