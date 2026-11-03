import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getEquipment, getEmployees, getEmployeeName } from '../store';
import { Equipment, ThemeMode, Notification } from '../types';
import { format } from 'date-fns';
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  theme: ThemeMode;
  addNotification: (type: Notification['type'], message: string) => void;
}

export default function EquipmentList({ theme, addNotification }: Props) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const perPage = 15;

  useEffect(() => {
    setEquipment(getEquipment());
  }, []);

  const filteredEquipment = useMemo(() => {
    let result = [...equipment];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.inventoryNumber.toLowerCase().includes(q) ||
          e.comment.toLowerCase().includes(q) ||
          e.glpiTicket.toLowerCase().includes(q) ||
          getEmployeeName(e.broughtBy).toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((e) => e.status === statusFilter);
    }

    if (employeeFilter !== 'all') {
      result = result.filter((e) => e.broughtBy === employeeFilter);
    }

    result.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      switch (sortBy) {
        case 'inventoryNumber':
          aVal = a.inventoryNumber;
          bVal = b.inventoryNumber;
          break;
        case 'broughtAt':
          aVal = new Date(a.broughtAt).getTime();
          bVal = new Date(b.broughtAt).getTime();
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
      }
      if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return result;
  }, [equipment, search, statusFilter, employeeFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(filteredEquipment.length / perPage);
  const paginatedEquipment = filteredEquipment.slice((page - 1) * perPage, page * perPage);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const cardClass = `rounded-xl ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Оборудование</h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {filteredEquipment.length} записей
          </p>
        </div>
        <Link
          to="/equipment/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Внести</span>
        </Link>
      </div>

      {/* Filters */}
      <div className={`${cardClass} p-4`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Поиск по номеру, комментарию, GLPI..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className={`px-3 py-2 rounded-lg text-sm ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-gray-50 border-gray-200 text-gray-900'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="all">Все статусы</option>
            <option value="active">Активное</option>
            <option value="taken">Вынесено</option>
          </select>
          <select
            value={employeeFilter}
            onChange={(e) => { setEmployeeFilter(e.target.value); setPage(1); }}
            className={`px-3 py-2 rounded-lg text-sm ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-gray-50 border-gray-200 text-gray-900'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="all">Все сотрудники</option>
            {getEmployees().filter(e => e.isActive).map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={`${cardClass} overflow-hidden`}>
        {paginatedEquipment.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${theme === 'dark' ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                  <th className="px-4 py-3 text-left font-medium cursor-pointer hover:text-blue-500" onClick={() => handleSort('inventoryNumber')}>
                    Инв. номер
                  </th>
                  <th className="px-4 py-3 text-left font-medium cursor-pointer hover:text-blue-500" onClick={() => handleSort('status')}>
                    Статус
                  </th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Внёс</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell cursor-pointer hover:text-blue-500" onClick={() => handleSort('broughtAt')}>
                    Дата внесения
                  </th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Вынес</th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">GLPI</th>
                  <th className="px-4 py-3 text-left font-medium hidden xl:table-cell">Комментарий</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
                {paginatedEquipment.map((eq) => (
                  <tr key={eq.id} className={`${theme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-4 py-3">
                      <Link to={`/equipment/${eq.id}`} className="text-blue-500 hover:underline font-medium">
                        {eq.inventoryNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        eq.status === 'active'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-orange-500/10 text-orange-500'
                      }`}>
                        {eq.status === 'active' ? 'Активно' : 'Вынесено'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">{getEmployeeName(eq.broughtBy)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {format(new Date(eq.broughtAt), 'dd.MM.yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {eq.takenBy ? getEmployeeName(eq.takenBy) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">{eq.glpiTicket || '—'}</td>
                    <td className="px-4 py-3 hidden xl:table-cell max-w-[200px] truncate">{eq.comment || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              {search || statusFilter !== 'all' || employeeFilter !== 'all'
                ? 'Ничего не найдено по заданным фильтрам'
                : 'Пока нет записей'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Стр. {page} из {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`p-2 rounded-lg ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 disabled:opacity-50'
                  : 'bg-white border-gray-200 hover:bg-gray-50 disabled:opacity-50'
              } border`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`p-2 rounded-lg ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 disabled:opacity-50'
                  : 'bg-white border-gray-200 hover:bg-gray-50 disabled:opacity-50'
              } border`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
