/**
 * export_nhost.mjs
 * Exporta el schema + datos de la BD de Nhost a un archivo SQL
 * compatible con Supabase (PostgreSQL estándar).
 *
 * Uso: node export_nhost.mjs
 * Salida: nhost_export.sql
 */

import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Si el script está en la raíz, busca .env en backend/
// Si está en backend/, lo busca directamente
const envPath = fs.existsSync(path.join(__dirname, '.env'))
  ? path.join(__dirname, '.env')
  : path.join(__dirname, 'backend', '.env');
dotenv.config({ path: envPath });
const ENTITIES_SQL = fs.existsSync(path.join(__dirname, 'entitys.sql'))
  ? path.join(__dirname, 'entitys.sql')
  : path.join(__dirname, '..', 'entitys.sql');

const DB_URL = process.env.NHOST_DB_URL;
if (!DB_URL) {
  console.error('❌ No se encontró NHOST_DB_URL en backend/.env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false }
});

const OUTPUT_FILE = path.join(__dirname, 'nhost_export.sql');

// Orden de tablas respetando FK
const TABLE_ORDER = [
  'usuarios',
  'peliculas',
  'categorias',
  'salas',
  'funciones',
  'asientos',
  'funcion_asiento',
  'tiquetes',
  'detalle_tiquete'
];

function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (Array.isArray(val)) {
    // TEXT[] array de PostgreSQL
    const escaped = val.map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(',');
    return `'{${escaped}}'`;
  }
  // String: escapar comillas simples
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function exportTable(client, tableName, writer) {
  let rows;
  try {
    const res = await client.query(`SELECT * FROM ${tableName}`);
    rows = res.rows;
  } catch (err) {
    console.warn(`⚠️  Tabla '${tableName}' no existe o error: ${err.message}`);
    return 0;
  }

  if (rows.length === 0) {
    writer.write(`-- Tabla '${tableName}': sin datos\n\n`);
    return 0;
  }

  const columns = Object.keys(rows[0]);
  writer.write(`-- Datos de la tabla: ${tableName} (${rows.length} filas)\n`);
  writer.write(`-- Desactivar triggers temporalmente para importación masiva\n`);
  writer.write(`ALTER TABLE ${tableName} DISABLE TRIGGER ALL;\n\n`);

  for (const row of rows) {
    const values = columns.map(col => escapeValue(row[col])).join(', ');
    writer.write(
      `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`
    );
  }

  writer.write(`\nALTER TABLE ${tableName} ENABLE TRIGGER ALL;\n\n`);
  return rows.length;
}

async function getSequences(client) {
  const res = await client.query(`
    SELECT 
      s.schemaname,
      s.sequencename,
      s.last_value,
      t.table_name,
      c.column_name
    FROM pg_sequences s
    JOIN information_schema.columns c 
      ON c.column_default LIKE '%' || s.sequencename || '%'
    JOIN information_schema.tables t 
      ON t.table_name = c.table_name
    WHERE s.schemaname = 'public'
    ORDER BY s.sequencename
  `);
  return res.rows;
}

