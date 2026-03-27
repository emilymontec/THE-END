import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Movies() {
  const [movies,setMovies] = useState([]);

  useEffect(()=>{
    api.get('/movies')
       .then(res=>setMovies(res.data))
       .catch(err=>console.log('Error backend:',err));
  },[]);

  return (
    <div>
      <h1>Cartelera</h1>
      {movies.length===0 && <p>No hay películas aún</p>}
      {movies.map(m=>(
        <div key={m.id}>
          <h3>{m.titulo}</h3>
          <p>{m.genero}</p>
          <Link to={`/showtimes/${m.id}`}>Ver funciones</Link>
        </div>
      ))}
    </div>
  );
}