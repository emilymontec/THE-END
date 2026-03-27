import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function Seats() {
  const { funcionId } = useParams();
  const [selected,setSelected] = useState([]);

  const toggleSeat = (id)=>{
    setSelected(prev=>prev.includes(id)?prev.filter(s=>s!==id):[...prev,id]);
  }

  const buy = async ()=>{
    try {
      const res = await api.post('/tickets',{funcion_id:funcionId,asientos:selected});
      alert('Compra exitosa, código: '+res.data.codigo);
    } catch (err) {
      alert('Error: ' + err.response?.data?.error || err.message);
    }
  }

  return (
    <div>
      <Link to="/">← Volver a Cartelera</Link>
      <h2>Selecciona asientos</h2>
      {[...Array(30)].map((_,i)=>(
        <button key={i} onClick={()=>toggleSeat(i+1)}>
          {i+1}
        </button>
      ))}
      <button onClick={buy}>Comprar</button>
    </div>
  )
}