import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuración de la conexión a PostgreSQL (Nhost o Local)
const dbUrl = process.env.NHOST_DB_URL;
const isNhost = dbUrl && dbUrl.includes('nhost.run');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: isNhost ? { rejectUnauthorized: false } : false
});

// Probar conexión y sincronizar tablas
pool.connect(async (err, client, release) => {
  if (err) {
    return console.error('Error adquiriendo cliente:', err.stack);
  }
  console.log('Conectado a la base de datos de Nhost (PostgreSQL)');
  
  // Sincronizar tablas automáticamente al iniciar (Solo si no existen)
  try {
    const sqlPath = path.join(__dirname, '../../../entitys.sql');
    if (fs.existsSync(sqlPath)) {
      // Verificar si ya existe alguna tabla base para evitar re-ejecutar todo el SQL
      const checkTable = await client.query("SELECT to_regclass('public.usuarios')");
      if (!checkTable.rows[0].to_regclass) {
        console.log('Inicializando base de datos por primera vez...');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sql);
      } else {
        console.log('Base de datos detectada, verificando actualizaciones...');
      }
      
      // Asegurar que las columnas nuevas existan (Migraciones seguras)
      await client.query(`
        ALTER TABLE funcion_asiento ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMP;
        ALTER TABLE tiquetes ADD COLUMN IF NOT EXISTS es_taquilla BOOLEAN DEFAULT FALSE;
        ALTER TABLE tiquetes ADD COLUMN IF NOT EXISTS fecha_uso TIMESTAMP;
      `);

      // Asegurar que la columna rol acepte 'operario' (Sin borrar datos)
      await client.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_rol_check') THEN
            ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('admin', 'cliente', 'operario'));
          ELSE
            ALTER TABLE usuarios DROP CONSTRAINT usuarios_rol_check;
            ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('admin', 'cliente', 'operario'));
          END IF;
        END $$;
      `);

      // Usuarios base (Admin y Operario inicial)
      const userCount = await client.query('SELECT COUNT(*) FROM usuarios');
      if (parseInt(userCount.rows[0].count) === 0) {
        console.log('Insertando usuarios base...');
        const adminUser = process.env.ADMIN_USERNAME || 'admin@cinema.com';
        const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
        
        await client.query(
          "INSERT INTO usuarios(nombre, email, password, rol) VALUES($1, $2, $3, $4)",
          ['Administrador', adminUser, adminPass, 'admin']
        );
        await client.query(
          "INSERT INTO usuarios(nombre, email, password, rol) VALUES($1, $2, $3, $4)",
          ['Taquilla 1', 'staff@cinema.com', 'staff123', 'operario']
        );
        console.log(`Usuario base creado.`);
      }
    }

    // Asegurar que exista la tabla de salas
    await client.query(`
      CREATE TABLE IF NOT EXISTS salas (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(50) UNIQUE NOT NULL,
        precio_base NUMERIC(10,2) NOT NULL DEFAULT 0
      );
    `);

    // Insertar salas base si no existen
    const salaCount = await client.query('SELECT COUNT(*) FROM salas');
    if (parseInt(salaCount.rows[0].count) === 0) {
      console.log('Insertando salas base...');
      await client.query("INSERT INTO salas(nombre, precio_base) VALUES('Sala 1', 12000)");
      await client.query("INSERT INTO salas(nombre, precio_base) VALUES('Sala 2', 15000)");
      await client.query("INSERT INTO salas(nombre, precio_base) VALUES('Sala 3D', 22000)");
      await client.query("INSERT INTO salas(nombre, precio_base) VALUES('Sala IMAX', 30000)");
      console.log('Salas base creadas.');
    }

    // Asegurar que haya exactamente 150 asientos (15 filas x 10 columnas)
    const seatCount = await client.query('SELECT COUNT(*) FROM asientos');
    if (parseInt(seatCount.rows[0].count) !== 150) {
      console.log('Reiniciando asientos para asegurar 150 (15x10)...');
      // Limpiar asientos y relaciones existentes para evitar duplicados y conflictos
      await client.query('TRUNCATE TABLE asientos CASCADE');
      
      const filas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
      for (let f of filas) {
        for (let c = 1; c <= 10; c++) {
          const numero = (filas.indexOf(f) * 10) + c;
          await client.query('INSERT INTO asientos(numero, fila, columna) VALUES($1, $2, $3)', [numero, f, c]);
        }
      }
      console.log('150 asientos creados correctamente.');

      // Vincular asientos a funciones existentes de forma masiva
      console.log('Vinculando asientos a funciones existentes...');
      await client.query(`
        INSERT INTO funcion_asiento (funcion_id, asiento_id)
        SELECT f.id, a.id 
        FROM funciones f, asientos a
        ON CONFLICT DO NOTHING
      `);
    } else {
      // Si el conteo es 150, asegurar que todas las funciones tengan sus asientos
      await client.query(`
        INSERT INTO funcion_asiento (funcion_id, asiento_id)
        SELECT f.id, a.id 
        FROM funciones f, asientos a
        ON CONFLICT DO NOTHING
      `);
    }
    console.log('Tablas sincronizadas correctamente.');
  } catch (syncErr) {
    console.error('Error sincronizando tablas:', syncErr.message);
  } finally {
    release();
  }
});

export const db = pool;
