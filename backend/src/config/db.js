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
    const sqlPath = path.join(__dirname, '../../../entitys.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await client.query(sql);
      console.log('Tablas sincronizadas con Nhost (entitys.sql)');
      
      // Opcional: Insertar asientos base si no hay
      const seatCount = await client.query('SELECT COUNT(*) FROM asientos');
      if (parseInt(seatCount.rows[0].count) === 0) {
        console.log('Insertando asientos base...');
        const filas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        for (let f of filas) {
          for (let c = 1; c <= 15; c++) {
            await client.query('INSERT INTO asientos(numero, fila, columna) VALUES($1, $2, $3)', [(filas.indexOf(f) * 15) + c, f, c]);
          }
        }
        console.log('150 asientos creados.');
      }
    }
  } catch (syncErr) {
    console.error('Error sincronizando tablas:', syncErr.message);
  } finally {
    release();
  }
});

export const db = pool;
