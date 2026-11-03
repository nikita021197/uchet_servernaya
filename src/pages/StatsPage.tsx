import { useState, useEffect } from 'react';
import { getStats } from '../store';
import { ThemeMode } from '../types';
import { Activity, HardDrive, MemoryStick, Clock } from 'lucide-react';

interface Props { theme: ThemeMode; }

export default function StatsPage({ theme }: Props) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats().then(s => { setStats(s); setLoading(false); });
  }, []);

  if (loading || !stats) return <div className="text-center py-12">Загрузка...</div>;

  const cardClass = `${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'} rounded-xl`;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Статистика</h1><p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Аналитика и мониторинг</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${cardClass} p-4`}>
          <div className="flex items-center gap-2 mb-2"><Activity size={16} className="text-blue-500" /><span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>CPU</span></div>
          <p className="text-2xl font-bold">{stats.cpuUsage}%</p>
          <div className={`mt-2 h-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}><div className="h-full rounded-full bg-blue-500" style={{ width: `${stats.cpuUsage}%` }}></div></div>
        </div>
        <div className={`${cardClass} p-4`}>
          <div className="flex items-center gap-2 mb-2"><MemoryStick size={16} className="text-purple-500" /><span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Память</span></div>
          <p className="text-2xl font-bold">{stats.memoryUsage}%</p>
          <div className={`mt-2 h-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}><div className="h-full rounded-full bg-purple-500" style={{ width: `${stats.memoryUsage}%` }}></div></div>
        </div>
        <div className={`${cardClass} p-4`}>
          <div className="flex items-center gap-2 mb-2"><HardDrive size={16} className="text-green-500" /><span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Диск</span></div>
          <p className="text-2xl font-bold">{stats.diskUsage}%</p>
          <div className={`mt-2 h-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}><div className="h-full rounded-full bg-green-500" style={{ width: `${stats.diskUsage}%` }}></div></div>
        </div>
        <div className={`${cardClass} p-4`}>
          <div className="flex items-center gap-2 mb-2"><Clock size={16} className="text-orange-500" /><span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Записей в журнале</span></div>
          <p className="text-2xl font-bold">{stats.logFilesCount}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${cardClass} p-6`}>
          <h3 className="font-semibold mb-4">📊 Оборудование</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Всего записей</span><span className="font-bold text-blue-500">{stats.totalRecords}</span></div>
            <div className="flex justify-between text-sm"><span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Активное</span><span className="font-bold text-green-500">{stats.activeEquipment}</span></div>
            <div className="flex justify-between text-sm"><span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Вынесено</span><span className="font-bold text-orange-500">{stats.takenEquipment}</span></div>
          </div>
        </div>
        <div className={`${cardClass} p-6`}>
          <h3 className="font-semibold mb-4">🏆 Топ по внесению</h3>
          {stats.topBroughtBy && stats.topBroughtBy.length > 0 ? (
            <div className="space-y-2">
              {stats.topBroughtBy.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm"><span className="truncate">{item.name}</span><span className="font-bold">{item.count}</span></div>
              ))}
            </div>
          ) : <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Нет данных</p>}
        </div>
        <div className={`${cardClass} p-6`}>
          <h3 className="font-semibold mb-4">📦 Топ по выносу</h3>
          {stats.topTakenBy && stats.topTakenBy.length > 0 ? (
            <div className="space-y-2">
              {stats.topTakenBy.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm"><span className="truncate">{item.name}</span><span className="font-bold">{item.count}</span></div>
              ))}
            </div>
          ) : <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Нет данных</p>}
        </div>
      </div>
      <div className={`${cardClass} p-6`}>
        <h3 className="font-semibold mb-4">📈 Операции</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className="text-2xl font-bold text-blue-500">{stats.operationsToday}</p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Сегодня</p>
          </div>
          <div className={`p-4 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className="text-2xl font-bold text-purple-500">{stats.operationsWeek}</p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>За неделю</p>
          </div>
          <div className={`p-4 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className="text-2xl font-bold text-green-500">{stats.operationsMonth}</p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>За месяц</p>
          </div>
        </div>
      </div>
    </div>
  );
}
