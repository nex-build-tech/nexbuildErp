import * as mysql from 'mysql2/promise';

async function checkAllTables() {
  const connectionUrl = process.env['DATABASE_URL'] || 'mysql://root:@localhost:3307/builderp';
  const pool = mysql.createPool({ uri: connectionUrl });

  const [tablesResult] = await pool.execute('SHOW TABLES');
  const tableNames = (tablesResult as any[]).map((r) => Object.values(r)[0] as string).sort();

  console.log(`=== FOUND ${tableNames.length} TABLES IN DATABASE ===`);
  for (const t of tableNames) {
    try {
      const [res] = await pool.execute(`SELECT COUNT(*) as cnt FROM \`${t}\``);
      const count = (res as any)[0].cnt;
      console.log(`${t.padEnd(32)} : ${count}`);
    } catch (e: any) {
      console.log(`${t.padEnd(32)} : ERROR (${e.message})`);
    }
  }
  await pool.end();
  process.exit(0);
}

checkAllTables();
