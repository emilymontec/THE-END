# 🚨 SOLUCIÓN INMEDIATA - Asientos No Se Muestran

## 📋 Problema
Los asientos no aparecen en la interfaz de compra aunque la página carga correctamente.

## 🔍 Diagnóstico Rápido

### Paso 1: Verificar la consola del navegador

1. Abre la aplicación en el navegador
2. Presiona **F12** (herramientas de desarrollo)
3. Ve a la pestaña **Console**
4. Busca errores como:
   - `API Error: undefined`
   - `Failed to fetch`
   - `CORS error`
   - `404 Not Found`

### Paso 2: Verificar la pestaña Network

1. En herramientas de desarrollo, ve a **Network**
2. Filtra por `seats`
3. Recarga la página y selecciona una función
4. Busca la petición `GET /showtimes/:id/seats`
5. Verifica:
   - **Status**: ¿Es `200 OK` o un error?
   - **Response**: ¿Es un array vacío `[]` o tiene datos?

---

## ✅ SOLUCIÓN INMEDIATA

### Opción 1: Crear archivo .env en frontend (RECOMENDADO)

Crea el archivo `frontend/.env` con este contenido:

```env
VITE_API_URL=http://localhost:4000
```

**Después de crear el archivo:**
1. Detén el servidor de desarrollo (Ctrl+C)
2. Reinicia el frontend: `npm run dev`
3. Recarga la página en el navegador

### Opción 2: Verificar que el backend esté corriendo

```bash
# En una terminal separada:
cd backend
npm run dev
```

Deberías ver:
```
Server → http://localhost:4000
Conectado a la base de datos de Nhost (PostgreSQL)
```

### Opción 3: Ejecutar script de corrección SQL

```bash
psql -U tu_usuario -d tu_base_datos -f fix_asientos.sql
```

Este script:
- ✅ Crea 150 asientos si no existen
- ✅ Asocia asientos a funciones existentes
- ✅ Limpia bloqueos temporales

---

## 🔧 Verificación Paso a Paso

### 1. Verificar variables de entorno

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:4000
```

**Backend (`backend/.env`):**
```env
NHOST_DB_URL=postgresql://usuario:password@host:puerto/base_datos
```

### 2. Verificar que el backend responda

Abre en el navegador: `http://localhost:4000`

Deberías ver:
```json
"The-End backend running..."
```

### 3. Verificar que existan funciones

```bash
curl http://localhost:4000/showtimes
```

Deberías ver un array con funciones.

### 4. Verificar asientos de una función

```bash
# Reemplaza X con el ID de una función existente
curl http://localhost:4000/showtimes/X/seats
```

Deberías ver un array con 150 asientos.

---

## 🐛 Errores Comunes y Soluciones

### Error: `API Error: undefined`
**Causa:** Variable `VITE_API_URL` no configurada
**Solución:** Crear `frontend/.env` con `VITE_API_URL=http://localhost:4000`

### Error: `Failed to fetch`
**Causa:** Backend no está corriendo
**Solución:** Ejecutar `cd backend && npm run dev`

### Error: `CORS error`
**Causa:** Backend no tiene CORS habilitado
**Solución:** Verificar que `app.use(cors())` esté en `backend/src/index.js`

### Error: `404 Not Found`
**Causa:** Ruta incorrecta o backend no responde
**Solución:** Verificar que el backend esté en puerto 4000

### Array vacío `[]`
**Causa:** No hay asientos asociados a la función
**Solución:** Ejecutar `fix_asientos.sql`

---

## 📝 Logs Temporales Agregados

He agregado logs temporales en el frontend para diagnosticar. Cuando selecciones una función, verás en la consola:

```
🔍 Cargando asientos para función: 1
📡 URL de API: http://localhost:4000
✅ Respuesta del servidor: [...]
📊 Total asientos recibidos: 150
📋 Primer asiento: {mapping_id: 1, fila: "A", columna: 1, ...}
```

**Si ves un error**, el mensaje te dirá exactamente qué está mal.

---

## 🎯 Checklist de Verificación

- [ ] Backend corriendo en `http://localhost:4000`
- [ ] Frontend corriendo en `http://localhost:5173`
- [ ] Archivo `frontend/.env` creado con `VITE_API_URL=http://localhost:4000`
- [ ] Frontend reiniciado después de crear `.env`
- [ ] Base de datos conectada
- [ ] Tabla `asientos` tiene 150 registros
- [ ] Existe al menos una función
- [ ] Tabla `funcion_asiento` tiene registros
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en consola del backend

---

## 🚀 Si Nada Funciona

### Reinicio completo:

```bash
# 1. Detener todos los procesos (Ctrl+C)

# 2. Crear archivo .env en frontend
echo "VITE_API_URL=http://localhost:4000" > frontend/.env

# 3. Ejecutar script SQL
psql -U tu_usuario -d tu_base_datos -f fix_asientos.sql

# 4. Iniciar backend
cd backend
npm run dev

# 5. En otra terminal, iniciar frontend
cd frontend
npm run dev

# 6. Abrir navegador en http://localhost:5173

# 7. Abrir herramientas de desarrollo (F12)

# 8. Seleccionar una función y revisar la consola
```

---

## 📞 Información de Debug

Después de seguir estos pasos, en la consola del navegador deberías ver:

✅ **Si todo está bien:**
```
🔍 Cargando asientos para función: 1
📡 URL de API: http://localhost:4000
✅ Respuesta del servidor: (150) [{...}, {...}, ...]
📊 Total asientos recibidos: 150
📋 Primer asiento: {mapping_id: 1, fila: "A", columna: 1, asiento_id: 1, estado: "disponible"}
```

❌ **Si hay problema:**
```
🔍 Cargando asientos para función: 1
📡 URL de API: undefined  ← PROBLEMA: Variable no configurada
❌ Error cargando asientos: Error: Network Error
```

O:

```
🔍 Cargando asientos para función: 1
📡 URL de API: http://localhost:4000
✅ Respuesta del servidor: []
📊 Total asientos recibidos: 0  ← PROBLEMA: No hay asientos en BD
```

---

## 📚 Archivos Relacionados

- [`frontend/.env.example`](frontend/.env.example) - Ejemplo de configuración
- [`fix_asientos.sql`](fix_asientos.sql) - Script de corrección SQL
- [`debug_asientos.js`](debug_asientos.js) - Script de diagnóstico
- [`GUIA_DIAGNOSTICO_ASIENTOS.md`](GUIA_DIAGNOSTICO_ASIENTOS.md) - Guía completa
