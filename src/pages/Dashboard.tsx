import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEquipment, getStats, getEmployeeName } from '../store';
import { Equipment, ThemeMode, Notification } from '../types';
import { format } from 'date-fns';
import {
  Package,
  PackageCheck,
  PackageX,
  CalendarClock,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';

interface Props {
  theme: ThemeMode;
  addNotification: (type: Notification['type'], message: string) => void;
}

export default function Dashboard({ theme, addNotification }: Props) {
  const [stats, setStats] = useState(getStats());
  const [recentEquipment, setRecentEquipment] = useState<Equipment[]>([]);

  useEffect(() => {
    const equipment = getEquipment().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setRecentEquipment(equipment.slice(0, 10));
    setStats(getStats());
  }, []);

  const cardClass = `rounded-xl p-5 ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`;
  const statCard = (icon: React.ReactNode, label: string, value: number, color: string) => (
    <div className={cardClass}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Главная</h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Обзор состояния серверной комнаты
          </p>
        </div>
        <Link
          to="/equipment/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Внести оборудование</span>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCard(
          <Package size={22} className="text-blue-500" />,
          'Всего записей',
          stats.totalRecords,
          'text-blue-500'
        )}
        {statCard(
          <PackageCheck size={22} className="text-green-500" />,
          'Активное оборудование',
          stats.activeEquipment,
          'text-green-500'
        )}
        {statCard(
          <PackageX size={22} className="text-orange-500" />,
          'Вынесено',
          stats.takenEquipment,
          'text-orange-500'
        )}
        {statCard(
          <CalendarClock size={22} className="text-purple-500" />,
          'Операций сегодня',
          stats.operationsToday,
          'text-purple-500'
        )}
      </div>

      {/* Operations summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={cardClass}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" />
            Операции
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Сегодня</span>
              <span className="font-medium">{stats.operationsToday}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>За неделю</span>
              <span className="font-medium">{stats.operationsWeek}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>За месяц</span>
              <span className="font-medium">{stats.operationsMonth}</span>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <h3 className="font-semibold mb-3">🏆 Топ по внесению</h3>
          <div className="space-y-2">
            {stats.topBroughtBy.length > 0 ? (
              stats.topBroughtBy.slice(0, 3).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="truncate">{item.name}</span>
                  <span className="font-medium ml-2">{item.count}</span>
                </div>
              ))
            ) : (
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Нет данных</p>
            )}
          </div>
        </div>

        <div className={cardClass}>
          <h3 className="font-semibold mb-3">📊 Система</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>CPU</span>
              <span className="font-medium">{stats.cpuUsage}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Память</span>
              <span className="font-medium">{stats.memoryUsage}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Диск</span>
              <span className="font-medium">{stats.diskUsage}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Uptime</span>
              <span className="font-medium">{stats.uptime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent equipment */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Последние операции</h3>
          <Link
            to="/equipment"
            className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
          >
            Все записи <ArrowRight size={14} />
          </Link>
        </div>
        {recentEquipment.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <th className="pb-3 font-medium">Инв. номер</th>
                  <th className="pb-3 font-medium">Статус</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Внёс</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Дата</th>
                  <th className="pb-3 font-medium hidden lg:table-cell">GLPI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {recentEquipment.map((eq) => (
                  <tr key={eq.id} className={`${theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="py-2.5">
                      <Link to={`/equipment/${eq.id}`} className="text-blue-500 hover:underline font-medium">
                        {eq.inventoryNumber}
                      </Link>
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        eq.status === 'active'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-orange-500/10 text-orange-500'
                      }`}>
                        {eq.status === 'active' ? 'Активно' : 'Вынесено'}
                      </span>
                    </td>
                    <td className="py-2.5 hidden sm:table-cell">{getEmployeeName(eq.broughtBy)}</td>
                    <td className="py-2.5 hidden md:table-cell">
                      {format(new Date(eq.broughtAt), 'dd.MM.yyyy HH:mm')}
                    </td>
                    <td className="py-2.5 hidden lg:table-cell">{eq.glpiTicket || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Package size={40} className={`mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              Пока нет записей. Внесите первое оборудование!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