async function main() {
  const client = await pool.connect();
  const writer = fs.createWriteStream(OUTPUT_FILE, { encoding: 'utf8' });

  console.log('🔌 Conectado a Nhost. Iniciando exportación...\n');

  // Cabecera del archivo SQL
  writer.write(`-- ============================================================\n`);
  writer.write(`-- EXPORTACIÓN DE BASE DE DATOS NHOST → SUPABASE\n`);
  writer.write(`-- Generado: ${new Date().toISOString()}\n`);
  writer.write(`-- Proyecto: THE-END (Cinema)\n`);
  writer.write(`-- ============================================================\n\n`);

  writer.write(`-- Deshabilitar verificación de FK durante la importación\n`);
  writer.write(`SET session_replication_role = 'replica';\n\n`);

  // Exportar schema (crear tablas)
  writer.write(`-- ============================================================\n`);
  writer.write(`-- SCHEMA (Tablas)\n`);
  writer.write(`-- ============================================================\n\n`);

  const schemaSQL = fs.readFileSync(ENTITIES_SQL, 'utf8');
  writer.write(schemaSQL);
  writer.write('\n\n');

  // Tablas adicionales creadas en db.js (salas, categorias)
  writer.write(`CREATE TABLE IF NOT EXISTS salas (\n`);
  writer.write(`  id SERIAL PRIMARY KEY,\n`);
  writer.write(`  nombre VARCHAR(50) UNIQUE NOT NULL,\n`);
  writer.write(`  precio_base NUMERIC(10,2) NOT NULL DEFAULT 0\n`);
  writer.write(`);\n\n`);

  writer.write(`CREATE TABLE IF NOT EXISTS categorias (\n`);
  writer.write(`  id SERIAL PRIMARY KEY,\n`);
  writer.write(`  nombre VARCHAR(50) UNIQUE NOT NULL\n`);
  writer.write(`);\n\n`);

  // Columnas extra que agrega db.js (migraciones)
  writer.write(`-- Columnas adicionales (migraciones automáticas)\n`);
  writer.write(`ALTER TABLE funcion_asiento ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMP;\n`);
  writer.write(`ALTER TABLE tiquetes ADD COLUMN IF NOT EXISTS es_taquilla BOOLEAN DEFAULT FALSE;\n`);
  writer.write(`ALTER TABLE tiquetes ADD COLUMN IF NOT EXISTS fecha_uso TIMESTAMP;\n`);
  writer.write(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS apellidos VARCHAR(100);\n`);
  writer.write(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS username VARCHAR(150);\n\n`);

  // Migrar columna genero a TEXT[] si hace falta
  writer.write(`-- Migrar genero a TEXT[] si es necesario\n`);
  writer.write(`DO $$ BEGIN\n`);
  writer.write(`  IF EXISTS (\n`);
  writer.write(`    SELECT 1 FROM information_schema.columns\n`);
  writer.write(`    WHERE table_name = 'peliculas' AND column_name = 'genero' AND data_type != 'ARRAY'\n`);
  writer.write(`  ) THEN\n`);
  writer.write(`    UPDATE peliculas SET genero = '' WHERE genero IS NULL;\n`);
  writer.write(`    ALTER TABLE peliculas ALTER COLUMN genero TYPE TEXT[] USING string_to_array(genero, ',')::TEXT[];\n`);
  writer.write(`  END IF;\n`);
  writer.write(`END $$;\n\n`);

  // Exportar datos por tabla
  writer.write(`-- ============================================================\n`);
  writer.write(`-- DATOS\n`);
  writer.write(`-- ============================================================\n\n`);

  let totalRows = 0;
  for (const table of TABLE_ORDER) {
    const count = await exportTable(client, table, writer);
    if (count > 0) {
      console.log(`  ✅ ${table}: ${count} filas exportadas`);
      totalRows += count;
    } else {
      console.log(`  ⚪ ${table}: vacía o no existe`);
    }
  }

  // Resetear sequences para que los IDs de Supabase sean correctos
  writer.write(`-- ============================================================\n`);
  writer.write(`-- RESETEAR SEQUENCES (Para que los AUTO INCREMENT continúen correctamente)\n`);
  writer.write(`-- ============================================================\n\n`);

  for (const table of TABLE_ORDER) {
    try {
      const res = await client.query(`SELECT MAX(id) as max_id FROM ${table}`);
      const maxId = res.rows[0]?.max_id;
      if (maxId !== null && maxId !== undefined) {
        writer.write(`SELECT setval('${table}_id_seq', ${maxId}, true);\n`);
      }
    } catch (e) {
      // tabla sin columna id o vacía — ignorar
    }
  }

  // Reactivar FK
  writer.write(`\n-- Reactivar verificación de FK\n`);
  writer.write(`SET session_replication_role = 'origin';\n\n`);

  writer.write(`-- ============================================================\n`);
  writer.write(`-- FIN DE EXPORTACIÓN\n`);
  writer.write(`-- ============================================================\n`);

  writer.end();
  client.release();
  await pool.end();

  console.log(`\n✅ Exportación completa!`);
  console.log(`📄 Archivo generado: nhost_export.sql`);
  console.log(`📊 Total de filas exportadas: ${totalRows}`);
  console.log(`\nSiguiente paso: Importar nhost_export.sql en Supabase SQL Editor`);
}

main().catch(err => {
  console.error('❌ Error durante la exportación:', err.message);
  process.exit(1);
});
