import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function Showtimes() {
  const { movieId } = useParams();
  const [showtimes, setShowtimes] = useState([]);

  useEffect(() => {
    api.get('/showtimes')
       .then(res => {
         // Filtrar por movieId si es necesario, pero por ahora mostrar todas
         setShowtimes(res.data);
       })
       .catch(err => console.log('Error:', err));
  }, []);

  return (
    <div>
      <Link to="/">← Volver a Cartelera</Link>
      <h1>Funciones</h1>
      {showtimes.map(s => (
        <div key={s.id}>
          <h3>{s.titulo}</h3>
          <p>{s.fecha_hora}</p>
          <Link to={`/seats/${s.id}`}>Seleccionar asientos</Link>
        </div>
      ))}
    </div>
  );
}