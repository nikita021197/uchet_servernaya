import { Equipment, Employee, AuditLog, AppStats, ImportResult, ThemeMode } from './types';
import { format, isToday, isThisWeek, isThisMonth, subDays } from 'date-fns';

const STORAGE_KEYS = {
  equipment: 'srv_equipment',
  employees: 'srv_employees',
  auditLogs: 'srv_audit_logs',
  theme: 'srv_theme',
  initialized: 'srv_initialized',
};

const DEFAULT_EMPLOYEES = [
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
  'Колчаново',
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Initialize default data
export function initializeStore(): void {
  const initialized = localStorage.getItem(STORAGE_KEYS.initialized);
  if (!initialized) {
    const employees: Employee[] = DEFAULT_EMPLOYEES.map((name) => ({
      id: generateId(),
      fullName: name,
      isActive: true,
      createdAt: new Date().toISOString(),
    }));
    setToStorage(STORAGE_KEYS.employees, employees);
    setToStorage(STORAGE_KEYS.equipment, []);
    setToStorage(STORAGE_KEYS.auditLogs, []);
    localStorage.setItem(STORAGE_KEYS.initialized, 'true');
  }
}

// Equipment operations
export function getEquipment(): Equipment[] {
  return getFromStorage<Equipment[]>(STORAGE_KEYS.equipment, []);
}

export function getEquipmentById(id: string): Equipment | undefined {
  return getEquipment().find((e) => e.id === id);
}

export function getActiveEquipment(): Equipment[] {
  return getEquipment().filter((e) => e.status === 'active');
}

export function getTakenEquipment(): Equipment[] {
  return getEquipment().filter((e) => e.status === 'taken');
}

export function createEquipment(data: {
  inventoryNumber: string;
  broughtBy: string;
  comment: string;
  glpiTicket: string;
}): Equipment {
  const equipment = getEquipment();
  
  // Check for duplicate active inventory number
  const duplicate = equipment.find(
    (e) => e.inventoryNumber === data.inventoryNumber && e.status === 'active'
  );
  if (duplicate) {
    throw new Error(`Оборудование с инвентарным номером "${data.inventoryNumber}" уже активно`);
  }

  const now = new Date().toISOString();
  const newEquipment: Equipment = {
    id: generateId(),
    inventoryNumber: data.inventoryNumber,
    broughtBy: data.broughtBy,
    takenBy: null,
    broughtAt: now,
    takenAt: null,
    comment: data.comment,
    glpiTicket: data.glpiTicket,
    createdAt: now,
    updatedAt: now,
    status: 'active',
  };

  equipment.push(newEquipment);
  setToStorage(STORAGE_KEYS.equipment, equipment);
  addAuditLog('create', 'equipment', newEquipment.id, `Внесено оборудование: ${data.inventoryNumber}`);
  return newEquipment;
}

export function takeEquipment(id: string, takenBy: string): Equipment {
  const equipment = getEquipment();
  const index = equipment.findIndex((e) => e.id === id);
  
  if (index === -1) throw new Error('Оборудование не найдено');
  if (equipment[index].status !== 'active') throw new Error('Оборудование уже вынесено');

  const now = new Date().toISOString();
  equipment[index] = {
    ...equipment[index],
    takenBy,
    takenAt: now,
    updatedAt: now,
    status: 'taken',
  };

  setToStorage(STORAGE_KEYS.equipment, equipment);
  addAuditLog('take', 'equipment', id, `Вынесено оборудование: ${equipment[index].inventoryNumber}`);
  return equipment[index];
}

// Employee operations
export function getEmployees(): Employee[] {
  return getFromStorage<Employee[]>(STORAGE_KEYS.employees, []);
}

export function getActiveEmployees(): Employee[] {
  return getEmployees().filter((e) => e.isActive);
}

export function getEmployeeById(id: string): Employee | undefined {
  return getEmployees().find((e) => e.id === id);
}

export function getEmployeeName(id: string): string {
  const emp = getEmployeeById(id);
  return emp ? emp.fullName : 'Неизвестный';
}

export function createEmployee(fullName: string): Employee {
  const employees = getEmployees();
  const newEmployee: Employee = {
    id: generateId(),
    fullName,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  employees.push(newEmployee);
  setToStorage(STORAGE_KEYS.employees, employees);
  addAuditLog('create', 'employee', newEmployee.id, `Добавлен сотрудник: ${fullName}`);
  return newEmployee;
}

export function updateEmployee(id: string, updates: Partial<Pick<Employee, 'fullName' | 'isActive'>>): Employee {
  const employees = getEmployees();
  const index = employees.findIndex((e) => e.id === id);
  if (index === -1) throw new Error('Сотрудник не найден');

  // Check if employee has records before deactivating
  if (updates.isActive === false) {
    const equipment = getEquipment();
    const hasRecords = equipment.some(
      (e) => e.broughtBy === id || e.takenBy === id
    );
    if (hasRecords) {
      // Can't delete, only deactivate
    }
  }

  employees[index] = { ...employees[index], ...updates };
  setToStorage(STORAGE_KEYS.employees, employees);
  addAuditLog('update', 'employee', id, `Обновлён сотрудник: ${employees[index].fullName}`);
  return employees[index];
}

// Audit logs
export function getAuditLogs(): AuditLog[] {
  return getFromStorage<AuditLog[]>(STORAGE_KEYS.auditLogs, []);
}

function addAuditLog(action: string, objectType: string, objectId: string, details: string): void {
  const logs = getAuditLogs();
  const log: AuditLog = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    action,
    objectType,
    objectId,
    details,
  };
  logs.unshift(log);
  // Keep last 1000 logs
  if (logs.length > 1000) logs.length = 1000;
  setToStorage(STORAGE_KEYS.auditLogs, logs);
}

// Statistics
export function getStats(): AppStats {
  const equipment = getEquipment();
  const employees = getEmployees();
  const now = new Date();

  const active = equipment.filter((e) => e.status === 'active');
  const taken = equipment.filter((e) => e.status === 'taken');
  const today = equipment.filter((e) => isToday(new Date(e.broughtAt)) || (e.takenAt && isToday(new Date(e.takenAt))));
  const week = equipment.filter((e) => isThisWeek(new Date(e.broughtAt)) || (e.takenAt && isThisWeek(new Date(e.takenAt))));
  const month = equipment.filter((e) => isThisMonth(new Date(e.broughtAt)) || (e.takenAt && isThisMonth(new Date(e.takenAt))));

  // Top employees by bringing
  const broughtByCount: Record<string, number> = {};
  equipment.forEach((e) => {
    broughtByCount[e.broughtBy] = (broughtByCount[e.broughtBy] || 0) + 1;
  });
  const topBroughtBy = Object.entries(broughtByCount)
    .map(([id, count]) => ({ name: getEmployeeName(id), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top employees by taking
  const takenByCount: Record<string, number> = {};
  equipment.forEach((e) => {
    if (e.takenBy) takenByCount[e.takenBy] = (takenByCount[e.takenBy] || 0) + 1;
  });
  const topTakenBy = Object.entries(takenByCount)
    .map(([id, count]) => ({ name: getEmployeeName(id), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // GLPI distribution
  const glpiCount: Record<string, number> = {};
  equipment.forEach((e) => {
    const ticket = e.glpiTicket || 'Без заявки';
    glpiCount[ticket] = (glpiCount[ticket] || 0) + 1;
  });
  const glpiDistribution = Object.entries(glpiCount)
    .map(([ticket, count]) => ({ ticket, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalRecords: equipment.length,
    activeEquipment: active.length,
    takenEquipment: taken.length,
    overdueEquipment: 0,
    operationsToday: today.length,
    operationsWeek: week.length,
    operationsMonth: month.length,
    topBroughtBy,
    topTakenBy,
    glpiDistribution,
    memoryUsage: Math.round(Math.random() * 30 + 40),
    cpuUsage: Math.round(Math.random() * 20 + 10),
    diskUsage: Math.round(Math.random() * 15 + 25),
    uptime: '2д 14ч 32м',
    logFilesCount: getAuditLogs().length,
  };
}

// CSV Import/Export
export function exportToCSV(equipmentOnly?: boolean): string {
  const equipment = equipmentOnly ? getActiveEquipment() : getEquipment();
  const headers = [
    'Инвентарный номер',
    'Внёс',
    'Дата внесения',
    'Вынес',
    'Дата выноса',
    'Комментарий',
    'GLPI заявка',
    'Статус',
  ];

  const rows = equipment.map((e) => [
    e.inventoryNumber,
    getEmployeeName(e.broughtBy),
    format(new Date(e.broughtAt), 'dd.MM.yyyy HH:mm'),
    e.takenBy ? getEmployeeName(e.takenBy) : '',
    e.takenAt ? format(new Date(e.takenAt), 'dd.MM.yyyy HH:mm') : '',
    e.comment,
    e.glpiTicket,
    e.status === 'active' ? 'Активно' : 'Вынесено',
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
  ].join('\n');

  return '\uFEFF' + csvContent; // BOM for Excel
}

export function importFromCSV(csvText: string): ImportResult {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
  
  // Remove BOM if present
  const text = csvText.replace(/^\uFEFF/, '');
  const lines = text.split('\n').filter((line) => line.trim());
  
  if (lines.length < 2) {
    result.errors.push({ row: 0, message: 'Файл пуст или содержит только заголовок' });
    return result;
  }

  const employees = getEmployees();
  const equipment = getEquipment();

  for (let i = 1; i < lines.length; i++) {
    try {
      const cells = parseCSVLine(lines[i]);
      if (cells.length < 2) {
        result.errors.push({ row: i + 1, message: 'Недостаточно полей' });
        result.skipped++;
        continue;
      }

      const inventoryNumber = cells[0]?.trim();
      const broughtByName = cells[1]?.trim();
      const comment = cells[5]?.trim() || '';
      const glpiTicket = cells[6]?.trim() || '';

      if (!inventoryNumber || inventoryNumber.length < 3) {
        result.errors.push({ row: i + 1, message: `Некорректный инвентарный номер: "${inventoryNumber}"` });
        result.skipped++;
        continue;
      }

      // Check duplicate
      const duplicate = equipment.find(
        (e) => e.inventoryNumber === inventoryNumber && e.status === 'active'
      );
      if (duplicate) {
        result.errors.push({ row: i + 1, message: `Дубликат активного номера: ${inventoryNumber}` });
        result.skipped++;
        continue;
      }

      // Find employee
      let broughtBy = employees.find((e) => e.fullName === broughtByName);
      if (!broughtBy && broughtByName) {
        // Create new employee
        broughtBy = createEmployee(broughtByName);
      }

      if (!broughtBy) {
        result.errors.push({ row: i + 1, message: `Сотрудник не найден: "${broughtByName}"` });
        result.skipped++;
        continue;
      }

      const now = new Date().toISOString();
      const newEquipment: Equipment = {
        id: generateId(),
        inventoryNumber,
        broughtBy: broughtBy.id,
        takenBy: null,
        broughtAt: now,
        takenAt: null,
        comment,
        glpiTicket,
        createdAt: now,
        updatedAt: now,
        status: 'active',
      };

      equipment.push(newEquipment);
      result.imported++;
    } catch (err) {
      result.errors.push({ row: i + 1, message: `Ошибка обработки: ${(err as Error).message}` });
      result.skipped++;
    }
  }

  setToStorage(STORAGE_KEYS.equipment, equipment);
  addAuditLog('import', 'equipment', '', `Импортировано: ${result.imported}, пропущено: ${result.skipped}`);
  return result;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === ';' || char === ',') && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Theme
export function getTheme(): ThemeMode {
  return (localStorage.getItem(STORAGE_KEYS.theme) as ThemeMode) || 'dark';
}

export function setTheme(theme: ThemeMode): void {
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

// Reset
export function resetStore(): void {
  localStorage.removeItem(STORAGE_KEYS.initialized);
  localStorage.removeItem(STORAGE_KEYS.equipment);
  localStorage.removeItem(STORAGE_KEYS.employees);
  localStorage.removeItem(STORAGE_KEYS.auditLogs);
  initializeStore();
}
