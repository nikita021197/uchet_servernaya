import { useState, useRef } from 'react';
import { exportToCSV, importFromCSV, getEquipment, getActiveEquipment } from '../store';
import { ImportResult, ThemeMode, Notification } from '../types';
import { Download, Upload, FileText, Database, AlertTriangle } from 'lucide-react';

interface Props {
  theme: ThemeMode;
  addNotification: (type: Notification['type'], message: string) => void;
}

export default function DataPage({ theme, addNotification }: Props) {
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportAll = () => {
    const csv = exportToCSV(false);
    downloadCSV(csv, 'equipment_all.csv');
    addNotification('success', 'Экспорт всех записей выполнен');
  };

  const handleExportActive = () => {
    const csv = exportToCSV(true);
    downloadCSV(csv, 'equipment_active.csv');
    addNotification('success', 'Экспорт активного оборудования выполнен');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addNotification('error', 'Файл слишком большой (макс. 5 МБ)');
      return;
    }

    // Check extension
    if (!file.name.endsWith('.csv')) {
      addNotification('error', 'Поддерживаются только CSV файлы');
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const result = importFromCSV(text);
      setImportResult(result);
      if (result.imported > 0) {
        addNotification('success', `Импортировано: ${result.imported} записей`);
      }
      if (result.errors.length > 0) {
        addNotification('warning', `Ошибок при импорте: ${result.errors.length}`);
      }
    } catch (err) {
      addNotification('error', `Ошибка импорта: ${(err as Error).message}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const cardClass = `${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'} rounded-xl`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Данные</h1>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Импорт и экспорт данных в CSV
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export */}
        <div className={`${cardClass} p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-lg ${theme === 'dark' ? 'bg-green-600/20' : 'bg-green-50'}`}>
              <Download size={22} className="text-green-500" />
            </div>
            <div>
              <h2 className="font-semibold">Экспорт</h2>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Выгрузка данных в CSV
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Все записи</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {getEquipment().length} записей
                  </p>
                </div>
                <button
                  onClick={handleExportAll}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                >
                  Экспорт
                </button>
              </div>
            </div>

            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Активное оборудование</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {getActiveEquipment().length} записей
                  </p>
                </div>
                <button
                  onClick={handleExportActive}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                >
                  Экспорт
                </button>
              </div>
            </div>
          </div>

          <div className={`mt-4 p-3 rounded-lg text-xs ${theme === 'dark' ? 'bg-blue-600/10 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
            <p>💡 Файл экспортируется в UTF-8 с BOM для корректного отображения кириллицы в Excel. Разделитель — точка с запятой.</p>
          </div>
        </div>

        {/* Import */}
        <div className={`${cardClass} p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-lg ${theme === 'dark' ? 'bg-blue-600/20' : 'bg-blue-50'}`}>
              <Upload size={22} className="text-blue-500" />
            </div>
            <div>
              <h2 className="font-semibold">Импорт</h2>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Загрузка данных из CSV
              </p>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
            } transition-colors cursor-pointer`}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText size={32} className={`mx-auto mb-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className="text-sm font-medium">Нажмите для выбора файла</p>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              CSV, макс. 5 МБ
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
          </div>

          {isImporting && (
            <div className="mt-4 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="text-sm mt-2">Импорт...</p>
            </div>
          )}

          {importResult && (
            <div className={`mt-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="font-medium text-sm mb-2">Результат импорта</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-green-500 font-bold">{importResult.imported}</span>
                  <span className={`ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>импортировано</span>
                </div>
                <div>
                  <span className="text-orange-500 font-bold">{importResult.skipped}</span>
                  <span className={`ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>пропущено</span>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-red-500 mb-1 flex items-center gap-1">
                    <AlertTriangle size={12} /> Ошибки:
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Строка {err.row}: {err.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={`mt-4 p-3 rounded-lg text-xs ${theme === 'dark' ? 'bg-yellow-600/10 text-yellow-400' : 'bg-yellow-50 text-yellow-700'}`}>
            <p>⚠️ Формат CSV: инв.номер;сотрудник;дата_внесения;кто_вынес;дата_выноса;комментарий;GLPI. Первая строка — заголовок. Дубликаты активных номеров будут пропущены.</p>
          </div>
        </div>
      </div>

      {/* Data stats */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-lg ${theme === 'dark' ? 'bg-purple-600/20' : 'bg-purple-50'}`}>
            <Database size={22} className="text-purple-500" />
          </div>
          <div>
            <h2 className="font-semibold">Хранилище</h2>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Данные хранятся в localStorage браузера
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className={`p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className="text-2xl font-bold text-blue-500">{getEquipment().length}</p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Всего записей</p>
          </div>
          <div className={`p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className="text-2xl font-bold text-green-500">{getActiveEquipment().length}</p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Активных</p>
          </div>
          <div className={`p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className="text-2xl font-bold text-orange-500">{getEquipment().length - getActiveEquipment().length}</p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Вынесенных</p>
          </div>
          <div className={`p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className="text-2xl font-bold text-purple-500">
              {(new Blob([JSON.stringify(localStorage)]).size / 1024).toFixed(1)}
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>КБ занято</p>
          </div>
        </div>
      </div>
    </div>
  );
}
