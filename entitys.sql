DROP TABLE IF EXISTS detalle_tiquete CASCADE;
DROP TABLE IF EXISTS tiquetes CASCADE;
DROP TABLE IF EXISTS funcion_asiento CASCADE;
DROP TABLE IF EXISTS funciones CASCADE;
DROP TABLE IF EXISTS peliculas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS asientos CASCADE;

-- =========================
-- TABLA: usuarios
-- =========================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol VARCHAR(20) CHECK (rol IN ('admin', 'cliente')) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABLA: peliculas
-- =========================
CREATE TABLE IF NOT EXISTS peliculas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    duracion INT NOT NULL,
    genero VARCHAR(50),
    clasificacion VARCHAR(10),
    imagen_url TEXT,
    trailer_url TEXT,
    estado VARCHAR(20) CHECK (estado IN ('activa', 'inactiva')) DEFAULT 'activa'
);

-- =========================
-- TABLA: funciones
-- =========================
CREATE TABLE IF NOT EXISTS funciones (
    id SERIAL PRIMARY KEY,
    pelicula_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    sala VARCHAR(20),
    precio NUMERIC(10,2) NOT NULL,
    estado VARCHAR(20) CHECK (estado IN ('disponible', 'cancelada')) DEFAULT 'disponible',

    CONSTRAINT fk_pelicula
        FOREIGN KEY (pelicula_id)
        REFERENCES peliculas(id)
        ON DELETE CASCADE
);

-- =========================
-- TABLA: asientos
-- =========================
CREATE TABLE IF NOT EXISTS asientos (
    id SERIAL PRIMARY KEY,
    numero INT NOT NULL,
    fila CHAR(1) NOT NULL,
    columna INT NOT NULL,
    estado VARCHAR(20) CHECK (estado IN ('activo', 'inactivo')) DEFAULT 'activo'
);

-- =========================
-- TABLA INTERMEDIA: funcion_asiento
-- =========================
CREATE TABLE IF NOT EXISTS funcion_asiento (
    id SERIAL PRIMARY KEY,
    funcion_id INT NOT NULL,
    asiento_id INT NOT NULL,
    ocupado BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_funcion_asiento_funcion
        FOREIGN KEY (funcion_id)
        REFERENCES funciones(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_funcion_asiento_asiento
        FOREIGN KEY (asiento_id)
        REFERENCES asientos(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_funcion_asiento UNIQUE (funcion_id, asiento_id)
);

-- =========================
-- TABLA: tiquetes
-- =========================
CREATE TABLE IF NOT EXISTS tiquetes (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    usuario_id INT,
    funcion_id INT NOT NULL,
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(10,2) NOT NULL,
    estado VARCHAR(20) CHECK (estado IN ('activo', 'usado', 'cancelado')) DEFAULT 'activo',

    CONSTRAINT fk_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_funcion
        FOREIGN KEY (funcion_id)
        REFERENCES funciones(id)
        ON DELETE CASCADE
);

-- =========================
-- TABLA: detalle_tiquete
-- =========================
CREATE TABLE IF NOT EXISTS detalle_tiquete (
    id SERIAL PRIMARY KEY,
    tiquete_id INT NOT NULL,
    asiento_id INT NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,

    CONSTRAINT fk_tiquete
        FOREIGN KEY (tiquete_id)
        REFERENCES tiquetes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_asiento
        FOREIGN KEY (asiento_id)
        REFERENCES asientos(id)
        ON DELETE CASCADE,

    -- Evita repetir el mismo asiento en un mismo tiquete
    CONSTRAINT unique_tiquete_asiento UNIQUE (tiquete_id, asiento_id)
);