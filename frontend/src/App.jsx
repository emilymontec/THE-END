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
  const [showShowtimeModal, setShowShowtimeModal] = useState(false);
  const [movieForm, setMovieForm] = useState({ titulo: '', genero: '', duracion: '', clasificacion: '', descripcion: '', imagen_url: '', estado: 'activa', destacada: false });
  const [userForm, setUserForm] = useState({ nombre: '', email: '', password: '', rol: 'operario' });
  const [showtimeForm, setShowtimeForm] = useState({ pelicula_id: '', sala: 'Sala 1', fecha: '', hora: '', precio: '12000' });
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
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({ show: true, title, message, onConfirm: () => { onConfirm(); setConfirmModal({ ...confirmModal, show: false }); } });
  };

  // Filtros
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('todos');
  const [allShowtimes, setAllShowtimes] = useState([]);

  const loadAllShowtimes = async () => {
    try {
      const res = await api.get('/showtimes');
      setAllShowtimes(res.data);
    } catch (err) {
      console.error('Error cargando funciones:', err);
    }
  };

  useEffect(() => {
    // Ya se llama en el useEffect principal con role/page
  }, [page]);

  const getImageUrl = (url) => {
    if (!url || url === '') return 'https://via.placeholder.com/400x600?text=SIN+POSTER';
    if (url.startsWith('http')) return url;
    // Si no empieza con http, asumimos que es una ruta relativa de uploads
    return `http://localhost:4000/uploads/${url.split('/').pop()}`;
  };

  const uniqueGenres = ['todos', ...new Set(movies.map(m => m.genero).filter(Boolean))];
  const filteredMovies = movies.filter(m => {
    const matchesSearch = (m.titulo || '').toLowerCase().includes(search.toLowerCase());
    const matchesGenre = genreFilter === 'todos' || m.genero === genreFilter;
    return matchesSearch && matchesGenre;
  });

  useEffect(() => {
    if (role === 'admin') setPage('dashboard');
    else if (role === 'operario') setPage('validar');
    else setPage('movies');
    
    setSelectedMovie(null);
    setSelectedShowtime(null);
    setLastTicket(null);
    setAdminTab('sales');
  }, [user]); // Redirigir solo cuando el usuario cambia (login/logout)

  useEffect(() => { 
    loadMovies(); 
    loadAllShowtimes(); // Cargar todas las funciones al inicio
    if (role === 'admin' || role === 'operario') {
      loadStats();
      loadAllSales();
      loadAccessHistory();
      if (role === 'admin') loadAllUsers();
    }
    if (role === 'cliente' && user) {
      loadMyPurchases();
    }
  }, [role, page]); // Refrescar cuando el rol o la página cambian

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/users/login', loginForm);
      setUser(res.data);
      setRole(res.data.rol);
      localStorage.setItem('user', JSON.stringify(res.data));
      showMsg('success', `BIENVENIDO ${res.data.nombre.toUpperCase()}`);
    } catch (err) {
      showMsg('error', 'CREDENCIALES INVÁLIDAS');
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
      showMsg('success', 'CUENTA CREADA');
    } catch (err) {
      showMsg('error', 'EL EMAIL YA ESTÁ REGISTRADO');
    } finally { setIsLoading(false); }
  };

  const handleLogout = () => {
    showConfirm('CERRAR SESIÓN', '¿ESTÁ SEGURO DE SALIR DEL CINE?', () => {
      setUser(null);
      setRole('guest');
      localStorage.removeItem('user');
      setPage('movies');
      showMsg('success', 'SESIÓN CERRADA');
    });
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
      showMsg('success', 'USUARIO CREADO');
      setShowUserModal(false);
      setUserForm({ nombre: '', email: '', password: '', rol: 'operario' });
      loadAllUsers();
    } catch (err) { showMsg('error', 'ERROR AL GUARDAR'); }
    finally { setIsLoading(false); }
  };

  const handleDeleteUser = async (id) => {
    showConfirm('ELIMINAR USUARIO', '¿ESTÁ SEGURO DE ELIMINAR ESTE REGISTRO DE PERSONAL?', async () => {
      setIsLoading(true);
      try {
        await api.delete(`/users/admin/users/${id}`);
        showMsg('success', 'USUARIO ELIMINADO');
        loadAllUsers();
      } catch (err) { showMsg('error', 'ERROR AL ELIMINAR'); }
      finally { setIsLoading(false); }
    });
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
      showMsg('error', 'ERROR DE CONEXIÓN');
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
    console.log('Película seleccionada para compra:', movie.titulo);
    setSelectedMovie(movie);
    setIsLoading(true);
    try {
      const res = await api.get('/showtimes');
      const filtered = res.data.filter(s => s.pelicula_id === movie.id);
      console.log('Funciones encontradas:', filtered.length);
      setShowtimes(filtered);
      if (filtered.length > 0) {
        setPage('showtimes');
      } else {
        showMsg('error', 'ESTA PELÍCULA NO TIENE FUNCIONES DISPONIBLES AÚN');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      showMsg('error', 'ERROR AL CARGAR HORARIOS');
    } finally { setIsLoading(false); }
  };

  const handleSelectShowtime = async (showtime) => {
    setSelectedShowtime(showtime);
    setSelectedSeats([]);
    setIsLoading(true);
    try {
      console.log('🔍 Cargando asientos para función:', showtime.id);
      console.log('📡 URL de API:', api.defaults.baseURL);
      const res = await api.get(`/showtimes/${showtime.id}/seats`);
      console.log('✅ Respuesta del servidor:', res.data);
      console.log('📊 Total asientos recibidos:', res.data.length);
      if (res.data.length > 0) {
        console.log('📋 Primer asiento:', res.data[0]);
      }
      setSeats(res.data);
      setPage('seats');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('❌ Error cargando asientos:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error message:', err.message);
      showMsg('error', 'ERROR DE ASIENTOS');
    } finally { setIsLoading(false); }
  };

  const toggleSeat = async (seatId) => {
    if (role === 'admin') return; // Admin solo observa
    if (!selectedShowtime) return;
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
    showConfirm('CONFIRMAR COMPRA', `¿PROCEDER CON LA COMPRA DE ${selectedSeats.length} ASIENTO(S)? TOTAL: $${(selectedSeats.length * parseFloat(selectedShowtime.precio)).toLocaleString()}`, () => {
      setIsPaying(true);
      setTimeout(() => {
        handleBuyTickets();
        setIsPaying(false);
      }, 2000);
    });
  };

  const handleBuyTickets = async () => {
    if (!selectedMovie || !selectedShowtime) {
      showMsg('error', 'SESIÓN EXPIRADA, POR FAVOR REINICIE EL PROCESO');
      setPage('movies');
      return;
    }
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
      
      // Auto-descargar PDF después de un pequeño retraso para asegurar que el DOM esté listo
      setTimeout(() => {
        downloadTicketPDF();
      }, 1000);

      if (role === 'admin') loadStats();
      if (role === 'cliente') loadMyPurchases();
    } catch (err) { showMsg('error', 'ERROR EN COMPRA'); }
    finally { setIsLoading(false); }
  };

  const handleCancelTicket = async (id) => {
    showConfirm('CANCELAR TIQUETE', '¿ESTÁ SEGURO DE CANCELAR EL TIQUETE Y LIBERAR LOS ASIENTOS?', async () => {
      setIsLoading(true);
      try {
        await api.delete(`/tickets/${id}`);
        showMsg('success', 'TIQUETE CANCELADO');
        loadAllSales();
        loadStats();
        if (role === 'cliente') loadMyPurchases();
      } catch (err) { showMsg('error', 'ERROR AL CANCELAR'); }
      finally { setIsLoading(false); }
    });
  };

  const handleValidateTicket = async () => {
    if (!ticketCode) return;
    setValidationResult(null);
    setIsLoading(true);
    try {
      console.log('Validando ticket:', ticketCode);
      const res = await api.get(`/tickets/validate/${ticketCode}`);
      setValidationResult(res.data);
    } catch (err) {
      console.error('Error validando ticket:', err);
      setValidationResult({ status: 'INVÁLIDO', message: 'NO ENCONTRADO' });
    } finally { setIsLoading(false); }
  };

  const handleUseTicket = async () => {
    if (!ticketCode) return;
    setIsLoading(true);
    try {
      console.log('Usando ticket:', ticketCode);
      await api.post(`/tickets/use/${ticketCode}`);
      showMsg('success', 'VALIDADO');
      // No llamar a handleValidateTicket directamente si causa problemas, mejor actualizar estado local o recargar
      const res = await api.get(`/tickets/validate/${ticketCode}`);
      setValidationResult(res.data);
      if (role === 'admin') loadStats();
    } catch (err) {
      console.error('Error usando ticket:', err);
      showMsg('error', 'ERROR DE VALIDACIÓN');
    } finally { setIsLoading(false); }
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const movieData = { ...movieForm };
      const fileInput = document.getElementById('movie-image-upload');

      if (!movieData.imagen_url && (!fileInput || !fileInput.files || !fileInput.files[0])) {
        showMsg('error', 'Debe proporcionar una URL de póster o adjuntar una imagen.');
        setIsLoading(false);
        return;
      }
      
      // Handle file upload if present
      if (fileInput && fileInput.files && fileInput.files[0]) {
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        try {
          const uploadRes = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          movieData.imagen_url = uploadRes.data.imageUrl;
        } catch (uploadErr) {
          console.error('Error subiendo imagen:', uploadErr);
          showMsg('error', 'Error al subir la imagen. Por favor, intente de nuevo.');
          setIsLoading(false);
          return; // Detener la ejecución si la carga de la imagen falla
        }
      }

      console.log('Guardando película:', movieData);
      if (movieData.id) {
        await api.put(`/movies/${movieData.id}`, movieData);
      } else {
        await api.post('/movies', movieData);
      }
      
      showMsg('success', 'PELÍCULA GUARDADA CORRECTAMENTE');
      setShowMovieModal(false);
      setMovieForm({ titulo: '', genero: '', duracion: '', clasificacion: '', descripcion: '', imagen_url: '', estado: 'activa', destacada: false });
      loadMovies();
    } catch (err) {
      console.error('Error al guardar película:', err);
      showMsg('error', `ERROR AL GUARDAR: ${err.response?.data?.error || err.message}`);
    } finally { setIsLoading(false); }
  };

  const handleDeleteMovie = async (id) => {
    if (!id) return;
    showConfirm('ELIMINAR PELÍCULA', '¿ESTÁ SEGURO DE ELIMINAR ESTA PELÍCULA? ESTA ACCIÓN NO SE PUEDE DESHACER.', async () => {
      setIsLoading(true);
      try {
        await api.delete(`/movies/${id}`);
        showMsg('success', 'PELÍCULA ELIMINADA');
        loadMovies();
      } catch (err) {
        console.error('Error al eliminar película:', err);
        showMsg('error', `ERROR AL ELIMINAR: ${err.response?.data?.error || err.message}`);
      } finally { setIsLoading(false); }
    });
  };

  const toggleMovieStatus = async (movie) => {
    if (!movie || !movie.id) return;
    const nextStatus = movie.estado === 'activa' ? 'inactiva' : 'activa';
    setIsLoading(true);
    try {
      await api.patch(`/movies/${movie.id}/status`, { estado: nextStatus });
      showMsg('success', `PELÍCULA ${nextStatus.toUpperCase()}`);
      loadMovies();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      showMsg('error', `ERROR AL CAMBIAR ESTADO: ${err.response?.data?.error || err.message}`);
    } finally { setIsLoading(false); }
  };

  const handleSaveShowtime = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/showtimes', showtimeForm);
      showMsg('success', 'HORARIO AGREGADO');
      setShowShowtimeModal(false);
      setShowtimeForm({ pelicula_id: '', sala: 'Sala 1', fecha: '', hora: '', precio: '12000' });
      loadAllShowtimes();
    } catch (err) {
      showMsg('error', 'ERROR AL GUARDAR HORARIO');
    } finally { setIsLoading(false); }
  };

  const handleDeleteShowtime = async (id) => {
    showConfirm('ELIMINAR HORARIO', '¿ESTÁ SEGURO DE ELIMINAR ESTA FUNCIÓN?', async () => {
      setIsLoading(true);
      try {
        await api.delete(`/showtimes/${id}`);
        showMsg('success', 'HORARIO ELIMINADO');
        loadAllShowtimes();
      } catch (err) { showMsg('error', 'ERROR AL ELIMINAR'); }
      finally { setIsLoading(false); }
    });
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
      showMsg('success', 'PDF DESCARGADO');
    } catch (err) {
      showMsg('error', 'ERROR DE PDF');
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
          {user && role === 'cliente' && (
            <span className={page === 'my-purchases' ? 'active' : ''} onClick={() => setPage('my-purchases')}>Mis Compras</span>
          )}
          {user && role !== 'cliente' && (
            <span className={page === 'dashboard' || page === 'validar' ? 'active' : ''} onClick={() => setPage(role === 'admin' ? 'dashboard' : 'validar')}>Administración</span>
          )}
          {!user ? (
            <button className="btn-marquee" style={{width:'auto', padding:'10px 20px', fontSize:'0.7rem'}} onClick={() => setPage('auth')}>ACCEDER</button>
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
                <span className="pre-title">Taquilla</span>
                <h3 className="movie-meta-title" style={{fontSize:'2rem'}}>{authMode === 'login' ? 'INICIAR SESIÓN' : 'REGISTRARSE'}</h3>
              </div>
              <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                {authMode === 'register' && (
                  <input placeholder="NOMBRE" required value={loginForm.nombre} onChange={e => setLoginForm({...loginForm, nombre: e.target.value})} />
                )}
                <input type="text" placeholder="USUARIO / EMAIL" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
                <input type="password" placeholder="CONTRASEÑA" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                <button type="submit" className="btn-marquee" style={{marginTop:'10px'}}>{authMode === 'login' ? 'ENTRAR AL CINE' : 'CREAR CUENTA'}</button>
                <button type="button" style={{background:'transparent', border:'none', color:'var(--secondary)', cursor:'pointer', fontStyle:'italic'}} onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                  {authMode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                </button>
              </form>
            </div>
          )}

          {/* MOVIES LIST (Bento Grid) */}
          {page === 'movies' && (
            <div className="movie-grid">
              {movies.length > 0 ? (
                (() => {
                  const featuredMovie = movies.find(m => m.destacada && m.estado === 'activa') || movies[0];
                  const secondaryMovies = movies.filter(m => m.id !== featuredMovie.id);
                  
                  return (
                    <>
                      {/* Featured Movie Container */}
                      <div className="featured-movie-container">
                        <article className="featured-movie">
                          <div className="gold-frame">
                            <div className="featured-poster-container">
                              <img src={getImageUrl(featuredMovie.imagen_url)} alt={featuredMovie.titulo} className="featured-poster" />
                              <div className="featured-overlay">
                                <span className="featured-badge">Presentación Estelar</span>
                                <h2 className="featured-title">{featuredMovie.titulo}</h2>
                              </div>
                            </div>
                          </div>
                          <div className="movie-meta" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'24px'}}>
                            <div style={{flex:1}}>
                              <div className="movie-header">
                                <div className="rating-box">{featuredMovie.clasificacion || 'A'}</div>
                                <span className="movie-sub-meta">{featuredMovie.genero} • {featuredMovie.duracion} MIN</span>
                              </div>
                              <p className="movie-summary">{featuredMovie.descripcion}</p>
                              
                              {/* Horarios y Disponibilidad */}
                              <div style={{marginTop:'16px'}}>
                                <span className="admit-one" style={{fontSize:'0.6rem', display:'block', marginBottom:'8px'}}>Horarios Disponibles:</span>
                                <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                                  {allShowtimes.filter(s => s.pelicula_id === featuredMovie.id).slice(0, 4).map(s => (
                                    <span key={s.id} className="featured-badge" style={{background:'var(--secondary)', margin:0, fontSize:'0.6rem'}}>
                                      {s.hora.slice(0,5)}
                                    </span>
                                  ))}
                                  {allShowtimes.filter(s => s.pelicula_id === featuredMovie.id).length === 0 && (
                                    <span className="movie-sub-meta" style={{color:'#999'}}>Próximamente</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div style={{display:'flex', flexDirection:'column', gap:'12px', alignItems:'flex-end'}}>
                              <div className="rating-box" style={{width:'auto', padding:'0 10px', height:'30px', fontSize:'0.7rem', borderColor:'var(--primary)', color:'var(--primary)'}}>
                                {allShowtimes.filter(s => s.pelicula_id === featuredMovie.id).length > 0 ? 'DISPONIBLE' : 'AGOTADO'}
                              </div>
                              <button className="btn-marquee" style={{width:'auto', padding:'15px 30px'}} onClick={() => handleSelectMovie(featuredMovie)}>COMPRAR BOLETA</button>
                            </div>
                          </div>
                        </article>
                      </div>

                      {/* Secondary Movies Container */}
                      <div className="secondary-grid-container">
                        <div className="secondary-grid-centered">
                          {secondaryMovies.map(m => (
                            <article key={m.id} className="secondary-movie-item" style={{display:'flex', flexDirection:'column'}}>
                              <div className="poster-frame" style={{flex:1, display:'flex', flexDirection:'column'}}>
                                <div className="secondary-poster-container" style={{flex:1}}>
                                  <img src={getImageUrl(m.imagen_url)} alt={m.titulo} className="secondary-poster" />
                              </div>
                            </div>
                            <div className="movie-meta" style={{minHeight:'220px', display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
                              <div>
                                <div className="movie-header">
                                  <div className="rating-box" style={{width:'30px', height:'30px', fontSize:'0.7rem'}}>{m.clasificacion || 'B'}</div>
                                  <h3 className="movie-meta-title" style={{fontSize:'1.2rem'}}>{m.titulo}</h3>
                                </div>
                                <p className="movie-sub-meta">{m.genero} • {m.duracion} MIN</p>
                                
                                {/* Horarios Cortos */}
                                <div style={{marginTop:'12px'}}>
                                  <div style={{display:'flex', gap:'4px', flexWrap:'wrap'}}>
                                    {allShowtimes.filter(s => s.pelicula_id === m.id).slice(0, 3).map(s => (
                                      <span key={s.id} style={{fontSize:'0.6rem', padding:'2px 6px', border:'1px solid var(--secondary)', color:'var(--secondary)', fontWeight:'700'}}>
                                        {s.hora.slice(0,5)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div style={{marginTop:'16px'}}>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                                  <span className="admit-one" style={{fontSize:'0.5rem'}}>
                                    {allShowtimes.filter(s => s.pelicula_id === m.id).length > 0 ? 'EN CARTELERA' : 'PRÓXIMAMENTE'}
                                  </span>
                                </div>
                                <button className="btn-marquee" style={{padding:'10px'}} onClick={() => handleSelectMovie(m)}>COMPRAR BOLETA</button>
                              </div>
                            </div>
                          </article>
                        ))}
                        </div>
                      </div>
                    </>
                  );
                })()
              ) : (
                <div style={{gridColumn:'span 12', textAlign:'center', padding:'80px', background:'white'}} className="gold-frame">
                   <p className="movie-summary">No hay películas disponibles en este momento.</p>
                </div>
              )}
            </div>
          )}

          {/* SHOWTIMES */}
          {page === 'showtimes' && (
            <div className="gold-frame showtimes-frame" style={{marginTop:'40px', background:'white'}}>
              <span className="pre-title">Horarios</span>
              <h2 className="main-title showtimes-title">{selectedMovie.titulo}</h2>
              <div className="showtimes-content">
                <div className="poster-frame showtimes-poster">
                  <img src={getImageUrl(selectedMovie.imagen_url)} alt={selectedMovie.titulo} style={{width:'100%', aspectRatio:'2/3', objectFit:'cover'}} />
                </div>
                <div className="showtimes-info">
                  <p className="movie-summary" style={{fontSize:'1.5rem', marginBottom:'32px'}}>{selectedMovie.descripcion}</p>
                  <div className="showtimes-timeslots">
                    {showtimes.map(s => (
                      <div key={s.id} className="time-slot evening" onClick={() => handleSelectShowtime(s)}>
                        <span className="time-label">{s.fecha}</span>
                        <span className="time-value">{s.hora}</span>
                        <span className="time-label" style={{marginTop:'8px'}}>${parseFloat(s.precio).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <button className="btn-marquee btn-volver" onClick={() => setPage('movies')}>VOLVER</button>
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
                  <span className="screen-text">Superficie de Proyección</span>
                </div>
                
                {/* Leyenda de asientos */}
                <div className="seat-legend" style={{display:'flex', justifyContent:'center', gap:'24px', marginBottom:'24px', flexWrap:'wrap'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    <div style={{width:'24px', height:'24px', background:'#4a4a4a', borderRadius:'4px'}}></div>
                    <span className="movie-sub-meta" style={{color:'black'}}>Disponible</span>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    <div style={{width:'24px', height:'24px', background:'var(--primary)', borderRadius:'4px'}}></div>
                    <span className="movie-sub-meta" style={{color:'black'}}>Seleccionado</span>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    <div style={{width:'24px', height:'24px', background:'#a00', borderRadius:'4px'}}></div>
                    <span className="movie-sub-meta" style={{color:'black'}}>Ocupado</span>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    <div style={{width:'24px', height:'24px', background:'#ff9800', borderRadius:'4px'}}></div>
                    <span className="movie-sub-meta" style={{color:'black'}}>Bloqueado</span>
                  </div>
                </div>

                {/* Asientos organizados por filas */}
                <div className="seats-container" style={{display:'flex', flexDirection:'column', gap:'8px', alignItems:'center'}}>
                  {(() => {
                    // Agrupar asientos por fila
                    const seatsByRow = {};
                    seats.forEach(seat => {
                      if (!seatsByRow[seat.fila]) {
                        seatsByRow[seat.fila] = [];
                      }
                      seatsByRow[seat.fila].push(seat);
                    });
                    
                    // Ordenar filas alfabéticamente
                    const sortedRows = Object.keys(seatsByRow).sort();
                    
                    return sortedRows.map(fila => (
                      <div key={fila} style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <span className="admit-one" style={{width:'20px', textAlign:'center', fontSize:'0.8rem'}}>{fila}</span>
                        <div style={{display:'flex', gap:'6px'}}>
                          {seatsByRow[fila]
                            .sort((a, b) => a.columna - b.columna)
                            .map(seat => (
                              <div 
                                key={seat.mapping_id} 
                                className={`seat-stitch ${seat.estado} ${selectedSeats.includes(seat.asiento_id) ? 'selected' : ''}`}
                                onClick={() => seat.estado !== 'vendido' && seat.estado !== 'bloqueado' && toggleSeat(seat.asiento_id)}
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: seat.estado === 'vendido' || seat.estado === 'bloqueado' ? 'not-allowed' : 'pointer',
                                  opacity: seat.estado === 'vendido' ? 0.5 : 1
                                }}
                              >
                                {seat.columna}
                              </div>
                            ))}
                        </div>
                        <span className="admit-one" style={{width:'20px', textAlign:'center', fontSize:'0.8rem'}}>{fila}</span>
                      </div>
                    ));
                  })()}
                </div>
              </section>

              <aside className="ticket-panel">
                <div className="stitch-ticket">
                  <div className="ticket-header-stitch">
                    <span className="admit-one">ADMITIR UNO</span>
                    <span className="movie-sub-meta">#MARQUESINA-2026</span>
                  </div>
                  <div style={{marginTop:'24px'}}>
                    <span className="pre-title" style={{fontSize:'0.6rem'}}>Presentación</span>
                    <p className="movie-meta-title" style={{fontSize:'1.2rem'}}>{selectedMovie.titulo}</p>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginTop:'16px'}}>
                      <div>
                        <span className="pre-title" style={{fontSize:'0.6rem'}}>Fecha</span>
                        <p className="movie-sub-meta" style={{fontSize:'0.8rem', color:'black'}}>{selectedShowtime.fecha}</p>
                      </div>
                      <div>
                        <span className="pre-title" style={{fontSize:'0.6rem'}}>Hora</span>
                        <p className="movie-sub-meta" style={{fontSize:'0.8rem', color:'black'}}>{selectedShowtime.hora}</p>
                      </div>
                    </div>
                    <div style={{marginTop:'24px', padding:'16px', border:'1px dashed var(--secondary)', textAlign:'center'}}>
                      <span className="pre-title" style={{fontSize:'0.6rem'}}>Asientos Seleccionados</span>
                      <p className="main-title" style={{fontSize:'1.5rem', margin:'8px 0'}}>{selectedSeats.length > 0 ? selectedSeats.length : '0'}</p>
                      {selectedSeats.length > 0 && (
                        <div style={{marginTop:'8px', fontSize:'0.7rem', color:'var(--secondary)', fontWeight:'700'}}>
                          {seats.filter(s => selectedSeats.includes(s.asiento_id)).map(s => `${s.fila}${s.columna}`).join(', ')}
                        </div>
                      )}
                      {selectedSeats.length === 0 && (
                        <p className="movie-sub-meta" style={{fontSize:'0.7rem', marginTop:'8px', color:'#999'}}>
                          Haz clic en los asientos para seleccionarlos
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="gold-frame" style={{background:'var(--surface-container-high)', border:'none'}}>
                  <h3 className="admit-one" style={{borderBottom:'1px solid rgba(0,0,0,0.1)', paddingBottom:'12px', marginBottom:'16px'}}>Resumen</h3>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                    <span className="movie-sub-meta">Tiquetes x{selectedSeats.length}</span>
                    <span className="movie-meta-title" style={{fontSize:'1rem'}}>${(selectedSeats.length * parseFloat(selectedShowtime.precio)).toLocaleString()}</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid rgba(0,0,0,0.1)', paddingTop:'12px', marginTop:'12px'}}>
                    <span className="admit-one">Total</span>
                    <span className="movie-meta-title" style={{fontSize:'1.5rem'}}>${(selectedSeats.length * parseFloat(selectedShowtime.precio)).toLocaleString()}</span>
                  </div>
                  <button className="btn-marquee" style={{marginTop:'24px'}} disabled={selectedSeats.length === 0} onClick={handleProcessPayment}>
                    {isPaying ? 'PROCESANDO...' : 'CONFIRMAR COMPRA'}
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
                <p className="movie-sub-meta">Película: <span style={{color:'black', fontStyle:'normal'}}>{lastTicket.movie}</span></p>
                <p className="movie-sub-meta">Horario: <span style={{color:'black', fontStyle:'normal'}}>{lastTicket.time}</span></p>
                <p className="movie-sub-meta">Asientos: <span style={{color:'black', fontStyle:'normal'}}>{lastTicket.seats}</span></p>
                <p className="movie-sub-meta" style={{fontSize:'1.2rem', marginTop:'16px'}}>Total: <span style={{color:'var(--primary)', fontStyle:'normal', fontWeight:'900'}}>${parseFloat(lastTicket.total).toLocaleString()}</span></p>
              </div>
              <div style={{display:'flex', gap:'16px', marginTop:'32px'}}>
                <button className="btn-marquee" style={{flex:1, padding:'12px'}} onClick={() => setPage('movies')}>INICIO</button>
                <button className="btn-marquee" style={{flex:1, padding:'12px', background:'var(--secondary)'}} onClick={downloadTicketPDF}>PDF</button>
              </div>
            </div>
          )}

          {/* MANAGEMENT (Simplified Admin/Staff View) */}
          {(page === 'dashboard' || page === 'validar') && (
            <div className="admin-layout-wrapper">
              <aside className="admin-menu-centered">
                <div className="gold-frame" style={{background:'var(--surface-container-high)', border:'none', padding:'24px'}}>
                  <h2 className="admit-one" style={{marginBottom:'24px'}}>Gestión</h2>
                  <nav style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                    {role === 'admin' && (
                      <>
                        <button className="btn-marquee" style={{padding:'12px', fontSize:'0.7rem', background: adminTab==='sales' ? 'var(--primary-container)' : ''}} onClick={() => setAdminTab('sales')}>Ventas</button>
                        <button className="btn-marquee" style={{padding:'12px', fontSize:'0.7rem', background: adminTab==='movies' ? 'var(--primary-container)' : ''}} onClick={() => setAdminTab('movies')}>Películas</button>
                        <button className="btn-marquee" style={{padding:'12px', fontSize:'0.7rem', background: adminTab==='users' ? 'var(--primary-container)' : ''}} onClick={() => setAdminTab('users')}>Personal</button>
                      </>
                    )}
                    {role === 'operario' && (
                      <button className="btn-marquee" style={{padding:'12px', fontSize:'0.7rem', background:'var(--secondary)'}} onClick={() => setPage('validar')}>Escáner de Tickets</button>
                    )}
                  </nav>
                </div>
              </aside>

              <main className="admin-content-main">
                {page === 'validar' ? (
                  <div className="gold-frame" style={{background:'white', padding:'48px', textAlign:'center'}}>
                    <span className="pre-title">Control de Seguridad</span>
                    <h3 className="main-title" style={{fontSize:'2rem'}}>Validar Ticket</h3>
                    <input placeholder="INGRESE SERIAL DE 8 DÍGITOS" value={ticketCode} onChange={e => setTicketCode(e.target.value.toUpperCase())} style={{fontSize:'2rem', textAlign:'center', letterSpacing:'8px', width:'100%', marginBottom:'32px'}} />
                    <button className="btn-marquee" onClick={handleValidateTicket}>BUSCAR ARCHIVOS</button>
                    {validationResult && (
                      <div className="poster-frame" style={{marginTop:'32px', padding:'24px'}}>
                        <p className="admit-one">Estado: <span style={{color: validationResult.status === 'Válido' ? 'green' : 'red'}}>{validationResult.status}</span></p>
                        {validationResult.ticket && (
                          <div style={{marginTop:'16px'}}>
                            <p className="movie-meta-title">{validationResult.ticket.titulo}</p>
                            {validationResult.status === 'Válido' && (
                              <button className="btn-marquee" style={{marginTop:'24px'}} onClick={handleUseTicket}>ADMITIR CLIENTE</button>
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
                          <h3 className="movie-meta-title">Registros de Personal</h3>
                          <button className="btn-marquee" style={{width:'auto', padding:'10px 20px'}} onClick={() => setShowUserModal(true)}>+ AGREGAR PERSONAL</button>
                        </div>
                        <div className="admin-tables-wrapper">
                        <table style={{width:'100%', borderCollapse:'collapse'}}>
                          <thead>
                            <tr style={{borderBottom:'2px solid var(--secondary)'}}>
                              <th className="admit-one" style={{textAlign:'left', padding:'12px'}}>Nombre</th>
                              <th className="admit-one" style={{textAlign:'left', padding:'12px'}}>Identidad</th>
                              <th className="admit-one" style={{textAlign:'left', padding:'12px'}}>Rol</th>
                              <th className="admit-one" style={{textAlign:'left', padding:'12px'}}>Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allUsers.map(u => (
                              <tr key={u.id} style={{borderBottom:'1px solid #eee'}}>
                                <td className="movie-sub-meta" style={{color:'black', padding:'12px', fontStyle:'normal'}}>{u.nombre}</td>
                                <td className="movie-sub-meta" style={{color:'black', padding:'12px', fontStyle:'normal'}}>{u.email}</td>
                                <td className="movie-sub-meta" style={{color:'black', padding:'12px'}}><span className="featured-badge" style={{margin:0}}>{u.rol}</span></td>
                                <td style={{padding:'12px'}}>{u.email !== 'admin@cinema.com' && <button onClick={() => handleDeleteUser(u.id)} style={{color:'red', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-headline)', fontWeight:700, fontSize:'0.7rem', letterSpacing:'0.1em'}}>ELIMINAR</button>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        </div>
                      </div>
                    ) : adminTab === 'movies' ? (
                      <div>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px'}}>
                          <h3 className="movie-meta-title">Gestión de Películas</h3>
                          <button className="btn-marquee" style={{width:'auto', padding:'10px 20px'}} onClick={() => { setMovieForm({ titulo:'', genero:'', duracion:'', clasificacion:'', descripcion:'', imagen_url:'', estado:'activa' }); setShowMovieModal(true); }}>+ AGREGAR</button>
                        </div>
                        <div className="admin-tables-wrapper">
                        <table style={{width:'100%', borderCollapse:'collapse'}}>
                          <thead>
                            <tr style={{borderBottom:'2px solid var(--secondary)'}}>
                              <th className="admit-one" style={{textAlign:'left', padding:'12px'}}>Título</th>
                              <th className="admit-one" style={{textAlign:'left', padding:'12px'}}>Estado</th>
                              <th className="admit-one" style={{textAlign:'left', padding:'12px'}}>Funciones</th>
                              <th className="admit-one" style={{textAlign:'left', padding:'12px'}}>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {movies.map(m => (
                              <tr key={m.id} style={{borderBottom:'1px solid #eee'}}>
                                <td className="movie-sub-meta" style={{color:'black', padding:'12px', fontStyle:'normal'}}>{m.titulo}</td>
                                <td style={{padding:'12px'}}><span className="featured-badge" style={{margin:0, background: m.estado==='activa' ? 'var(--secondary)' : '#999'}}>{m.estado}</span></td>
                                <td style={{padding:'12px'}}>
                                  <div style={{display:'flex', gap:'4px', flexWrap:'wrap', maxWidth:'200px'}}>
                                    {allShowtimes.filter(s => s.pelicula_id === m.id).map(s => (
                                      <div key={s.id} style={{fontSize:'0.6rem', padding:'2px 4px', background:'var(--surface-container-high)', border:'1px solid #ccc', display:'flex', alignItems:'center', gap:'4px'}}>
                                        {s.fecha} {s.hora.slice(0,5)}
                                        <span onClick={() => handleDeleteShowtime(s.id)} style={{color:'red', cursor:'pointer', fontWeight:'bold'}}>×</span>
                                      </div>
                                    ))}
                                    <button onClick={() => { setShowtimeForm({ ...showtimeForm, pelicula_id: m.id }); setShowShowtimeModal(true); }} style={{fontSize:'0.6rem', padding:'2px 6px', cursor:'pointer', background:'var(--primary)', color:'white', border:'none'}}>+ AGREGAR</button>
                                  </div>
                                </td>
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
                      </div>
                    ) : (
                      <div className="gold-frame" style={{background:'white', padding:'32px'}}>
                        <h3 className="movie-meta-title" style={{marginBottom:'32px', textAlign:'center'}}>Panel de Ventas</h3>
                        <div className="sales-cards-vertical" style={{marginBottom:'40px'}}>
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
                            <div className="admin-tables-wrapper">
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
      </footer>

      {/* MODALS */}
      {showMovieModal && (
        <div className="modal-overlay">
          <div className="gold-frame" style={{background:'white', width:'90%', maxWidth:'500px', padding:'40px'}}>
            <h3 className="movie-meta-title" style={{marginBottom:'24px'}}>{movieForm.id ? 'ACTUALIZAR PELÍCULA' : 'REGISTRAR PELÍCULA'}</h3>
            <form onSubmit={handleSaveMovie} style={{display:'flex', flexDirection:'column', gap:'16px'}}>
              <input placeholder="TÍTULO" required value={movieForm.titulo} onChange={e => setMovieForm({...movieForm, titulo: e.target.value})} />
              <input placeholder="GÉNERO" required value={movieForm.genero} onChange={e => setMovieForm({...movieForm, genero: e.target.value})} />
              <div style={{display:'flex', gap:'16px'}}>
                <input placeholder="DURACIÓN (MIN)" required type="number" value={movieForm.duracion} onChange={e => setMovieForm({...movieForm, duracion: e.target.value})} />
                <input placeholder="CLASIFICACIÓN" required value={movieForm.clasificacion} onChange={e => setMovieForm({...movieForm, clasificacion: e.target.value})} />
              </div>
              <div style={{border:'1px dashed var(--secondary)', padding:'15px'}}>
                <span className="admit-one" style={{fontSize:'0.6rem', display:'block', marginBottom:'8px'}}>ADJUNTAR PÓSTER (OPCIONAL)</span>
                <input type="file" id="movie-image-upload" accept="image/*" style={{border:'none', padding:0}} />
              </div>
              <input placeholder="O URL DEL PÓSTER" value={movieForm.imagen_url} onChange={e => setMovieForm({...movieForm, imagen_url: e.target.value})} />
              <div style={{display:'flex', alignItems:'center', gap:'10px', padding:'10px', background:'var(--surface-container-high)'}}>
                <input type="checkbox" id="movie-destacada" checked={movieForm.destacada} onChange={e => setMovieForm({...movieForm, destacada: e.target.checked})} style={{width:'auto'}} />
                <label htmlFor="movie-destacada" className="admit-one" style={{fontSize:'0.7rem', cursor:'pointer'}}>PELÍCULA DESTACADA (PÁGINA PRINCIPAL)</label>
              </div>
              <textarea placeholder="SINOPSIS" value={movieForm.descripcion} onChange={e => setMovieForm({...movieForm, descripcion: e.target.value})} rows="4" />
              <div style={{display:'flex', gap:'16px', marginTop:'16px'}}>
                <button type="button" className="btn-marquee" style={{background:'var(--secondary)', flex:1}} onClick={() => setShowMovieModal(false)}>CANCELAR</button>
                <button type="submit" className="btn-marquee" style={{flex:1}}>GUARDAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="modal-overlay">
          <div className="gold-frame" style={{background:'white', width:'90%', maxWidth:'500px', padding:'40px'}}>
            <h3 className="movie-meta-title" style={{marginBottom:'24px'}}>REGISTRO DE PERSONAL</h3>
            <form onSubmit={handleSaveUser} style={{display:'flex', flexDirection:'column', gap:'16px'}}>
              <input placeholder="NOMBRE" required value={userForm.nombre} onChange={e => setUserForm({...userForm, nombre: e.target.value})} />
              <input placeholder="IDENTIDAD / EMAIL" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
              <input placeholder="CÓDIGO DE SEGURIDAD" required type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
              <select value={userForm.rol} onChange={e => setUserForm({...userForm, rol: e.target.value})} style={{padding:'15px', border:'1px solid var(--accent)'}}>
                <option value="operario">Operario (Personal)</option>
                <option value="admin">Administrador</option>
              </select>
              <div style={{display:'flex', gap:'16px', marginTop:'16px'}}>
                <button type="button" className="btn-marquee" style={{background:'var(--secondary)', flex:1}} onClick={() => setShowUserModal(false)}>CANCELAR</button>
                <button type="submit" className="btn-marquee" style={{flex:1}}>REGISTRAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showShowtimeModal && (
        <div className="modal-overlay">
          <div className="gold-frame" style={{background:'white', width:'90%', maxWidth:'450px', padding:'40px'}}>
            <h3 className="movie-meta-title" style={{marginBottom:'24px'}}>AGREGAR HORARIO</h3>
            <form onSubmit={handleSaveShowtime} style={{display:'flex', flexDirection:'column', gap:'16px'}}>
              <div>
                <span className="admit-one" style={{fontSize:'0.6rem', display:'block', marginBottom:'8px'}}>FECHA</span>
                <input type="date" required value={showtimeForm.fecha} onChange={e => setShowtimeForm({...showtimeForm, fecha: e.target.value})} />
              </div>
              <div>
                <span className="admit-one" style={{fontSize:'0.6rem', display:'block', marginBottom:'8px'}}>HORA</span>
                <input type="time" required value={showtimeForm.hora} onChange={e => setShowtimeForm({...showtimeForm, hora: e.target.value})} />
              </div>
              <div>
                <span className="admit-one" style={{fontSize:'0.6rem', display:'block', marginBottom:'8px'}}>SALA</span>
                <select value={showtimeForm.sala} onChange={e => setShowtimeForm({...showtimeForm, sala: e.target.value})}>
                  <option value="Sala 1">Sala 1 (Principal)</option>
                  <option value="Sala 2">Sala 2 (VIP)</option>
                  <option value="Sala 3">Sala 3 (3D)</option>
                </select>
              </div>
              <div>
                <span className="admit-one" style={{fontSize:'0.6rem', display:'block', marginBottom:'8px'}}>PRECIO BOLETA</span>
                <input type="number" required value={showtimeForm.precio} onChange={e => setShowtimeForm({...showtimeForm, precio: e.target.value})} />
              </div>
              <div style={{display:'flex', gap:'16px', marginTop:'16px'}}>
                <button type="button" className="btn-marquee" style={{background:'var(--secondary)', flex:1}} onClick={() => setShowShowtimeModal(false)}>CANCELAR</button>
                <button type="submit" className="btn-marquee" style={{flex:1}}>GUARDAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div className="modal-overlay" style={{zIndex: 3000}}>
          <div className="gold-frame confirm-modal-content" style={{background:'white', width:'90%', maxWidth:'400px', padding:'40px'}}>
            <span className="pre-title" style={{fontSize:'0.6rem'}}>{confirmModal.title}</span>
            <h3 className="movie-meta-title" style={{fontSize:'1.5rem'}}>{confirmModal.message}</h3>
            <div>
              <button className="btn-marquee" style={{background:'var(--secondary)', flex:1, padding:'12px'}} onClick={() => setConfirmModal({ ...confirmModal, show: false })}>CANCELAR</button>
              <button className="btn-marquee" style={{flex:1, padding:'12px'}} onClick={confirmModal.onConfirm}>CONFIRMAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
