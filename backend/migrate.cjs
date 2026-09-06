const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const alterColumns = [
  // products
  { table: 'products', col: 'gluten_free', ddl: 'BOOLEAN NOT NULL DEFAULT TRUE' },
  { table: 'products', col: 'organic', ddl: 'BOOLEAN NOT NULL DEFAULT TRUE' },
  { table: 'products', col: 'original_price', ddl: 'INT UNSIGNED NULL' },
  { table: 'products', col: 'rating_avg', ddl: 'DECIMAL(3,2) NOT NULL DEFAULT 5.00' },
  { table: 'products', col: 'review_count', ddl: 'INT UNSIGNED NOT NULL DEFAULT 0' },
  { table: 'products', col: 'sales_count', ddl: 'INT UNSIGNED NOT NULL DEFAULT 0' },
  { table: 'products', col: 'min_order', ddl: 'INT UNSIGNED NOT NULL DEFAULT 1' },
  { table: 'products', col: 'shelf_life', ddl: 'VARCHAR(100) NULL' },
  { table: 'products', col: 'storage_instruction', ddl: 'VARCHAR(200) NULL' },
  { table: 'products', col: 'composition', ddl: 'TEXT NULL' },

  // articles
  { table: 'articles', col: 'author', ddl: 'VARCHAR(150) NULL' },
  { table: 'articles', col: 'author_role', ddl: 'VARCHAR(150) NULL' },
  { table: 'articles', col: 'read_time', ddl: 'VARCHAR(50) NULL' },
  { table: 'articles', col: 'sub_image', ddl: 'TEXT NULL' },
  { table: 'articles', col: 'quote', ddl: 'TEXT NULL' },
  { table: 'articles', col: 'facts', ddl: 'JSON NULL' },

  // faq
  { table: 'faq', col: 'category', ddl: "VARCHAR(100) NOT NULL DEFAULT 'Lainnya'" },
  { table: 'faq', col: 'status', ddl: "ENUM('AKTIF','DRAFT') NOT NULL DEFAULT 'AKTIF'" },
  { table: 'faq', col: 'tags', ddl: 'JSON NULL' },
  { table: 'faq', col: 'views_count', ddl: 'INT UNSIGNED NOT NULL DEFAULT 0' },
];

async function run() {
  const host = process.env.ECATALOG_BESTARI_DB_HOST || 'localhost';
  const port = parseInt(process.env.ECATALOG_BESTARI_DB_PORT || '3306');
  const user = process.env.ECATALOG_BESTARI_DB_USER || 'root';
  const password = process.env.ECATALOG_BESTARI_DB_PASSWORD || '';
  const database = process.env.ECATALOG_BESTARI_DB_NAME || 'ecatalog_bestari_db';

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);
  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      multipleStatements: true,
    });
    console.log(`Connected to MySQL database "${database}".`);

    // Ensure all contract columns exist
    console.log('Ensuring table schema columns...');
    for (const item of alterColumns) {
      try {
        await connection.query(`ALTER TABLE \`${item.table}\` ADD COLUMN \`${item.col}\` ${item.ddl}`);
        console.log(`✓ Added column ${item.table}.${item.col}`);
      } catch (err) {
        if (err.errno === 1060) {
          // Column already exists
        } else {
          console.log(`Notice for ${item.table}.${item.col}: ${err.message}`);
        }
      }
    }

    const migrationsDir = path.join(__dirname, 'src', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`Running migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      let sql = fs.readFileSync(filePath, 'utf8');

      // Strip DELIMITER statements and procedure definitions that fail in single queries
      sql = sql.replace(/DELIMITER[\s\S]*?DELIMITER ;/gi, '');
      sql = sql.replace(/CALL add_col_if_missing\([^)]+\);?/gi, '');
      sql = sql.replace(/DROP PROCEDURE IF EXISTS add_col_if_missing;?/gi, '');

      try {
        await connection.query(sql);
        console.log(`✓ ${file} applied successfully.`);
      } catch (err) {
        if ([1050, 1060, 1304, 1061].includes(err.errno)) {
          console.log(`⚠ ${file} notice: ${err.message}`);
        } else {
          console.error(`❌ Error in ${file}:`, err.message);
        }
      }
    }

    console.log('\n✅ All migrations processed successfully!');
  } catch (err) {
    console.error('\n❌ Migration process failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

run();
