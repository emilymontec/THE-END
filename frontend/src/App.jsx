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
    setAdminTab(role === 'admin' ? 'sales' : 'dashboard');
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
      {isLoading && <div className="loader-overlay"><div className="loader"></div></div>}
      
      <div className="container">
        <header>
          <h1 onClick={() => setPage('movies')} style={{cursor:'pointer'}}>TASY<span>MOVIE</span></h1>
          <nav className="nav-links">
            <span onClick={() => setPage('movies')}>ALL</span>
            <span onClick={() => setPage('movies')}>MOVIE</span>
            {user && role === 'cliente' && <span onClick={() => setPage('my-purchases')}>PROFILE</span>}
            <span onClick={() => setPage('movies')}>TRENDING</span>
            {!user ? (
              <button className="btn-login" onClick={() => setPage('auth')}>LOG-IN</button>
            ) : (
              <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                <span className="badge" style={{borderRadius:'20px'}}>{user.rol.toUpperCase()}</span>
                <span onClick={handleLogout} style={{color:'var(--primary)'}}>LOGOUT</span>
              </div>
            )}
          </nav>
        </header>
      </div>

      {message && <div className={`message ${message.type}`}>{message.text}</div>}

      {/* HERO SECTION - Only on movies page */}
      {page === 'movies' && movies.length > 0 && (
        <div className="hero">
          <div className="hero-bg" style={{backgroundImage: `url(${movies[0].imagen_url || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=2059'})`}}></div>
          <div className="container">
            <div className="hero-content">
              <p className="hero-subtitle">What's that</p>
              <h1 className="hero-title">{movies[0].titulo}</h1>
              <p className="hero-desc">{movies[0].descripcion || 'Experience the magic of cinema with the latest blockbusters and timeless classics.'}</p>
              <div className="hero-btns">
                <button className="btn-primary" onClick={() => handleSelectMovie(movies[0])}>SOURCE: WIKIPEDIA</button>
                <button className="btn-secondary" onClick={() => handleSelectMovie(movies[0])}>READ MORE</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container">
        {/* AUTH */}
        {page === 'auth' && (
          <div className="card" style={{maxWidth:'400px', margin:'40px auto', background:'var(--bg-card)', padding:'40px', borderRadius:'20px'}}>
            <h3 style={{textAlign:'center', marginBottom:'30px', fontSize:'1.5rem'}}>{authMode === 'login' ? 'LOGIN' : 'REGISTER'}</h3>
            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
              {authMode === 'register' && (
                <input placeholder="Nombre" required value={loginForm.nombre} onChange={e => setLoginForm({...loginForm, nombre: e.target.value})} style={{marginBottom:'15px'}} />
              )}
              <input type="text" placeholder="Usuario / Email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} style={{marginBottom:'15px'}} />
              <input type="password" placeholder="Contraseña" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} style={{marginBottom:'25px'}} />
              <button type="submit" className="btn-primary" style={{width:'100%'}}>{authMode === 'login' ? 'Entrar' : 'Crear Cuenta'}</button>
              <button type="button" style={{width:'100%', border:'none', background:'transparent', color:'var(--text-muted)', marginTop:'20px', fontSize:'0.8rem'}} onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                {authMode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Login'}
              </button>
            </form>
          </div>
        )}

        {/* MENU POR ROL (ONLY ADMIN/STAFF) */}
        {user && role !== 'cliente' && (
          <div className="genre-bar" style={{justifyContent:'center', borderBottom:'1px solid #333', marginBottom:'40px'}}>
            {role === 'operario' && (
              <>
                <button className={`genre-pill ${page === 'validar' ? 'active' : ''}`} onClick={() => setPage('validar')}>Validar Tiquetes</button>
                <button className={`genre-pill ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>Ocupación</button>
              </>
            )}
            {role === 'admin' && (
              <>
                <button className={`genre-pill ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>Dashboard</button>
                <button className={`genre-pill ${adminTab === 'users' ? 'active' : ''}`} onClick={() => { setPage('dashboard'); setAdminTab('users'); }}>Usuarios</button>
                <button className={`genre-pill ${adminTab === 'reports' ? 'active' : ''}`} onClick={() => { setPage('dashboard'); setAdminTab('reports'); }}>Reportes</button>
                <button className={`genre-pill ${adminTab === 'sales' ? 'active' : ''}`} onClick={() => { setPage('dashboard'); setAdminTab('sales'); }}>Ventas</button>
              </>
            )}
          </div>
        )}

        {/* MOVIES LIST */}
        {page === 'movies' && (
          <div>
            <div className="genre-bar">
              {uniqueGenres && uniqueGenres.map(g => (
                <button 
                  key={g} 
                  className={`genre-pill ${genreFilter === g ? 'active' : ''}`}
                  onClick={() => setGenreFilter(g)}
                >
                  {g.toUpperCase()}
                </button>
              ))}
              {role === 'admin' && <button className="genre-pill" style={{border:'1px dashed var(--primary)'}} onClick={() => setShowMovieModal(true)}>+</button>}
            </div>

            <div className="movie-section-title">
              <h2>REKOMENDED | {genreFilter.toUpperCase()} MOVIE</h2>
              <span style={{fontSize:'0.8rem', color:'var(--text-muted)', cursor:'pointer'}}>SELECT ALL</span>
            </div>

            <div className="movie-grid">
              {filteredMovies && filteredMovies.map(m => (
                <div key={m.id} className="movie-card" style={{opacity: m.estado === 'inactiva' ? 0.6 : 1}} onClick={() => handleSelectMovie(m)}>
                  <img src={m.imagen_url || 'https://via.placeholder.com/300x450'} alt={m.titulo} className="movie-poster" />
                  <div className="movie-info">
                    <h3>{m.titulo}</h3>
                    <p>{m.genero || 'Cinema'}</p>
                    {role === 'admin' && (
                      <div style={{marginTop:'10px', display:'flex', gap:'5px'}}>
                        <button onClick={(e) => { e.stopPropagation(); setMovieForm(m); setShowMovieModal(true); }} style={{flex:1, fontSize:'0.6rem', padding:'5px'}}>Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteMovie(m.id); }} style={{flex:1, fontSize:'0.6rem', padding:'5px', color:'var(--danger)'}}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* TRENDING SECTION AT BOTTOM */}
            {movies.length > 1 && (
              <div className="trending-section">
                <img src={movies[1].imagen_url} alt="trending" className="trending-poster" />
                <div className="trending-content">
                  <p style={{color:'var(--primary)', fontSize:'0.8rem', fontWeight:'700', textTransform:'uppercase'}}>{movies[1].genero} MOVIE</p>
                  <h2 style={{fontSize:'2.5rem', margin:'10px 0'}}>{movies[1].titulo}</h2>
                  <p style={{color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:'20px'}}>{movies[1].descripcion}</p>
                  <div style={{display:'flex', gap:'15px'}}>
                    <button className="btn-primary" onClick={() => handleSelectMovie(movies[1])}>WATCH NOW</button>
                    <button className="btn-secondary" onClick={() => handleSelectMovie(movies[1])}>READ MORE</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SHOWTIMES */}
        {page === 'showtimes' && (
          <div className="card" style={{marginTop:'40px', padding:'40px'}}>
            <button className="btn-secondary" onClick={() => setPage('movies')} style={{marginBottom:'30px'}}>← VOLVER</button>
            <div style={{display:'flex', gap:'40px', alignItems:'flex-start'}}>
              <img src={selectedMovie.imagen_url} alt={selectedMovie.titulo} style={{width:'200px', borderRadius:'15px', border:'2px solid var(--primary)'}} />
              <div>
                <h2 style={{fontSize:'2.5rem', marginBottom:'10px'}}>{selectedMovie.titulo}</h2>
                <p style={{color:'var(--text-muted)', marginBottom:'30px'}}>{selectedMovie.descripcion}</p>
                <div className="movie-grid" style={{gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))'}}>
                  {showtimes && showtimes.map(s => (
                    <div key={s.id} className="movie-card" style={{textAlign:'center', padding:'20px'}} onClick={() => handleSelectShowtime(s)}>
                      <h4 style={{color:'var(--primary)'}}>{s.fecha}</h4>
                      <p style={{fontSize:'1.2rem', fontWeight:'800'}}>{s.hora}</p>
                      <p style={{marginTop:'10px', fontSize:'0.9rem'}}><b>${parseFloat(s.precio).toLocaleString()}</b></p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEATS */}
        {page === 'seats' && (
          <div className="card" style={{marginTop:'40px', padding:'40px'}}>
            <button className="btn-secondary" onClick={() => setPage('showtimes')} style={{marginBottom:'30px'}}>← VOLVER</button>
            <div style={{textAlign:'center', marginBottom:'40px'}}>
              <h2 style={{fontSize:'2rem'}}>{selectedMovie.titulo}</h2>
              <p style={{color:'var(--primary)', fontWeight:'700'}}>{selectedShowtime.fecha} @ {selectedShowtime.hora}</p>
            </div>
            
            <div className="seats-container">
              <div className="screen"></div>
              <div className="seats-grid">
                {seats && seats.map(seat => (
                  <button 
                    key={seat.mapping_id} 
                    className={`seat ${seat.estado} ${selectedSeats.includes(seat.asiento_id) ? 'selected' : ''}`}
                    disabled={seat.estado === 'vendido'}
                    onClick={() => toggleSeat(seat.asiento_id)}
                  >
                    {seat.fila}{seat.columna}
                  </button>
                ))}
              </div>
            </div>

            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'40px', padding:'20px', background:'rgba(255,255,255,0.05)', borderRadius:'15px'}}>
              <div>
                <p style={{color:'var(--text-muted)'}}>Asientos: {selectedSeats.length}</p>
                <h3 style={{fontSize:'1.5rem'}}>TOTAL: ${(selectedSeats.length * parseFloat(selectedShowtime.precio)).toLocaleString()}</h3>
              </div>
              <button className="btn-primary" style={{padding:'15px 40px'}} disabled={selectedSeats.length === 0} onClick={handleProcessPayment}>
                {isPaying ? 'PROCESANDO...' : (role === 'cliente' ? 'COMPRAR AHORA' : 'VENDER EN TAQUILLA')}
              </button>
            </div>
          </div>
        )}

        {/* CONFIRMATION */}
        {page === 'confirmation' && lastTicket && (
          <div className="card" style={{maxWidth:'500px', margin:'40px auto', textAlign:'center', padding:'40px', border:'2px dashed var(--primary)'}} id="ticket-confirmation">
            <div style={{background:'white', padding:'20px', display:'inline-block', borderRadius:'10px', marginBottom:'20px'}}>
              <QRCodeSVG value={lastTicket.codigo} size={150} />
            </div>
            <h2 style={{letterSpacing:'2px'}}>¡TIQUETE GENERADO!</h2>
            <h3 style={{color:'var(--primary)', fontSize:'2rem', margin:'10px 0'}}>#{lastTicket.codigo}</h3>
            <div style={{textAlign:'left', margin:'30px 0', borderTop:'1px solid #333', paddingTop:'20px'}}>
              <p><b>PELÍCULA:</b> {lastTicket.movie}</p>
              <p><b>FUNCIÓN:</b> {lastTicket.time}</p>
              <p><b>ASIENTOS:</b> {lastTicket.seats}</p>
              <p><b>TOTAL:</b> ${parseFloat(lastTicket.total).toLocaleString()}</p>
            </div>
            <div style={{display:'flex', gap:'10px'}}>
              <button className="btn-primary" style={{flex:1}} onClick={() => setPage('movies')}>INICIO</button>
              <button className="btn-secondary" style={{flex:1}} onClick={downloadTicketPDF}>DESCARGAR PDF</button>
            </div>
          </div>
        )}

        {/* DASHBOARD & ADMIN */}
        {page === 'dashboard' && (
          <div style={{marginTop:'20px'}}>
            <div className="stats-grid">
              <div className="stat-card" style={{background:'linear-gradient(45deg, #1a0202, #330000)', border:'none'}}>
                <label style={{textTransform:'uppercase', fontSize:'0.7rem', letterSpacing:'1px'}}>Ventas Totales</label>
                <h3 style={{fontSize:'2rem', color:'white'}}>${parseFloat(stats?.totalMoney || 0).toLocaleString()}</h3>
              </div>
              <div className="stat-card" style={{background:'var(--bg-card)'}}>
                <label style={{textTransform:'uppercase', fontSize:'0.7rem', letterSpacing:'1px'}}>Tiquetes Emitidos</label>
                <h3 style={{fontSize:'2rem', color:'var(--primary)'}}>{stats?.totalTickets || 0}</h3>
              </div>
            </div>

            {adminTab === 'reports' && role === 'admin' && (
              <div className="grid">
                <div className="card">
                  <h4>TOP PELÍCULAS</h4>
                  {stats?.topMovies && stats.topMovies.map((m, i) => (
                    <div key={i} style={{marginBottom:'15px'}}>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                        <small>{m.titulo}</small>
                        <small>{m.total_tickets} tqs</small>
                      </div>
                      <div className="progress-container"><div className="progress-bar" style={{width:`${(m.total_tickets*100/(stats.totalTickets||1))}%`}}></div></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminTab === 'users' && role === 'admin' && (
              <div className="card">
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                  <h4>GESTIÓN DE USUARIOS</h4>
                  <button className="btn-primary" onClick={() => setShowUserModal(true)}>+</button>
                </div>
                <table>
                  <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Acción</th></tr></thead>
                  <tbody>
                    {allUsers && allUsers.map(u => (
                      <tr key={u.id}>
                        <td>{u.nombre}</td>
                        <td>{u.email}</td>
                        <td><span className="badge" style={{borderRadius:'20px'}}>{u.rol}</span></td>
                        <td>{u.email !== 'admin@cinema.com' && <button onClick={() => handleDeleteUser(u.id)} style={{color:'red', background:'transparent', border:'none'}}>X</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === 'sales' && (
              <div className="card">
                <h4>VENTAS RECIENTES</h4>
                <table>
                  <thead><tr><th>Código</th><th>Película</th><th>Total</th><th>Acción</th></tr></thead>
                  <tbody>
                    {allSales && allSales.filter(s => role === 'admin' || s.es_taquilla).map(s => (
                      <tr key={s.id}>
                        <td>{s.codigo}</td>
                        <td>{s.titulo}</td>
                        <td>${parseFloat(s.total).toLocaleString()}</td>
                        <td>
                          <button className="btn-secondary" style={{padding:'5px 15px', fontSize:'0.7rem'}} onClick={() => { setLastTicket({codigo:s.codigo, movie:s.titulo, time:`${s.fecha} ${s.hora}`, seats:s.asientos, total:s.total}); setPage('confirmation'); }}>Ver</button>
                          {role === 'admin' && s.estado === 'activo' && <button onClick={() => handleCancelTicket(s.id)} style={{color:'red', background:'transparent', border:'none', marginLeft:'10px'}}>X</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MY PURCHASES */}
        {page === 'my-purchases' && (
          <div className="card" style={{marginTop:'40px'}}>
            <h3>MI HISTORIAL DE COMPRAS</h3>
            <table>
              <thead><tr><th>Fecha</th><th>Película</th><th>Total</th><th>Acción</th></tr></thead>
              <tbody>
                {myPurchases && myPurchases.map(p => (
                  <tr key={p.id}>
                    <td>{new Date(p.fecha_compra).toLocaleDateString()}</td>
                    <td>{p.titulo}</td>
                    <td>${parseFloat(p.total).toLocaleString()}</td>
                    <td><button className="btn-primary" style={{padding:'5px 15px', fontSize:'0.7rem'}} onClick={() => { setLastTicket({codigo:p.codigo, movie:p.titulo, time:`${p.fecha} ${p.hora}`, seats:p.asientos, total:p.total}); setPage('confirmation'); }}>Ver QR</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VALIDAR */}
        {page === 'validar' && (
          <div className="card" style={{maxWidth:'500px', margin:'40px auto', padding:'40px', textAlign:'center'}}>
            <h3>VALIDAR ENTRADA</h3>
            <p style={{color:'var(--text-muted)', marginBottom:'20px'}}>Ingrese el código de 8 dígitos del tiquete</p>
            <input placeholder="CÓDIGO (EJ: AB12CD34)" value={ticketCode} onChange={e => setTicketCode(e.target.value.toUpperCase())} style={{fontSize:'1.5rem', textAlign:'center', letterSpacing:'4px', marginBottom:'20px'}} />
            <button className="btn-primary" style={{width:'100%'}} onClick={handleValidateTicket}>CONSULTAR TIQUETE</button>
            
            {validationResult && (
              <div style={{marginTop:'30px', padding:'20px', border:'1px solid #333', borderRadius:'15px', background:'rgba(255,255,255,0.02)'}}>
                <p>ESTADO: <span style={{color: validationResult.status === 'Válido' ? 'var(--success)' : 'var(--danger)', fontWeight:'800'}}>{validationResult.status.toUpperCase()}</span></p>
                {validationResult.ticket && (
                  <>
                    <h4 style={{margin:'15px 0 5px 0'}}>{validationResult.ticket.titulo}</h4>
                    <p style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{validationResult.ticket.fecha} - {validationResult.ticket.hora}</p>
                    {validationResult.status === 'Válido' && (
                      <button className="btn-primary" style={{width:'100%', marginTop:'20px'}} onClick={handleUseTicket}>MARCAR COMO USADO</button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <footer style={{marginTop:'80px', padding:'40px 0', borderTop:'1px solid #333', textAlign:'center'}}>
        <div className="container" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
            <div style={{width:'40px', height:'40px', background:'#333', borderRadius:'50%'}}></div>
            <div style={{textAlign:'left'}}><p style={{margin:0, fontSize:'0.7rem', color:'var(--text-muted)'}}>CREATED BY</p><p style={{margin:0, fontSize:'0.8rem', fontWeight:'700'}}>TASYADIINA_</p></div>
          </div>
          <div style={{display:'flex', gap:'30px'}}>
             <span style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>ASKA AKRIL DESIGN</span>
             <span style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>BATTLE CHOOSE ZOMBA SQUAD</span>
          </div>
        </div>
      </footer>

      {/* MODALES */}
      {showMovieModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{movieForm.id ? 'EDITAR PELÍCULA' : 'NUEVA PELÍCULA'}</h3>
            <form onSubmit={handleSaveMovie}>
              <input placeholder="Título" required value={movieForm.titulo} onChange={e => setMovieForm({...movieForm, titulo: e.target.value})} />
              <input placeholder="Género" required value={movieForm.genero} onChange={e => setMovieForm({...movieForm, genero: e.target.value})} />
              <input placeholder="URL Imagen Poster" value={movieForm.imagen_url} onChange={e => setMovieForm({...movieForm, imagen_url: e.target.value})} />
              <textarea placeholder="Descripción" value={movieForm.descripcion} onChange={e => setMovieForm({...movieForm, descripcion: e.target.value})} />
              <div style={{display:'flex', gap:'10px', marginTop:'25px'}}>
                <button type="button" className="btn-secondary" onClick={() => setShowMovieModal(false)} style={{flex:1}}>CANCELAR</button>
                <button type="submit" className="btn-primary" style={{flex:1}}>GUARDAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>NUEVO STAFF</h3>
            <form onSubmit={handleSaveUser}>
              <input placeholder="Nombre" required value={userForm.nombre} onChange={e => setUserForm({...userForm, nombre: e.target.value})} />
              <input placeholder="Email / Usuario" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
              <input placeholder="Contraseña" required type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
              <select value={userForm.rol} onChange={e => setUserForm({...userForm, rol: e.target.value})}>
                <option value="operario">Operario</option>
                <option value="admin">Admin</option>
              </select>
              <div style={{display:'flex', gap:'10px', marginTop:'25px'}}>
                <button type="button" className="btn-secondary" onClick={() => setShowUserModal(false)} style={{flex:1}}>CERRAR</button>
                <button type="submit" className="btn-primary" style={{flex:1}}>CREAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
