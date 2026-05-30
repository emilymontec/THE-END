# THE-END

## Sistema de Gestión de Cine
Aplicación web diseñada para optimizar la gestión de cines. Permite administrar películas, funciones, usuarios y ventas de tiquetes mediante una interfaz intuitiva y un sistema seguro de control de acceso.

Además, incorpora selección interactiva de asientos, generación de códigos QR para validación de entradas y reportes administrativos en tiempo real.


## Características

### Gestión de Películas

* Crear, editar y eliminar películas.
* Subida de pósters.
* Activar o desactivar películas.
* Marcar películas como destacadas.
* Filtrar por género.
* Búsqueda por título.

### Sistema de Tiquetes

* Selección interactiva de asientos.
* Bloqueo temporal durante la compra.
* Generación automática de códigos QR.
* Descarga de tiquetes en PDF.
* Validación de entradas mediante QR.

### Gestión de Usuarios

* Registro e inicio de sesión.
* Control de acceso por roles.
* Administración de usuarios.
* Historial de accesos.

### Panel Administrativo

* Estadísticas de ventas en tiempo real.
* Reportes por rango de fechas.
* Historial completo de ventas.
* Gestión de funciones y horarios.

### Gestión de Funciones

* Creación y edición de funciones.
* Asignación de salas.
* Configuración de precios.
* Gestión de fechas y horarios.
* Cancelación de funciones.

### Sistema de Asientos

* 150 asientos organizados en 15 filas × 10 columnas.
* Visualización en tiempo real.
* Bloqueo automático durante la selección.
* Prevención de reservas duplicadas.


## Tecnologías Utilizadas

| Capa | Tecnología |
|--------|------------|
| Frontend | React + Vite |
| Backend | Node.js + Express.js |
| Base de Datos | Supabase PostgreSQL |
| Generación QR | QRCode |
| PDF | PDFKit |
| Despliegue | Render |


## Arquitectura

```text
Cliente
   │
   ▼
Frontend (React)
   │
   ▼
API REST (Node.js + Express)
   │
   ▼
PostgreSQL
```


## Requisitos

- Node.js 18 o superior
- Base de datos en Supabase
- npm


## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/emilymontec/THE-END.git
cd the-end
```

### 2. Instalar dependencias del Backend

```bash
cd backend
npm install
```

### 3. Instalar dependencias del Frontend

```bash
cd ../frontend
npm install
```

### 4. Configurar variables de entorno

#### Backend (`backend/.env`)

```env
SUPABASE_DB_URL=https://id.supabase.co
ADMIN_USERNAME=admin@cinema.com
ADMIN_PASSWORD=admin123
PORT=4000
```

#### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:4000
```

### 5. Configurar la base de datos

Ejecutar el script SQL:

```bash
psql -U tu_usuario -d tu_base_datos -f entitys.sql
```

### 6. Iniciar el proyecto

Backend:

```bash
cd backend
npm start
```

Frontend:

```bash
cd frontend
npm run dev
```

Aplicación disponible en:

```text
http://localhost:5173
```


## Variables de Entorno

### Backend

| Variable | Descripción |
|-----------|------------|
| SUPABASE_DB_URL | URL de conexión a Supabase PostgreSQL |
| ADMIN_USERNAME | Usuario administrador inicial |
| ADMIN_PASSWORD | Contraseña administrador inicial |
| PORT | Puerto del servidor |

### Frontend

| Variable | Descripción |
|-----------|------------|
| VITE_API_URL | URL del backend |


## APIs

### Películas (`/movies`)

| Método | Ruta | Descripción |
|---------|--------|------------|
| GET | `/movies` | Obtener todas las películas |
| GET | `/movies/:id` | Obtener película por ID |
| POST | `/movies` | Crear película |
| PUT | `/movies/:id` | Actualizar película |
| DELETE | `/movies/:id` | Eliminar película |
| PATCH | `/movies/:id/status` | Cambiar estado |

### Funciones (`/showtimes`)

| Método | Ruta | Descripción |
|---------|--------|------------|
| GET | `/showtimes` | Obtener funciones |
| GET | `/showtimes/:id` | Obtener función por ID |
| GET | `/showtimes/:id/seats` | Obtener asientos |
| POST | `/showtimes` | Crear función |
| POST | `/showtimes/:id/lock-seats` | Bloquear asientos |
| DELETE | `/showtimes/:id` | Eliminar función |

### Tiquetes (`/tickets`)

| Método | Ruta | Descripción |
|---------|--------|------------|
| GET | `/tickets` | Obtener tiquetes |
| GET | `/tickets/stats/summary` | Estadísticas de ventas |
| GET | `/tickets/validate/:code` | Validar tiquete |
| POST | `/tickets` | Crear tiquete |
| POST | `/tickets/use/:code` | Marcar como usado |
| DELETE | `/tickets/:id` | Cancelar tiquete |

---

### Usuarios (`/users`)

| Método | Ruta | Descripción |
|---------|--------|------------|
| POST | `/users/login` | Iniciar sesión |
| POST | `/users/register` | Registrar usuario |
| GET | `/users/admin/users` | Listar usuarios |
| POST | `/users/admin/users` | Crear usuario |
| DELETE | `/users/admin/users/:id` | Eliminar usuario |

### Upload (`/upload`)

| Método | Ruta | Descripción |
|---------|--------|------------|
| POST | `/upload` | Subir imagen |


## Roles del Sistema

### Administrador

* Gestión completa de películas.
* Gestión de funciones.
* Administración de usuarios.
* Acceso a estadísticas.
* Reportes de ventas.
* Validación de tiquetes.

### Operario

* Venta de tiquetes.
* Validación de entradas.
* Consulta de estadísticas básicas.

### Cliente

* Visualización de cartelera.
* Compra de tiquetes.
* Selección de asientos.
* Descarga de entradas.
* Historial de compras.


## Seguridad

* Autenticación de usuarios.
* Control de acceso basado en roles.
* Bloqueo temporal de asientos.
* Prevención de reservas duplicadas.
* Validación de tiquetes mediante QR.
* Configuración de CORS.
* Protección de rutas administrativas.


## Notas

* El sistema genera automáticamente los 150 asientos si no existen.
* Los asientos se bloquean temporalmente durante el proceso de compra.
* Cada tiquete genera un código QR único para validación.
* Las funciones pueden configurarse con diferentes precios y horarios.


## Contribuciones

1. Haz un fork del repositorio.
2. Crea una rama para tu nueva funcionalidad:
```bash
git checkout -b feature/nueva-funcionalidad
```
3. Realiza tus cambios.
4. Haz commit y push.
5. Abre un Pull Request.

---

## Licencia

Este proyecto está bajo la **Licencia ISC**.

Consulta el archivo `LICENSE` para más información.

---

## Equipo de Desarrollo

| Integrante | Rol |	GitHub 
|---|---|---|
| Jemima Cerpa | Desarrollo Frontend | [jemcu](https://github.com/jemcu) |
| Jailiss Gómez	| Diseño UX/UI | [jailisita](https://github.com/jailisita) |
| Melany Tesillo | Desarrollo Frontend | [mptse](https://github.com/mptse) |
| Emily Monterrosa | Desarrollo Backend | [emilymontec](https://github.com/emilymontec) |
