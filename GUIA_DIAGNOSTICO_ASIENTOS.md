# 🔍 Guía de Diagnóstico - Problema de Asientos

## 📋 Resumen del Problema

Los asientos no se muestran en la interfaz de compra de tiquetes, aunque:
- ✅ La tabla `asientos` tiene 150 registros
- ✅ La tabla `funcion_asiento` tiene 150 registros
- ✅ La UI carga correctamente (pantalla, leyenda, etc.)

## 🎯 Causa Raíz (Más Probable)

El problema NO es que falte el campo `estado` en la base de datos. El backend **SÍ calcula y devuelve** el campo `estado` correctamente:

```sql
-- El backend hace esta transformación automáticamente:
CASE 
  WHEN fa.ocupado THEN 'vendido' 
  WHEN fa.bloqueado_hasta > CURRENT_TIMESTAMP THEN 'bloqueado'
  ELSE 'disponible' 
END as estado
```

**El problema más probable es que el endpoint no está devolviendo datos o hay un error en la petición.**

---

## 🔧 Pasos de Diagnóstico

### Paso 1: Ejecutar Script de Diagnóstico

```bash
node debug_asientos.js
```

Este script verificará:
- ✅ Conexión al backend
- ✅ Existencia de funciones
- ✅ Existencia de asientos para cada función
- ✅ Estructura de datos devueltos
- ✅ Distribución de estados

### Paso 2: Verificar en el Navegador

1. Abre la aplicación en el navegador
2. Abre las herramientas de desarrollo (F12)
3. Ve a la pestaña **Console**
4. Busca errores como:
   - `CORS error`
   - `Failed to fetch`
   - `404 Not Found`
   - `500 Internal Server Error`

5. Ve a la pestaña **Network**
6. Filtra por `seats`
7. Verifica la petición `GET /showtimes/:id/seats`
8. Revisa:
   - **Status Code**: Debería ser `200 OK`
   - **Response**: Debería ser un array con 150 objetos

### Paso 3: Verificar Variables de Entorno

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:4000
```

**Backend (`backend/.env`):**
```env
NHOST_DB_URL=postgresql://usuario:password@host:puerto/base_datos
```

### Paso 4: Verificar Logs del Backend

```bash
cd backend
npm run dev
```

Busca mensajes como:
```
Conectado a la base de datos de Nhost (PostgreSQL)
Insertando 150 asientos base...
150 asientos creados (15x10).
```

### Paso 5: Probar Endpoint Manualmente

Usa curl o Postman para probar directamente:

```bash
# Reemplaza X con el ID de una función existente
curl http://localhost:4000/showtimes/X/seats
```

Deberías recibir un JSON como:
```json
[
  {
    "mapping_id": 1,
    "fila": "A",
    "columna": 1,
    "asiento_id": 1,
    "estado": "disponible"
  },
  ...
]
```

---

## 🐛 Problemas Comunes y Soluciones

### Problema 1: No hay funciones en la base de datos

**Síntoma:**
- El script de diagnóstico muestra "No hay funciones en la base de datos"

**Solución:**
1. Inicia sesión como admin
2. Ve al panel de administración
3. Crea una nueva función (showtime)

### Problema 2: Las funciones no tienen asientos asociados

**Síntoma:**
- El endpoint devuelve array vacío `[]`
- La tabla `funcion_asiento` tiene registros pero no para la función específica

**Solución:**
Ejecuta el script de corrección:
```bash
psql -U tu_usuario -d tu_base_datos -f fix_asientos.sql
```

### Problema 3: Error de CORS

**Síntoma:**
- Error en consola: `Access to fetch at 'http://localhost:4000' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Solución:**
Verifica que el backend tenga CORS habilitado (ya está configurado en `backend/src/index.js`):
```javascript
app.use(cors());
```

### Problema 4: Variable de entorno incorrecta

**Síntoma:**
- Error: `Failed to fetch`
- La URL en Network muestra `undefined/showtimes/...`

**Solución:**
Crea o verifica `frontend/.env`:
```env
VITE_API_URL=http://localhost:4000
```

Reinicia el frontend después de cambiar `.env`.

### Problema 5: Backend no está corriendo

**Síntoma:**
- Error: `ECONNREFUSED`
- No se puede acceder a `http://localhost:4000`

**Solución:**
```bash
cd backend
npm run dev
```

### Problema 6: Base de datos no conectada

