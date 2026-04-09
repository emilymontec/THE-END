# THE-END - Sistema de Gestión de Cine

## Descripción

**THE-END** es una aplicación web completa para la gestión de un cine, que permite administrar películas, funciones, asientos y venta de tiquetes. El sistema incluye diferentes roles de usuario (administrador, operario y cliente) con funcionalidades específicas para cada uno.

## Características Principales

### Gestión de Películas:
- Crear, editar y eliminar películas
- Subir pósters de películas
- Cambiar estado (activa/inactiva)
- Marcar películas como destacadas
- Filtrar por género y búsqueda por título

### Sistema de Tiquetes:
- Selección interactiva de asientos
- Bloqueo temporal de asientos durante la compra
- Generación de códigos QR únicos
- Descarga de tiquetes en formato PDF
- Validación de tiquetes por código QR

### Gestión de Usuarios:
- Registro y autenticación de usuarios
- Tres roles: **Admin**, **Operario**, **Cliente**
- Panel de administración de usuarios
- Historial de accesos

### Panel de Administración:
- Estadísticas de ventas en tiempo real
- Reportes por rango de fechas
- Historial de todas las ventas
- Gestión de funciones y horarios

### Funciones:
- Crear y gestionar funciones
- Asignar salas y precios
- Fechas y horarios flexibles
- Estado de funciones (disponible/cancelada)

### Sistema de Asientos
- 150 asientos organizados (15 filas × 10 columnas)
- Visualización en tiempo real
- Bloqueo automático durante la selección
- Prevención de doble reserva

## Tecnologías Utilizadas

- Frontend: React
- Backend: Node.js + Express
- Base de Datos: PostgreSQL


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
# URL de conexión a PostgreSQL (Nhost)
NHOST_DB_URL=postgresql://usuario:password@host:puerto/base_datos

# Credenciales de administrador (opcional)
ADMIN_USERNAME=admin@cinema.com
ADMIN_PASSWORD=admin123

# Puerto del servidor (opcional, por defecto 4000)
PORT=4000
```

#### Frontend (`frontend/.env`)

```env
# URL del backend
VITE_API_URL=http://localhost:4000
```

### 5. Configurar la base de datos

Ejecuta el script SQL para crear las tablas:

```bash
psql -U tu_usuario -d tu_base_datos -f entitys.sql
```

## API Endpoints

### Películas (`/movies`)
- `GET /movies` - Obtener todas las películas
- `GET /movies/:id` - Obtener película por ID
- `POST /movies` - Crear nueva película
- `PUT /movies/:id` - Actualizar película
- `DELETE /movies/:id` - Eliminar película
- `PATCH /movies/:id/status` - Cambiar estado de película

### Funciones (`/showtimes`)
- `GET /showtimes` - Obtener todas las funciones
- `GET /showtimes/:id` - Obtener función por ID
- `GET /showtimes/:id/seats` - Obtener asientos de una función
- `POST /showtimes` - Crear nueva función
- `POST /showtimes/:id/lock-seats` - Bloquear asientos temporalmente
- `DELETE /showtimes/:id` - Eliminar función

### Tiquetes (`/tickets`)
- `GET /tickets` - Obtener todos los tiquetes
- `GET /tickets/stats/summary` - Obtener estadísticas de ventas
- `GET /tickets/validate/:code` - Validar tiquete por código
- `POST /tickets` - Crear nuevo tiquete
- `POST /tickets/use/:code` - Marcar tiquete como usado
- `DELETE /tickets/:id` - Cancelar tiquete

### Usuarios (`/users`)
- `POST /users/login` - Iniciar sesión
- `POST /users/register` - Registrar nuevo usuario
- `GET /users/admin/users` - Obtener todos los usuarios (admin)
- `POST /users/admin/users` - Crear usuario (admin)
- `DELETE /users/admin/users/:id` - Eliminar usuario (admin)

### Upload (`/upload`)
- `POST /upload` - Subir imagen

## Roles de Usuario

### Administrador:
- Acceso completo al panel de administración
- Gestión de películas, funciones y usuarios
- Visualización de estadísticas y reportes
- Validación de tiquetes

### Operario:
- Validación de tiquetes
- Venta de tiquetes en taquilla
- Visualización de estadísticas básicas

### Cliente:
- Visualización de películas
- Compra de tiquetes en línea
- Historial de compras
- Descarga de tiquetes


## Seguridad

- Autenticación de usuarios
- Control de acceso basado en roles
- Bloqueo temporal de asientos
- Validación de tiquetes por código QR
- CORS configurado

## Notas

- El sistema crea automáticamente 150 asientos al iniciar si no existen
- Los asientos se bloquean temporalmente durante la selección para evitar doble reserva
- Los tiquetes generan códigos QR únicos para validación


## Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo [LICENSE](LICENSE) para más detalles.

## Autores

- **Jailiss Goméz** - *Desarrollo inicial* - [GitHub](https://github.com/emilymontec)
- **Emily Monterrosa** - *Desarrollo final* - [GitHub](https://github.com/jailisita)
