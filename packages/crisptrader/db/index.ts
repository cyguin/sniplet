import 'dotenv/config';

let _db: any = null;
let _sql: any = null;

function createSql() {
  const { neon } = require('@neondatabase/serverless');
  return neon(process.env.DATABASE_URL!);
}

function createDb() {
  const { drizzle } = require('drizzle-orm/neon-http');
  const schema = require('./schema');
  return drizzle(_sql, { schema });
}

function getDb() {
  if (!_db) {
    _sql = createSql();
    _db = createDb();
  }
  return _db;
}

export { getDb };

export const db = new Proxy({} as any, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});
