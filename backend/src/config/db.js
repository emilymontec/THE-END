import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuración de la conexión a PostgreSQL (Nhost)
const pool = new Pool({
  connectionString: process.env.NHOST_DB_URL,
  ssl: {
    rejectUnauthorized: false // Requerido para conexiones seguras a Nhost
  }
});

// Probar conexión y sincronizar tablas
pool.connect(async (err, client, release) => {
  if (err) {
    return console.error('Error adquiriendo cliente:', err.stack);
  }
  console.log('Conectado a la base de datos de Nhost (PostgreSQL)');
  
  // Sincronizar tablas automáticamente al iniciar
  try {
    /*
    // const sqlPath = path.join(__dirname, '../../../entitys.sql');
    // if (fs.existsSync(sqlPath)) {
    //   const sql = fs.readFileSync(sqlPath, 'utf8');
    //   await client.query(sql);
      
      // Añadir columna para bloqueo temporal si no existe
      await client.query(`
        ALTER TABLE funcion_asiento 
        ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMP;
      `);

      // Asegurar que la columna rol acepte 'operario' ANTES de insertar usuarios base
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
      // const userCount = await client.query('SELECT COUNT(*) FROM usuarios');
      // if (parseInt(userCount.rows[0].count) === 0) {
      //   console.log('Insertando usuarios base...');
      //   // Usar credenciales del administrador desde .env o valores por defecto
      //   const adminUser = process.env.ADMIN_USERNAME;
      //   const adminPass = process.env.ADMIN_PASSWORD;
        
      //   await client.query(
      //     "INSERT INTO usuarios(nombre, email, password, rol) VALUES($1, $2, $3, $4)",
      //     ['Administrador', adminUser, adminPass, 'admin']
      //   );
      //   await client.query(
      //     "INSERT INTO usuarios(nombre, email, password, rol) VALUES($1, $2, $3, $4)",
      //     ['Taquilla 1', 'staff@cinema.com', 'staff123', 'operario']
      //   );
      //   console.log(`Usuario base '${adminUser}' creado.`);
      // }

      // Añadir columna para origen de venta si no existe
      await client.query(`
        ALTER TABLE tiquetes 
        ADD COLUMN IF NOT EXISTS es_taquilla BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS fecha_uso TIMESTAMP;
      `);
      
      console.log('Tablas sincronizadas');

    */
    // Asegurar que haya asientos (son necesarios para el funcionamiento)
    const seatCount = await client.query('SELECT COUNT(*) FROM asientos');
    if (parseInt(seatCount.rows[0].count) === 0) {
      console.log('Insertando 150 asientos base...');
      const filas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
      for (let f of filas) {
        for (let c = 1; c <= 10; c++) {
          await client.query('INSERT INTO asientos(numero, fila, columna) VALUES($1, $2, $3)', [(filas.indexOf(f) * 10) + c, f, c]);
        }
      }
      console.log('150 asientos creados (15x10).');
    }
  } catch (syncErr) {
    console.error('Error sincronizando tablas:', syncErr.message);
  } finally {
    release();
  }
});

export const db = pool;
