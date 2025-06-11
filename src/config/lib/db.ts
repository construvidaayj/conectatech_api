//src/config/lib/db.ts
import dotenv from "dotenv";
import mysql, { Pool, PoolOptions } from 'mysql2/promise';

dotenv.config();

console.log('🧪 NODE_ENV:', process.env.NODE_ENV);
declare global {
    var mysqlPool: Pool | undefined;
}

const poolOptions: PoolOptions = {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

const pool = global.mysqlPool ?? mysql.createPool(poolOptions);

// --- BLOQUE DE PRUEBA DE CONEXIÓN---
async function testDbConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('¡Conexión a la base de datos MySQL exitosa!');
        connection.release();
    } catch (error) {
        console.error('ERROR CRÍTICO: No se pudo conectar a la base de datos MySQL.');
        console.error('Verifica tus variables de entorno (.env) y los permisos de IP en el hosting.');
        console.error('Detalles del error:', error);
    }
}


if (process.env.NODE_ENV !== 'production' && !global.mysqlPool) {
    testDbConnection();
}

if (process.env.NODE_ENV !== 'production') global.mysqlPool = pool;

export { pool };