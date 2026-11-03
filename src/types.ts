export interface Employee {
  id: string;
  full_name: string;
  is_active: number;
  created_at: string;
}

export interface Equipment {
  id: string;
  inventory_number: string;
  brought_by: string;
  taken_by: string | null;
  brought_at: string;
  taken_at: string | null;
  comment: string;
  glpi_ticket: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'taken' | 'overdue';
  brought_by_name?: string;
  taken_by_name?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  object_type: string;
  object_id: string;
  details: string;
}

export interface AppStats {
  totalRecords: number;
  activeEquipment: number;
  takenEquipment: number;
  overdueEquipment: number;
  operationsToday: number;
  operationsWeek: number;
  operationsMonth: number;
  topBroughtBy: { name: string; count: number }[];
  topTakenBy: { name: string; count: number }[];
  glpiDistribution: { ticket: string; count: number }[];
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  uptime: string;
  logFilesCount: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export type ThemeMode = 'light' | 'dark';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
