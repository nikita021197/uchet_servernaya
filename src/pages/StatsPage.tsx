import { useState, useEffect } from 'react';
import { getStats } from '../store';
import { AppStats, ThemeMode } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, HardDrive, MemoryStick, Clock } from 'lucide-react';

interface Props {
  theme: ThemeMode;
}

export default function StatsPage({ theme }: Props) {
  const [stats, setStats] = useState<AppStats>(getStats());

  useEffect(() => {
    setStats(getStats());
  }, []);

  const cardClass = `${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'} rounded-xl`;

  const pieData = [
    { name: 'Активное', value: stats.activeEquipment, color: '#22c55e' },
    { name: 'Вынесено', value: stats.takenEquipment, color: '#f97316' },
  ];

  const operationsData = [
    { name: 'Сегодня', value: stats.operationsToday },
    { name: 'Неделя', value: stats.operationsWeek },
    { name: 'Месяц', value: stats.operationsMonth },
  ];

  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
    border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
    borderRadius: '8px',
    fontSize: '12px',
    color: theme === 'dark' ? '#e5e7eb' : '#111827',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Статистика</h1>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Аналитика и мониторинг
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${cardClass} p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-blue-500" />
            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>CPU</span>
          </div>
          <p className="text-2xl font-bold">{stats.cpuUsage}%</p>
          <div className={`mt-2 h-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${stats.cpuUsage}%` }}></div>
          </div>
        </div>
        <div className={`${cardClass} p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <MemoryStick size={16} className="text-purple-500" />
            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Память</span>
          </div>
          <p className="text-2xl font-bold">{stats.memoryUsage}%</p>
          <div className={`mt-2 h-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div className="h-full rounded-full bg-purple-500" style={{ width: `${stats.memoryUsage}%` }}></div>
          </div>
        </div>
        <div className={`${cardClass} p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <HardDrive size={16} className="text-green-500" />
            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Диск</span>
          </div>
          <p className="text-2xl font-bold">{stats.diskUsage}%</p>
          <div className={`mt-2 h-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div className="h-full rounded-full bg-green-500" style={{ width: `${stats.diskUsage}%` }}></div>
          </div>
        </div>
        <div className={`${cardClass} p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-orange-500" />
            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Uptime</span>
          </div>
          <p className="text-lg font-bold">{stats.uptime}</p>
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            {stats.logFilesCount} записей в журнале
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment distribution pie */}
        <div className={`${cardClass} p-6`}>
          <h3 className="font-semibold mb-4">Распределение оборудования</h3>
          {stats.totalRecords > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Нет данных</p>
            </div>
          )}
          <div className="flex justify-center gap-6 mt-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Operations bar chart */}
        <div className={`${cardClass} p-6`}>
          <h3 className="font-semibold mb-4">Операции по периодам</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={operationsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top employees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${cardClass} p-6`}>
          <h3 className="font-semibold mb-4">🏆 Топ по внесению</h3>
          {stats.topBroughtBy.length > 0 ? (
            <div className="space-y-3">
              {stats.topBroughtBy.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                    i === 1 ? 'bg-gray-400/20 text-gray-400' :
                    'bg-orange-500/20 text-orange-500'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm truncate">{item.name}</span>
                  <span className="text-sm font-bold">{item.count}</span>
                  <div className={`w-24 h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(item.count / stats.topBroughtBy[0].count) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Нет данных</p>
          )}
        </div>

        <div className={`${cardClass} p-6`}>
          <h3 className="font-semibold mb-4">📦 Топ по выносу</h3>
          {stats.topTakenBy.length > 0 ? (
            <div className="space-y-3">
              {stats.topTakenBy.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                    i === 1 ? 'bg-gray-400/20 text-gray-400' :
                    'bg-orange-500/20 text-orange-500'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm truncate">{item.name}</span>
                  <span className="text-sm font-bold">{item.count}</span>
                  <div className={`w-24 h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${(item.count / stats.topTakenBy[0].count) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Нет данных</p>
          )}
        </div>
      </div>

      {/* GLPI distribution */}
      <div className={`${cardClass} p-6`}>
        <h3 className="font-semibold mb-4">📋 Распределение по GLPI заявкам</h3>
        {stats.glpiDistribution.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.glpiDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
              <XAxis type="number" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} />
              <YAxis dataKey="ticket" type="category" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={11} width={100} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Нет данных</p>
        )}
      </div>
    </div>
  );
}
