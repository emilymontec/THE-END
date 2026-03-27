-- Script para solucionar problemas de asientos
-- Ejecutar este script en tu base de datos PostgreSQL

-- 1. Verificar si existen asientos
SELECT COUNT(*) as total_asientos FROM asientos;

-- 2. Si no hay asientos, insertar los 150 asientos base (15 filas × 10 columnas)
INSERT INTO asientos (numero, fila, columna)
SELECT 
    (fila_index * 10 + columna) as numero,
    CHR(65 + fila_index) as fila,
    columna
FROM 
    generate_series(0, 14) as fila_index,
    generate_series(1, 10) as columna
WHERE NOT EXISTS (SELECT 1 FROM asientos);

-- 3. Verificar asientos creados
SELECT fila, COUNT(*) as asientos_por_fila 
FROM asientos 
GROUP BY fila 
ORDER BY fila;

-- 4. Verificar funciones existentes
SELECT id, pelicula_id, fecha, hora, sala FROM funciones;

-- 5. Para cada función existente, asegurar que tenga sus asientos asociados
-- (Este paso es importante si ya tienes funciones creadas sin asientos)
INSERT INTO funcion_asiento (funcion_id, asiento_id)
SELECT f.id as funcion_id, a.id as asiento_id
FROM funciones f
CROSS JOIN asientos a
WHERE NOT EXISTS (
    SELECT 1 FROM funcion_asiento fa 
    WHERE fa.funcion_id = f.id AND fa.asiento_id = a.id
);

-- 6. Verificar cuántos asientos tiene cada función
SELECT 
    f.id as funcion_id,
    f.fecha,
    f.hora,
    f.sala,
    COUNT(fa.id) as total_asientos,
    COUNT(CASE WHEN fa.ocupado = false THEN 1 END) as asientos_disponibles,
    COUNT(CASE WHEN fa.ocupado = true THEN 1 END) as asientos_ocupados
FROM funciones f
LEFT JOIN funcion_asiento fa ON f.id = fa.funcion_id
GROUP BY f.id, f.fecha, f.hora, f.sala
ORDER BY f.fecha, f.hora;

-- 7. Verificar asientos de una función específica (reemplaza X con el ID de tu función)
-- SELECT 
--     a.fila,
--     a.columna,
--     fa.ocupado,
--     fa.bloqueado_hasta,
--     CASE 
--         WHEN fa.ocupado THEN 'vendido' 
--         WHEN fa.bloqueado_hasta > CURRENT_TIMESTAMP THEN 'bloqueado'
--         ELSE 'disponible' 
--     END as estado
-- FROM funcion_asiento fa
-- JOIN asientos a ON fa.asiento_id = a.id
-- WHERE fa.funcion_id = X
-- ORDER BY a.fila ASC, a.columna ASC;

-- 8. Resetear asientos ocupados si es necesario (¡CUIDADO! Esto liberará todos los asientos)
-- UPDATE funcion_asiento SET ocupado = false, bloqueado_hasta = NULL;

-- 9. Eliminar bloqueos temporales expirados
UPDATE funcion_asiento 
SET bloqueado_hasta = NULL 
WHERE bloqueado_hasta < CURRENT_TIMESTAMP;

-- 10. Verificar integridad de datos
SELECT 
    'Total asientos' as descripcion,
    COUNT(*) as cantidad
FROM asientos
UNION ALL
SELECT 
    'Total funciones' as descripcion,
    COUNT(*) as cantidad
FROM funciones
UNION ALL
SELECT 
    'Total funcion_asiento' as descripcion,
    COUNT(*) as cantidad
FROM funcion_asiento
UNION ALL
SELECT 
    'Asientos disponibles' as descripcion,
    COUNT(*) as cantidad
FROM funcion_asiento
WHERE ocupado = false AND (bloqueado_hasta IS NULL OR bloqueado_hasta < CURRENT_TIMESTAMP);
