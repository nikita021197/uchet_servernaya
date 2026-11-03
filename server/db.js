const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'app.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase();
  }
  return db;
}

function initializeDatabase() {
  const db = getDb();
  
  // Таблица сотрудников
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Таблица оборудования
  db.exec(`
    CREATE TABLE IF NOT EXISTS equipment (
      id TEXT PRIMARY KEY,
      inventory_number TEXT NOT NULL,
      brought_by TEXT NOT NULL,
      taken_by TEXT,
      brought_at TEXT NOT NULL DEFAULT (datetime('now')),
      taken_at TEXT,
      comment TEXT DEFAULT '',
      glpi_ticket TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'active',
      FOREIGN KEY (brought_by) REFERENCES employees(id),
      FOREIGN KEY (taken_by) REFERENCES employees(id)
    )
  `);

  // Таблица аудита
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      action TEXT NOT NULL,
      object_type TEXT NOT NULL,
      object_id TEXT NOT NULL,
      details TEXT DEFAULT ''
    )
  `);

  // Индексы
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_equipment_inventory ON equipment(inventory_number);
    CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
    CREATE INDEX IF NOT EXISTS idx_equipment_brought_at ON equipment(brought_at);
    CREATE INDEX IF NOT EXISTS idx_equipment_brought_by ON equipment(brought_by);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
  `);

  // Partial unique index для предотвращения дублирования активных записей
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_inventory 
    ON equipment(inventory_number) 
    WHERE status = 'active'
  `);

  // Засеиваем сотрудников если таблица пуста
  const count = db.prepare('SELECT COUNT(*) as count FROM employees').get();
  if (count.count === 0) {
    seedEmployees();
  }
}

function seedEmployees() {
  const db = getDb();
  const employees = [
    'Латышов Никита',
    'Простов Иван',
    'Потехин Илья',
    'Байков Денис',
    'Светлов Андрей',
    'Воробьев Андрей',
    'Вертинский Владислав',
    'Сомонов Павел',
    'Огородников Дмитрий',
    'Харлачев Артем',
    'Колчаново'
  ];

  const insert = db.prepare(`
    INSERT INTO employees (id, full_name, is_active, created_at)
    VALUES (?, ?, 1, datetime('now'))
  `);

  const insertMany = db.transaction((emps) => {
    for (const emp of emps) {
      insert.run(generateId(), emp);
    }
  });

  insertMany(employees);
  console.log('✅ Сотрудники инициализированы');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

module.exports = { getDb, generateId };
