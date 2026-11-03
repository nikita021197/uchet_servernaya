export interface Employee {
  id: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
}

export interface Equipment {
  id: string;
  inventoryNumber: string;
  broughtBy: string; // employee id
  takenBy: string | null; // employee id
  broughtAt: string; // ISO date
  takenAt: string | null; // ISO date
  comment: string;
  glpiTicket: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'taken' | 'overdue';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  objectType: string;
  objectId: string;
  details: string;
  oldValue?: string;
  newValue?: string;
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
