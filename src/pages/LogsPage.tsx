import { useState, useEffect } from 'react';
import { getAuditLogs } from '../store';
import { AuditLog, ThemeMode } from '../types';
import { format } from 'date-fns';
import { ScrollText, Filter, Download } from 'lucide-react';

interface Props { theme: ThemeMode; }

export default function LogsPage({ theme }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs().then(l => { setLogs(l); setLoading(false); });
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (filter) {
      const q = filter.toLowerCase();
      return log.details.toLowerCase().includes(q) || log.object_type.toLowerCase().includes(q) || log.action.toLowerCase().includes(q);
    }
    return true;
  });

  const exportLogs = () => {
    const headers = ['Время', 'Действие', 'Тип объекта', 'ID объекта', 'Детали'];
    const rows = filteredLogs.map((log) => [
      format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm:ss'),
      log.action, log.object_type, log.object_id, log.details,
    ]);
    const csv = [headers.join(';'), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'audit_log.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-500/10 text-green-500';
      case 'update': return 'bg-blue-500/10 text-blue-500';
      case 'take': return 'bg-orange-500/10 text-orange-500';
      case 'import': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create': return 'Создание';
      case 'update': return 'Обновление';
      case 'take': return 'Вынос';
      case 'import': return 'Импорт';
      default: return action;
    }
  };

  const cardClass = `${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'} rounded-xl`;

  if (loading) return <div className="text-center py-12">Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Журнал аудита</h1><p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{filteredLogs.length} записей</p></div>
        <button onClick={exportLogs} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><Download size={16} /><span className="hidden sm:inline">Экспорт CSV</span></button>
      </div>
      <div className={`${cardClass} p-4`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Filter size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <input type="text" placeholder="Поиск..." value={filter} onChange={(e) => setFilter(e.target.value)} className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} border focus:outline-none focus:ring-2 focus:ring-blue-500`} />
          </div>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className={`px-3 py-2 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}>
            <option value="all">Все действия</option>
            <option value="create">Создание</option>
            <option value="update">Обновление</option>
            <option value="take">Вынос</option>
            <option value="import">Импорт</option>
          </select>
        </div>
      </div>
      <div className={`${cardClass} overflow-hidden`}>
        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-gray-700/50">
            {filteredLogs.slice(0, 100).map((log) => (
              <div key={log.id} className={`px-4 py-3 ${theme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1.5 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}><ScrollText size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getActionBadge(log.action)}`}>{getActionLabel(log.action)}</span>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{log.object_type}</span>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`}>{format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm:ss')}</span>
                    </div>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{log.details}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12"><ScrollText size={40} className={`mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} /><p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Журнал пуст</p></div>
        )}
      </div>
      {filteredLogs.length > 100 && <p className={`text-center text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Показано 100 из {filteredLogs.length}</p>}
    </div>
  );
}
