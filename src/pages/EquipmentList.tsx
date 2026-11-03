import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getEquipment, getEmployees } from '../store';
import { Equipment, Employee, ThemeMode, Notification } from '../types';
import { format } from 'date-fns';
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  theme: ThemeMode;
  addNotification: (type: Notification['type'], message: string) => void;
}

export default function EquipmentList({ theme }: Props) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const perPage = 15;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [eq, emps] = await Promise.all([getEquipment(), getEmployees()]);
    setEquipment(eq);
    setEmployees(emps);
    setLoading(false);
  };

  const filteredEquipment = useMemo(() => {
    let result = [...equipment];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        e.inventory_number.toLowerCase().includes(q) ||
        e.comment.toLowerCase().includes(q) ||
        e.glpi_ticket.toLowerCase().includes(q) ||
        (e.brought_by_name || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') result = result.filter((e) => e.status === statusFilter);
    if (employeeFilter !== 'all') result = result.filter((e) => e.brought_by === employeeFilter);
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case 'inventory_number': aVal = a.inventory_number; bVal = b.inventory_number; break;
        case 'brought_at': aVal = new Date(a.brought_at).getTime(); bVal = new Date(b.brought_at).getTime(); break;
        default: aVal = new Date(a.created_at).getTime(); bVal = new Date(b.created_at).getTime();
      }
      return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    return result;
  }, [equipment, search, statusFilter, employeeFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(filteredEquipment.length / perPage);
  const paginated = filteredEquipment.slice((page - 1) * perPage, page * perPage);
  const cardClass = `rounded-xl ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`;
  const inputClass = `px-3 py-2 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-blue-500`;

  if (loading) return <div className="text-center py-12">Загрузка...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Оборудование</h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{filteredEquipment.length} записей</p>
        </div>
        <Link to="/equipment/new" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /><span className="hidden sm:inline">Внести</span>
        </Link>
      </div>

      <div className={`${cardClass} p-4`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <input type="text" placeholder="Поиск..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={`w-full pl-9 pr-4 ${inputClass}`} />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={inputClass}>
            <option value="all">Все статусы</option>
            <option value="active">Активное</option>
            <option value="taken">Вынесено</option>
          </select>
          <select value={employeeFilter} onChange={(e) => { setEmployeeFilter(e.target.value); setPage(1); }} className={inputClass}>
            <option value="all">Все сотрудники</option>
            {employees.filter(e => e.is_active).map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        {paginated.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${theme === 'dark' ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                  <th className="px-4 py-3 text-left font-medium cursor-pointer hover:text-blue-500" onClick={() => { setSortBy('inventory_number'); setSortDir(sortBy === 'inventory_number' && sortDir === 'asc' ? 'desc' : 'asc'); }}>Инв. номер</th>
                  <th className="px-4 py-3 text-left font-medium">Статус</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Внёс</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell cursor-pointer hover:text-blue-500" onClick={() => { setSortBy('brought_at'); setSortDir(sortBy === 'brought_at' && sortDir === 'asc' ? 'desc' : 'asc'); }}>Дата</th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">GLPI</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
                {paginated.map((eq) => (
                  <tr key={eq.id} className={`${theme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-4 py-3"><Link to={`/equipment/${eq.id}`} className="text-blue-500 hover:underline font-medium">{eq.inventory_number}</Link></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${eq.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                        {eq.status === 'active' ? 'Активно' : 'Вынесено'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">{eq.brought_by_name || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{format(new Date(eq.brought_at), 'dd.MM.yyyy HH:mm')}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{eq.glpi_ticket || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12"><p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Ничего не найдено</p></div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Стр. {page} из {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`p-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 disabled:opacity-50' : 'bg-white border-gray-200 disabled:opacity-50'}`}><ChevronLeft size={16} /></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={`p-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 disabled:opacity-50' : 'bg-white border-gray-200 disabled:opacity-50'}`}><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
