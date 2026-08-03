import mysql from 'mysql2/promise';
import { config } from './config';

const dbPool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

dbPool.getConnection()
  .then(conn => {
    console.log(`[DB] Connected to ${config.db.database}`);
    conn.release();
  })
  .catch(err => {
    console.error('[DB] Connection failed:', err.message);
  });

export default dbPool;
