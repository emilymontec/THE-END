// Script de diagnóstico para verificar el problema de asientos
// Ejecutar con: node debug_asientos.js

const API_URL = 'http://localhost:4000';

async function diagnosticarAsientos() {
  console.log('🔍 DIAGNÓSTICO DE ASIENTOS - THE-END CINEMA\n');
  console.log('='.repeat(60));

  // 1. Verificar que el backend esté corriendo
  console.log('\n1️⃣ Verificando conexión al backend...');
  try {
    const response = await fetch(`${API_URL}/`);
    const data = await response.json();
    console.log('✅ Backend conectado:', data);
  } catch (error) {
    console.log('❌ Backend no disponible:', error.message);
    console.log('   Solución: Ejecuta "cd backend && npm run dev"');
    return;
  }

  // 2. Obtener lista de funciones
  console.log('\n2️⃣ Obteniendo funciones disponibles...');
  try {
    const response = await fetch(`${API_URL}/showtimes`);
    const funciones = await response.json();
    console.log(`✅ Se encontraron ${funciones.length} funciones`);
    
    if (funciones.length === 0) {
      console.log('⚠️  No hay funciones en la base de datos');
      console.log('   Solución: Crea una función desde el panel de administración');
      return;
    }

    // Mostrar primera función
    const primeraFuncion = funciones[0];
    console.log('\n📋 Primera función encontrada:');
    console.log(`   ID: ${primeraFuncion.id}`);
    console.log(`   Película: ${primeraFuncion.titulo}`);
    console.log(`   Fecha: ${primeraFuncion.fecha}`);
    console.log(`   Hora: ${primeraFuncion.hora}`);
    console.log(`   Sala: ${primeraFuncion.sala}`);

    // 3. Obtener asientos de la primera función
    console.log(`\n3️⃣ Obteniendo asientos de la función ID ${primeraFuncion.id}...`);
    const seatsResponse = await fetch(`${API_URL}/showtimes/${primeraFuncion.id}/seats`);
    const asientos = await seatsResponse.json();
    
    console.log(`✅ Se encontraron ${asientos.length} asientos`);
    
    if (asientos.length === 0) {
      console.log('❌ PROBLEMA ENCONTRADO: No hay asientos para esta función');
      console.log('\n💡 Solución:');
      console.log('   1. Ejecuta el script fix_asientos.sql en tu base de datos');
      console.log('   2. O reinicia el backend para que cree los asientos automáticamente');
      return;
    }

    // 4. Verificar estructura de datos
    console.log('\n4️⃣ Verificando estructura de datos...');
    const primerAsiento = asientos[0];
    console.log('📋 Primer asiento:');
    console.log(JSON.stringify(primerAsiento, null, 2));

    // Verificar campos requeridos
    const camposRequeridos = ['mapping_id', 'fila', 'columna', 'asiento_id', 'estado'];
    const camposFaltantes = camposRequeridos.filter(campo => !(campo in primerAsiento));
    
    if (camposFaltantes.length > 0) {
      console.log(`\n❌ PROBLEMA: Faltan campos en la respuesta: ${camposFaltantes.join(', ')}`);
      return;
    }

    console.log('✅ Todos los campos requeridos están presentes');

    // 5. Verificar estados de asientos
    console.log('\n5️⃣ Verificando estados de asientos...');
    const estados = {};
    asientos.forEach(asiento => {
      estados[asiento.estado] = (estados[asiento.estado] || 0) + 1;
    });
    console.log('📊 Distribución de estados:');
    Object.entries(estados).forEach(([estado, cantidad]) => {
      console.log(`   ${estado}: ${cantidad} asientos`);
    });

    // 6. Verificar filas y columnas
    console.log('\n6️⃣ Verificando filas y columnas...');
    const filas = [...new Set(asientos.map(a => a.fila))].sort();
    console.log(`✅ Filas encontradas: ${filas.join(', ')}`);
    console.log(`✅ Asientos por fila: ${asientos.length / filas.length}`);

    // 7. Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DEL DIAGNÓSTICO');
    console.log('='.repeat(60));
    console.log(`✅ Backend: Conectado`);
    console.log(`✅ Funciones: ${funciones.length} encontradas`);
    console.log(`✅ Asientos: ${asientos.length} encontrados`);
    console.log(`✅ Estructura: Correcta`);
    console.log(`✅ Estados: ${Object.keys(estados).length} tipos`);
    console.log('\n✅ TODO ESTÁ CORRECTO - Los asientos deberían mostrarse');
    console.log('\n💡 Si aún no se muestran, verifica:');
    console.log('   1. La consola del navegador (F12) por errores de JavaScript');
    console.log('   2. La pestaña Network del navegador por errores de red');
    console.log('   3. Que VITE_API_URL esté configurado correctamente en frontend/.env');

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Ejecutar diagnóstico
diagnosticarAsientos().catch(console.error);
