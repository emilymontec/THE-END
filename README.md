# 🎬 THE-END - Sistema de Gestión de Cine

[![React](https://img.shields.io/badge/React-19.2.4-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0.1-purple.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5.2.1-green.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Nhost-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

## 📋 Descripción

**THE-END** es una aplicación web completa para la gestión de un cine, que permite administrar películas, funciones, asientos y venta de tiquetes. El sistema incluye diferentes roles de usuario (administrador, operario y cliente) con funcionalidades específicas para cada uno.

## ✨ Características Principales

### 🎭 Gestión de Películas
- Crear, editar y eliminar películas
- Subir pósters de películas
- Cambiar estado (activa/inactiva)
- Marcar películas como destacadas
- Filtrar por género y búsqueda por título

### 🎟️ Sistema de Tiquetes
- Selección interactiva de asientos
- Bloqueo temporal de asientos durante la compra
- Generación de códigos QR únicos
- Descarga de tiquetes en formato PDF
- Validación de tiquetes por código QR

### 👥 Gestión de Usuarios
- Registro y autenticación de usuarios
- Tres roles: **Admin**, **Operario**, **Cliente**
- Panel de administración de usuarios
- Historial de accesos

### 📊 Panel de Administración
- Estadísticas de ventas en tiempo real
- Reportes por rango de fechas
- Historial de todas las ventas
- Gestión de funciones y horarios

### 🎬 Funciones
- Crear y gestionar funciones
- Asignar salas y precios
- Fechas y horarios flexibles
- Estado de funciones (disponible/cancelada)

### 💺 Sistema de Asientos
- 150 asientos organizados (15 filas × 10 columnas)
- Visualización en tiempo real
- Bloqueo automático durante la selección
- Prevención de doble reserva

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 19.2.4** - Biblioteca de interfaz de usuario
- **Vite 8.0.1** - Herramienta de construcción rápida
- **React Router DOM 7.13.2** - Enrutamiento
- **Axios 1.13.6** - Cliente HTTP
- **QRCode.react 4.2.0** - Generación de códigos QR
- **jsPDF 4.2.1** - Generación de PDFs
- **html2canvas 1.4.1** - Captura de HTML a imagen

### Backend
- **Node.js** - Entorno de ejecución
- **Express 5.2.1** - Framework web
- **PostgreSQL (Nhost)** - Base de datos
- **Multer 2.1.1** - Manejo de archivos
- **CORS 2.8.6** - Política de recursos cruzados
- **dotenv 17.3.1** - Variables de entorno
- **UUID 13.0.0** - Generación de identificadores únicos

### Base de Datos
- **PostgreSQL** - Sistema de gestión de bases de datos
- **Nhost** - Plataforma backend-as-a-service

## 📁 Estructura del Proyecto

```
THE-END/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js           # Configuración de base de datos
│   │   ├── routes/
│   │   │   ├── movies.js       # Rutas de películas
│   │   │   ├── showtimes.js    # Rutas de funciones
│   │   │   ├── tickets.js      # Rutas de tiquetes
│   │   │   ├── users.js        # Rutas de usuarios
│   │   │   └── upload.js       # Rutas de carga de archivos
│   │   └── index.js            # Punto de entrada del servidor
│   ├── public/
│   │   └── uploads/            # Archivos subidos
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Movies.jsx      # Página de películas
│   │   │   ├── Showtimes.jsx   # Página de funciones
│   │   │   └── Seats.js        # Página de asientos
│   │   ├── assets/             # Imágenes y recursos
│   │   ├── api.js              # Configuración de API
│   │   ├── App.jsx             # Componente principal
│   │   ├── App.css             # Estilos
│   │   └── main.jsx            # Punto de entrada
│   ├── public/
│   └── package.json
├── entitys.sql                 # Script de base de datos
├── package.json
└── README.md
```

## 🚀 Requisitos Previos

- **Node.js** (v18 o superior)
- **npm** o **yarn**
- **PostgreSQL** (o cuenta en Nhost)
- **Git**

## ⚙️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/the-end.git
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

O si usas Nhost, ejecuta el contenido del archivo `entitys.sql` en la consola SQL de Nhost.

## 🏃‍♂️ Ejecución

### Desarrollo

#### Iniciar el Backend

```bash
cd backend
npm run dev
```

El servidor se iniciará en `http://localhost:4000`

#### Iniciar el Frontend

```bash
cd frontend
npm run dev
```

La aplicación se iniciará en `http://localhost:5173`

### Producción

#### Build del Frontend

```bash
cd frontend
npm run build
```

#### Iniciar el Backend en Producción

```bash
cd backend
npm start
```

## 🔌 API Endpoints

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

## 🗄️ Modelo de Base de Datos

### Tablas Principales

#### `usuarios`
- `id` - Identificador único
- `nombre` - Nombre del usuario
- `email` - Correo electrónico (único)
- `password` - Contraseña
- `rol` - Rol (admin, cliente, operario)
- `fecha_creacion` - Fecha de creación

#### `peliculas`
- `id` - Identificador único
- `titulo` - Título de la película
- `descripcion` - Descripción
- `duracion` - Duración en minutos
- `genero` - Género
- `clasificacion` - Clasificación
- `imagen_url` - URL del póster
- `trailer_url` - URL del tráiler
- `estado` - Estado (activa, inactiva)
- `destacada` - Si está destacada

#### `funciones`
- `id` - Identificador único
- `pelicula_id` - ID de la película
- `fecha` - Fecha de la función
- `hora` - Hora de la función
- `sala` - Sala de cine
- `precio` - Precio del tiquete
- `estado` - Estado (disponible, cancelada)

#### `asientos`
- `id` - Identificador único
- `numero` - Número del asiento
- `fila` - Fila (A-O)
- `columna` - Columna (1-10)
- `estado` - Estado (activo, inactivo)

#### `funcion_asiento`
- `id` - Identificador único
- `funcion_id` - ID de la función
- `asiento_id` - ID del asiento
- `ocupado` - Si está ocupado
- `bloqueado_hasta` - Timestamp de bloqueo temporal

#### `tiquetes`
- `id` - Identificador único
- `codigo` - Código único del tiquete
- `usuario_id` - ID del usuario
- `funcion_id` - ID de la función
- `fecha_compra` - Fecha de compra
- `total` - Total pagado
- `estado` - Estado (activo, usado, cancelado)
- `es_taquilla` - Si fue vendido en taquilla
- `fecha_uso` - Fecha de uso

#### `detalle_tiquete`
- `id` - Identificador único
- `tiquete_id` - ID del tiquete
- `asiento_id` - ID del asiento
- `precio_unitario` - Precio unitario

## 👤 Roles de Usuario

### 🔑 Administrador
- Acceso completo al panel de administración
- Gestión de películas, funciones y usuarios
- Visualización de estadísticas y reportes
- Validación de tiquetes

### 👷 Operario
- Validación de tiquetes
- Venta de tiquetes en taquilla
- Visualización de estadísticas básicas

### 👤 Cliente
- Visualización de películas
- Compra de tiquetes en línea
- Historial de compras
- Descarga de tiquetes

## 🔒 Seguridad

- Autenticación de usuarios
- Control de acceso basado en roles
- Bloqueo temporal de asientos
- Validación de tiquetes por código QR
- CORS configurado

## 📝 Notas

- El sistema crea automáticamente 150 asientos (15 filas × 10 columnas) al iniciar si no existen
- Los asientos se bloquean temporalmente durante la selección para evitar doble reserva
- Los tiquetes generan códigos QR únicos para validación
- El frontend se conecta al backend a través de la variable de entorno `VITE_API_URL`

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Tu Nombre** - *Desarrollo inicial* - [Tu GitHub](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- React por su excelente documentación
- Vite por su velocidad de desarrollo
- Express por su simplicidad
- PostgreSQL por su robustez

---

<div align="center">
  <sub>Desarvido con ❤️ para el mundo del cine</sub>
</div>
