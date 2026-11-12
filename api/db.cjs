const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
// Na nuvem (Railway) grava no volume; no seu Mac continua na pasta api
const DB_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || __dirname;
const DB_PATH = path.join(DB_DIR, 'capacita.db');

// Primeira execução com volume: se o repositório trouxer um banco inicial, copia para o volume
const fsNode = require('fs');
const DB_INICIAL = path.join(__dirname, 'capacita.db');
if (DB_PATH !== DB_INICIAL && !fsNode.existsSync(DB_PATH) && fsNode.existsSync(DB_INICIAL)) {
  fsNode.copyFileSync(DB_INICIAL, DB_PATH);
}
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);
module.exports = db;
