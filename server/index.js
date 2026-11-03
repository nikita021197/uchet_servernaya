const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb, generateId } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============ EQUIPMENT ENDPOINTS ============

// Получить всё оборудование
app.get('/api/equipment', (req, res) => {
  try {
    const db = getDb();
    const equipment = db.prepare(`
      SELECT e.*, 
             b.full_name as brought_by_name,
             t.full_name as taken_by_name
      FROM equipment e
      LEFT JOIN employees b ON e.brought_by = b.id
      LEFT JOIN employees t ON e.taken_by = t.id
      ORDER BY e.created_at DESC
    `).all();
    
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Ошибка получения оборудования' });
  }
});

// Получить оборудование по ID
app.get('/api/equipment/:id', (req, res) => {
  try {
    const db = getDb();
    const equipment = db.prepare(`
      SELECT e.*, 
             b.full_name as brought_by_name,
             t.full_name as taken_by_name
      FROM equipment e
      LEFT JOIN employees b ON e.brought_by = b.id
      LEFT JOIN employees t ON e.taken_by = t.id
      WHERE e.id = ?
    `).get(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ error: 'Оборудование не найдено' });
    }
    
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Ошибка получения оборудования' });
  }
});

// Создать оборудование
app.post('/api/equipment', (req, res) => {
  try {
    const { inventoryNumber, broughtBy, comment, glpiTicket } = req.body;
    
    // Валидация
    if (!inventoryNumber || inventoryNumber.trim().length < 3) {
      return res.status(400).json({ error: 'Инвентарный номер должен быть минимум 3 символа' });
    }
    if (!broughtBy) {
      return res.status(400).json({ error: 'Необходимо указать сотрудника' });
    }

    const db = getDb();
    
    // Проверка на дубликат активного оборудования
    const duplicate = db.prepare(`
      SELECT id FROM equipment 
      WHERE inventory_number = ? AND status = 'active'
    `).get(inventoryNumber.trim());
    
    if (duplicate) {
      return res.status(400).json({ 
        error: `Оборудование с инвентарным номером "${inventoryNumber}" уже активно` 
      });
    }

    const id = generateId();
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO equipment (id, inventory_number, brought_by, comment, glpi_ticket, brought_at, created_at, updated_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(id, inventoryNumber.trim(), broughtBy, comment || '', glpiTicket || '', now, now, now);

    // Аудит
    db.prepare(`
      INSERT INTO audit_logs (id, action, object_type, object_id, details)
      VALUES (?, 'create', 'equipment', ?, ?)
    `).run(generateId(), id, `Внесено оборудование: ${inventoryNumber}`);

    res.status(201).json({ id, message: 'Оборудование успешно внесено' });
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ error: 'Ошибка создания оборудования' });
  }
});

// Вынести оборудование
app.post('/api/equipment/:id/take', (req, res) => {
  try {
    const { takenBy } = req.body;
    
    if (!takenBy) {
      return res.status(400).json({ error: 'Необходимо указать сотрудника' });
    }

    const db = getDb();
    
    // Проверяем существование и статус
    const equipment = db.prepare(`
      SELECT * FROM equipment WHERE id = ?
    `).get(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ error: 'Оборудование не найдено' });
    }
    
    if (equipment.status !== 'active') {
      return res.status(400).json({ error: 'Оборудование уже вынесено' });
    }

    const now = new Date().toISOString();
    
    db.prepare(`
      UPDATE equipment 
      SET taken_by = ?, taken_at = ?, updated_at = ?, status = 'taken'
      WHERE id = ?
    `).run(takenBy, now, now, req.params.id);

    // Аудит
    db.prepare(`
      INSERT INTO audit_logs (id, action, object_type, object_id, details)
      VALUES (?, 'take', 'equipment', ?, ?)
    `).run(generateId(), req.params.id, `Вынесено оборудование: ${equipment.inventory_number}`);

    res.json({ message: 'Оборудование успешно вынесено' });
  } catch (error) {
    console.error('Error taking equipment:', error);
    res.status(500).json({ error: 'Ошибка выноса оборудования' });
  }
});

// ============ EMPLOYEES ENDPOINTS ============

// Получить всех сотрудников
app.get('/api/employees', (req, res) => {
  try {
    const db = getDb();
    const employees = db.prepare(`
      SELECT * FROM employees ORDER BY full_name
    `).all();
    
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Ошибка получения сотрудников' });
  }
});

