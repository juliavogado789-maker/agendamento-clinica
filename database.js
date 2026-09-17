
const Database = require("better-sqlite3");

// Cria ou abre o banco de dados
const db = new Database("agendamento.db");

// Cria a tabela de agendamentos
db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(date, time)
  )
`);

module.exports = db;