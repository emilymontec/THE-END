// Componente de debug para verificar datos de asientos
// Agregar temporalmente al componente Seats para diagnosticar problemas

import React from 'react';

export default function DebugSeats({ seats, selectedShowtime, isLoading }) {
  // Solo mostrar en desarrollo
  if (import.meta.env.PROD) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: '#0f0',
      padding: '20px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxWidth: '400px',
      maxHeight: '500px',
      overflow: 'auto',
      zIndex: 9999,
      border: '1px solid #0f0'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#0f0' }}>🔍 DEBUG ASIENTOS</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Estado de carga:</strong> {isLoading ? '⏳ Cargando...' : '✅ Listo'}
      </div>

      {selectedShowtime && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Función seleccionada:</strong>
          <pre style={{ margin: '5px 0', fontSize: '10px' }}>
            {JSON.stringify(selectedShowtime, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginBottom: '10px' }}>
        <strong>Total asientos:</strong> {seats.length}
      </div>

      {seats.length > 0 && (
        <>
          <div style={{ marginBottom: '10px' }}>
            <strong>Primer asiento (estructura):</strong>
            <pre style={{ margin: '5px 0', fontSize: '10px' }}>
              {JSON.stringify(seats[0], null, 2)}
            </pre>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong>Campos disponibles:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              {Object.keys(seats[0]).map(key => (
                <li key={key}>{key}: {typeof seats[0][key]}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong>Distribución por estado:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              {Object.entries(
                seats.reduce((acc, seat) => {
                  acc[seat.estado] = (acc[seat.estado] || 0) + 1;
                  return acc;
                }, {})
              ).map(([estado, count]) => (
                <li key={estado}>{estado}: {count}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong>Filas encontradas:</strong>
            {[...new Set(seats.map(s => s.fila))].sort().join(', ')}
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong>Asientos por fila:</strong> {seats.length / [...new Set(seats.map(s => s.fila))].length}
          </div>
        </>
      )}

      {seats.length === 0 && !isLoading && (
        <div style={{ color: '#f00', fontWeight: 'bold' }}>
          ❌ NO HAY ASIENTOS - Verificar:
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>¿El backend está corriendo?</li>
            <li>¿Hay asientos en la BD?</li>
            <li>¿La función tiene asientos asociados?</li>
            <li>¿Hay errores en la consola?</li>
          </ul>
        </div>
      )}

      <div style={{ marginTop: '10px', fontSize: '10px', color: '#888' }}>
        Este panel solo aparece en modo desarrollo
      </div>
    </div>
  );
}