**Síntoma:**
- Error en backend: `Error adquiriendo cliente`
- No se crean los asientos automáticamente

**Solución:**
1. Verifica `NHOST_DB_URL` en `backend/.env`
2. Verifica que PostgreSQL esté corriendo
3. Verifica credenciales de conexión

---

## 🛠️ Herramientas de Debug

### 1. Script de Diagnóstico (Node.js)

```bash
node debug_asientos.js
```

Verifica automáticamente todos los puntos críticos.

### 2. Componente de Debug (React)

Agrega temporalmente el componente `DebugSeats` a tu página de asientos:

```jsx
import DebugSeats from './components/DebugSeats';

// En tu componente de asientos:
<DebugSeats 
  seats={seats} 
  selectedShowtime={selectedShowtime}
  isLoading={isLoading}
/>
```

Este componente muestra:
- Estado de carga
- Datos de la función seleccionada
- Total de asientos
- Estructura del primer asiento
- Distribución por estado
- Filas encontradas

### 3. Consultas SQL de Verificación

```sql
-- Verificar asientos
SELECT COUNT(*) FROM asientos;

-- Verificar funciones
SELECT id, fecha, hora, sala FROM funciones;

-- Verificar asientos por función
SELECT 
  f.id as funcion_id,
  COUNT(fa.id) as total_asientos
FROM funciones f
LEFT JOIN funcion_asiento fa ON f.id = fa.funcion_id
GROUP BY f.id;

-- Verificar asientos de una función específica
SELECT 
  a.fila,
  a.columna,
  fa.ocupado,
  fa.bloqueado_hasta,
  CASE 
    WHEN fa.ocupado THEN 'vendido' 
    WHEN fa.bloqueado_hasta > CURRENT_TIMESTAMP THEN 'bloqueado'
    ELSE 'disponible' 
  END as estado
FROM funcion_asiento fa
JOIN asientos a ON fa.asiento_id = a.id
WHERE fa.funcion_id = 1  -- Reemplaza con tu función ID
ORDER BY a.fila, a.columna;
```

---

## ✅ Checklist de Verificación

- [ ] Backend corriendo en `http://localhost:4000`
- [ ] Frontend corriendo en `http://localhost:5173`
- [ ] Variable `VITE_API_URL` configurada correctamente
- [ ] Base de datos conectada (PostgreSQL/Nhost)
- [ ] Tabla `asientos` tiene 150 registros
- [ ] Existe al menos una función en la tabla `funciones`
- [ ] Tabla `funcion_asiento` tiene registros para la función
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en consola del backend
- [ ] Endpoint `/showtimes/:id/seats` devuelve datos
- [ ] Respuesta incluye campos: `mapping_id`, `fila`, `columna`, `asiento_id`, `estado`

---

## 📞 Si Nada Funciona

1. **Reinicia todo:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Ejecuta script de corrección:**
   ```bash
   psql -U tu_usuario -d tu_base_datos -f fix_asientos.sql
   ```

3. **Limpia caché del navegador:**
   - Chrome: `Ctrl + Shift + Delete` → "Borrar datos de navegación"
   - O usa modo incógnito

4. **Verifica versión de Node.js:**
   ```bash
   node --version  # Debería ser v18 o superior
   ```

5. **Reinstala dependencias:**
   ```bash
   cd backend && rm -rf node_modules && npm install
   cd ../frontend && rm -rf node_modules && npm install
   ```

---

## 🎯 Resultado Esperado

Después de seguir estos pasos, deberías ver:
- ✅ 150 asientos renderizados en la interfaz
- ✅ Asientos organizados en 15 filas (A-O) × 10 columnas (1-10)
- ✅ Estados visuales: disponible (verde), ocupado (rojo), bloqueado (naranja)
- ✅ Selección interactiva de asientos
- ✅ Bloqueo temporal durante la selección

---

## 📚 Archivos Relacionados

- [`debug_asientos.js`](debug_asientos.js) - Script de diagnóstico
- [`fix_asientos.sql`](fix_asientos.sql) - Script de corrección
- [`frontend/src/components/DebugSeats.jsx`](frontend/src/components/DebugSeats.jsx) - Componente de debug
- [`backend/src/routes/showtimes.js`](backend/src/routes/showtimes.js) - Endpoint de asientos
- [`frontend/src/App.jsx`](frontend/src/App.jsx) - Renderizado de asientos
