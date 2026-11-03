import { Equipment, Employee, AuditLog, AppStats, ImportResult, ThemeMode } from './types';
import { format } from 'date-fns';

const API_BASE = '/api';

// ============ API HELPERS ============

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка запроса');
  }
  
  return response.json();
}

// ============ EQUIPMENT ============

export async function getEquipment(): Promise<Equipment[]> {
  return apiRequest<Equipment[]>('/equipment');
}

export async function getEquipmentById(id: string): Promise<Equipment | undefined> {
  try {
    return await apiRequest<Equipment>(`/equipment/${id}`);
  } catch {
    return undefined;
  }
}

export async function getActiveEquipment(): Promise<Equipment[]> {
  const all = await getEquipment();
  return all.filter((e) => e.status === 'active');
}

export async function getTakenEquipment(): Promise<Equipment[]> {
  const all = await getEquipment();
  return all.filter((e) => e.status === 'taken');
}

export async function createEquipment(data: {
  inventoryNumber: string;
  broughtBy: string;
  comment: string;
  glpiTicket: string;
}): Promise<Equipment> {
  const result = await apiRequest<{ id: string }>('/equipment', {
    method: 'POST',
    body: JSON.stringify({
      inventoryNumber: data.inventoryNumber,
      broughtBy: data.broughtBy,
      comment: data.comment,
      glpiTicket: data.glpiTicket,
    }),
  });
  
  return getEquipmentById(result.id) as Promise<Equipment>;
}

export async function takeEquipment(id: string, takenBy: string): Promise<Equipment> {
  await apiRequest(`/equipment/${id}/take`, {
    method: 'POST',
    body: JSON.stringify({ takenBy }),
  });
  
  return getEquipmentById(id) as Promise<Equipment>;
}

// ============ EMPLOYEES ============

export async function getEmployees(): Promise<Employee[]> {
  return apiRequest<Employee[]>('/employees');
}

export async function getActiveEmployees(): Promise<Employee[]> {
  const all = await getEmployees();
  return all.filter((e) => e.is_active);
}

export async function getEmployeeById(id: string): Promise<Employee | undefined> {
  const all = await getEmployees();
  return all.find((e) => e.id === id);
}

export async function getEmployeeName(id: string): Promise<string> {
  const emp = await getEmployeeById(id);
  return emp ? emp.full_name : 'Неизвестный';
}

export async function createEmployee(fullName: string): Promise<Employee> {
  const result = await apiRequest<{ id: string }>('/employees', {
    method: 'POST',
    body: JSON.stringify({ fullName }),
  });
  
  return getEmployeeById(result.id) as Promise<Employee>;
}

export async function updateEmployee(id: string, updates: { fullName?: string; isActive?: boolean }): Promise<Employee> {
  await apiRequest(`/employees/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fullName: updates.fullName,
      isActive: updates.isActive,
    }),
  });
  
  return getEmployeeById(id) as Promise<Employee>;
}

// ============ AUDIT LOGS ============

export async function getAuditLogs(): Promise<AuditLog[]> {
  return apiRequest<AuditLog[]>('/audit-logs');
}

// ============ STATISTICS ============

export async function getStats(): Promise<AppStats> {
  return apiRequest<AppStats>('/stats');
}

// ============ CSV IMPORT/EXPORT ============

export async function exportToCSV(equipmentOnly?: boolean): Promise<string> {
  const equipment = equipmentOnly ? await getActiveEquipment() : await getEquipment();
  
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

  const rows = await Promise.all(equipment.map(async (e) => [
    e.inventory_number,
    await getEmployeeName(e.brought_by),
    format(new Date(e.brought_at), 'dd.MM.yyyy HH:mm'),
    e.taken_by ? await getEmployeeName(e.taken_by) : '',
    e.taken_at ? format(new Date(e.taken_at), 'dd.MM.yyyy HH:mm') : '',
    e.comment,
    e.glpi_ticket,
    e.status === 'active' ? 'Активно' : 'Вынесено',
  ]));

  const csvContent = [
    headers.join(';'),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
  ].join('\n');

  return '\uFEFF' + csvContent; // BOM for Excel
}

export async function importFromCSV(csvText: string): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
  
  const text = csvText.replace(/^\uFEFF/, '');
  const lines = text.split('\n').filter((line) => line.trim());
  
  if (lines.length < 2) {
    result.errors.push({ row: 0, message: 'Файл пуст или содержит только заголовок' });
    return result;
  }

  const employees = await getEmployees();

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

      let broughtBy = employees.find((e) => e.full_name === broughtByName);
      if (!broughtBy && broughtByName) {
        broughtBy = await createEmployee(broughtByName);
      }

      if (!broughtBy) {
        result.errors.push({ row: i + 1, message: `Сотрудник не найден: "${broughtByName}"` });
        result.skipped++;
        continue;
      }

      await createEquipment({
        inventoryNumber,
        broughtBy: broughtBy.id,
        comment,
        glpiTicket,
      });
      
      result.imported++;
    } catch (err) {
      result.errors.push({ row: i + 1, message: `Ошибка: ${(err as Error).message}` });
      result.skipped++;
    }
  }

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

// ============ THEME ============

export function getTheme(): ThemeMode {
  return (localStorage.getItem('srv_theme') as ThemeMode) || 'dark';
}

export function setTheme(theme: ThemeMode): void {
  localStorage.setItem('srv_theme', theme);
}