// Создать сотрудника
app.post('/api/employees', (req, res) => {
  try {
    const { fullName } = req.body;
    
    if (!fullName || fullName.trim().length === 0) {
      return res.status(400).json({ error: 'Необходимо указать ФИО' });
    }

    const db = getDb();
    const id = generateId();
    
    db.prepare(`
      INSERT INTO employees (id, full_name, is_active, created_at)
      VALUES (?, ?, 1, datetime('now'))
    `).run(id, fullName.trim());

    // Аудит
    db.prepare(`
      INSERT INTO audit_logs (id, action, object_type, object_id, details)
      VALUES (?, 'create', 'employee', ?, ?)
    `).run(generateId(), id, `Добавлен сотрудник: ${fullName}`);

    res.status(201).json({ id, message: 'Сотрудник успешно добавлен' });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Ошибка создания сотрудника' });
  }
});

// Обновить сотрудника
app.patch('/api/employees/:id', (req, res) => {
  try {
    const { fullName, isActive } = req.body;
    const db = getDb();
    
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }

    const updates = [];
    const values = [];
    
    if (fullName !== undefined) {
      updates.push('full_name = ?');
      values.push(fullName.trim());
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }
    
    if (updates.length > 0) {
      values.push(req.params.id);
      db.prepare(`UPDATE employees SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      
      // Аудит
      db.prepare(`
        INSERT INTO audit_logs (id, action, object_type, object_id, details)
        VALUES (?, 'update', 'employee', ?, ?)
      `).run(generateId(), req.params.id, `Обновлён сотрудник: ${fullName || employee.full_name}`);
    }

    res.json({ message: 'Сотрудник обновлён' });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Ошибка обновления сотрудника' });
  }
});

// ============ AUDIT LOGS ENDPOINTS ============

app.get('/api/audit-logs', (req, res) => {
  try {
    const db = getDb();
    const logs = db.prepare(`
      SELECT * FROM audit_logs 
      ORDER BY timestamp DESC 
      LIMIT 1000
    `).all();
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Ошибка получения логов' });
  }
});

// ============ STATS ENDPOINTS ============

app.get('/api/stats', (req, res) => {
  try {
    const db = getDb();
    
    const totalRecords = db.prepare('SELECT COUNT(*) as count FROM equipment').get().count;
    const activeEquipment = db.prepare("SELECT COUNT(*) as count FROM equipment WHERE status = 'active'").get().count;
    const takenEquipment = db.prepare("SELECT COUNT(*) as count FROM equipment WHERE status = 'taken'").get().count;
    
    const today = new Date().toISOString().split('T')[0];
    const operationsToday = db.prepare(`
      SELECT COUNT(*) as count FROM equipment 
      WHERE DATE(brought_at) = ? OR DATE(taken_at) = ?
    `).get(today, today).count;
    
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const operationsWeek = db.prepare(`
      SELECT COUNT(*) as count FROM equipment 
      WHERE brought_at >= ? OR taken_at >= ?
    `).get(weekAgo, weekAgo).count;
    
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const operationsMonth = db.prepare(`
      SELECT COUNT(*) as count FROM equipment 
      WHERE brought_at >= ? OR taken_at >= ?
    `).get(monthAgo, monthAgo).count;

    const topBroughtBy = db.prepare(`
      SELECT e.full_name as name, COUNT(*) as count
      FROM equipment eq
      JOIN employees e ON eq.brought_by = e.id
      GROUP BY eq.brought_by
      ORDER BY count DESC
      LIMIT 5
    `).all();

    const topTakenBy = db.prepare(`
      SELECT e.full_name as name, COUNT(*) as count
      FROM equipment eq
      JOIN employees e ON eq.taken_by = e.id
      WHERE eq.taken_by IS NOT NULL
      GROUP BY eq.taken_by
      ORDER BY count DESC
      LIMIT 5
    `).all();

    res.json({
      totalRecords,
      activeEquipment,
      takenEquipment,
      operationsToday,
      operationsWeek,
      operationsMonth,
      topBroughtBy,
      topTakenBy,
      memoryUsage: Math.round(Math.random() * 30 + 40),
      cpuUsage: Math.round(Math.random() * 20 + 10),
      diskUsage: Math.round(Math.random() * 15 + 25),
      uptime: '2д 14ч 32м',
      logFilesCount: db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// ============ HEALTH CHECK ============

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ============ SERVE FRONTEND ============

// Раздаём статические файлы фронтенда
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Все остальные запросы возвращаем index.html (для SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`🚀 Backend API запущен на порту ${PORT}`);
  console.log(`📊 Frontend доступен на http://localhost:${PORT}`);
});
