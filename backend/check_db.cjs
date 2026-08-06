const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function check() {
  const host = process.env.ECATALOG_BESTARI_DB_HOST || 'localhost';
  const port = parseInt(process.env.ECATALOG_BESTARI_DB_PORT || '3306');
  const user = process.env.ECATALOG_BESTARI_DB_USER || 'root';
  const password = process.env.ECATALOG_BESTARI_DB_PASSWORD || '';
  const database = process.env.ECATALOG_BESTARI_DB_NAME || 'ecatalog_bestari_db';

  try {
    const conn = await mysql.createConnection({ host, port, user, password, database });
    const [tables] = await conn.query('SHOW TABLES');
    console.log('Tables in database:', tables);

    if (tables.some(t => Object.values(t)[0] === 'products')) {
      const [products] = await conn.query('SELECT id, name, slug, is_active FROM products');
      console.log('Products count:', products.length);
      console.log('Products:', products);
    } else {
      console.log('Table "products" does not exist!');
    }
    await conn.end();
  } catch (err) {
    console.error('Error checking DB:', err.message);
  }
}

check();
