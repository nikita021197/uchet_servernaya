import { useState, useEffect } from 'react';
import { getEmployees, createEmployee, updateEmployee, getEquipment } from '../store';
import { Employee, ThemeMode, Notification } from '../types';
import { format } from 'date-fns';
import { UserPlus, Edit2, Check, X, Users as UsersIcon } from 'lucide-react';

interface Props {
  theme: ThemeMode;
  addNotification: (type: Notification['type'], message: string) => void;
}

export default function Employees({ theme, addNotification }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    setEmployees(getEmployees());
  }, []);

  const refresh = () => setEmployees(getEmployees());

  const handleAdd = () => {
    if (!newName.trim()) return;
    try {
      createEmployee(newName.trim());
      addNotification('success', `Сотрудник "${newName.trim()}" добавлен`);
      setNewName('');
      setShowAdd(false);
      refresh();
    } catch (err) {
      addNotification('error', (err as Error).message);
    }
  };

  const handleEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEditName(emp.fullName);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    try {
      updateEmployee(editingId, { fullName: editName.trim() });
      addNotification('success', 'Сотрудник обновлён');
      setEditingId(null);
      refresh();
    } catch (err) {
      addNotification('error', (err as Error).message);
    }
  };

  const handleToggleActive = (emp: Employee) => {
    try {
      const newStatus = !emp.isActive;
      updateEmployee(emp.id, { isActive: newStatus });
      addNotification('success', newStatus ? 'Сотрудник активирован' : 'Сотрудник деактивирован');
      refresh();
    } catch (err) {
      addNotification('error', (err as Error).message);
    }
  };

  const getEmployeeRecordCount = (empId: string) => {
    return getEquipment().filter((e) => e.broughtBy === empId || e.takenBy === empId).length;
  };

  const cardClass = `${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'} rounded-xl`;
  const inputClass = `w-full px-4 py-2.5 rounded-lg text-sm ${
    theme === 'dark'
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
  } border focus:outline-none focus:ring-2 focus:ring-blue-500`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Сотрудники</h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Управление сотрудниками
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <UserPlus size={16} />
          <span className="hidden sm:inline">Добавить</span>
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className={`${cardClass} p-4`}>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ФИО сотрудника"
              className={inputClass}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Добавить
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewName(''); }}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium ${
                theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
              } transition-colors`}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Employee list */}
      <div className={`${cardClass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`${theme === 'dark' ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                <th className="px-4 py-3 text-left font-medium">ФИО</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Статус</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Записей</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Добавлен</th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
              {employees.map((emp) => (
                <tr key={emp.id} className={`${theme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className="px-4 py-3">
                    {editingId === emp.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={`${inputClass} py-1`}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">{emp.fullName}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      emp.isActive
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {emp.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {getEmployeeRecordCount(emp.id)}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {format(new Date(emp.createdAt), 'dd.MM.yyyy')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {editingId === emp.id ? (
                        <>
                          <button onClick={handleSaveEdit} className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-500">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500">
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(emp)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-500">
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(emp)}
                            className={`p-1.5 rounded-lg text-xs font-medium ${
                              emp.isActive
                                ? 'hover:bg-red-500/10 text-red-500'
                                : 'hover:bg-green-500/10 text-green-500'
                            }`}
                          >
                            {emp.isActive ? 'Деактив.' : 'Актив.'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {employees.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon size={40} className={`mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Нет сотрудников</p>
          </div>
        )}
      </div>
    </div>
  );
}
