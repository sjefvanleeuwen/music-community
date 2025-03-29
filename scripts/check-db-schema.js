const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function checkSchema() {
  console.log('Checking database schema...');
  
  const dbPath = path.resolve(process.cwd(), 'data', 'music_community.db');
  console.log(`Database path: ${dbPath}`);
  
  try {
    // Open database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Get list of tables
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `);
    
    console.log(`\nDatabase contains ${tables.length} tables:`);
    console.log(tables.map(t => t.name).join(', '));
    
    // Get schema for each table
    for (const table of tables) {
      const schema = await db.all(`PRAGMA table_info(${table.name})`);
      
      console.log(`\n=== Schema for table '${table.name}' ===`);
      schema.forEach(column => {
        console.log(`- ${column.name} (${column.type})${column.notnull ? ' NOT NULL' : ''}${column.pk ? ' PRIMARY KEY' : ''}`);
      });
    }
    
    await db.close();
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema().catch(console.error);
