import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEquipmentById, takeEquipment, getActiveEmployees } from '../store';
import { Equipment, Employee, ThemeMode, Notification } from '../types';
import { format } from 'date-fns';
import { ArrowLeft, PackageCheck, PackageX, Clock, User, Hash, MessageSquare } from 'lucide-react';

interface Props { theme: ThemeMode; addNotification: (type: Notification['type'], message: string) => void; }

export default function EquipmentDetail({ theme, addNotification }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showTakeModal, setShowTakeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    const [eq, emps] = await Promise.all([getEquipmentById(id), getActiveEmployees()]);
    if (eq) setEquipment(eq);
    else navigate('/equipment');
    setEmployees(emps);
    setLoading(false);
  };

  const handleTake = async () => {
    if (!equipment || !selectedEmployee || confirmText !== 'ПОДТВЕРЖДАЮ') return;
    try {
      await takeEquipment(equipment.id, selectedEmployee);
      addNotification('success', `Оборудование "${equipment.inventory_number}" вынесено`);
      const updated = await getEquipmentById(equipment.id);
      setEquipment(updated || null);
      setShowTakeModal(false);
      setSelectedEmployee('');
      setConfirmText('');
    } catch (err) {
      addNotification('error', (err as Error).message);
    }
  };

  if (loading || !equipment) return <div className="text-center py-12">Загрузка...</div>;

  const cardClass = `${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'} rounded-xl`;
  const inputClass = `w-full px-4 py-2.5 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-blue-500`;
  const infoRow = (icon: React.ReactNode, label: string, value: string) => (
    <div className="flex items-start gap-3 py-3">
      <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>{icon}</div>
      <div className="flex-1 min-w-0"><p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p><p className="text-sm font-medium mt-0.5 break-words">{value}</p></div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button onClick={() => navigate('/equipment')} className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}><ArrowLeft size={16} />К списку</button>
      <div className={`${cardClass} p-6`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${equipment.status === 'active' ? (theme === 'dark' ? 'bg-green-600/20' : 'bg-green-50') : (theme === 'dark' ? 'bg-orange-600/20' : 'bg-orange-50')}`}>
              {equipment.status === 'active' ? <PackageCheck size={24} className="text-green-500" /> : <PackageX size={24} className="text-orange-500" />}
            </div>
            <div>
              <h1 className="text-xl font-bold">{equipment.inventory_number}</h1>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${equipment.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                {equipment.status === 'active' ? 'Активно в серверной' : 'Вынесено'}
              </span>
            </div>
          </div>
        </div>
        <div className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'}`}>
          {infoRow(<Hash size={16} className="text-blue-500" />, 'Инвентарный номер', equipment.inventory_number)}
          {infoRow(<User size={16} className="text-green-500" />, 'Внёс', equipment.brought_by_name || 'Неизвестный')}
          {infoRow(<Clock size={16} className="text-purple-500" />, 'Дата внесения', format(new Date(equipment.brought_at), 'dd.MM.yyyy HH:mm:ss'))}
          {equipment.taken_by && infoRow(<User size={16} className="text-orange-500" />, 'Вынес', equipment.taken_by_name || 'Неизвестный')}
          {equipment.taken_at && infoRow(<Clock size={16} className="text-orange-500" />, 'Дата выноса', format(new Date(equipment.taken_at), 'dd.MM.yyyy HH:mm:ss'))}
          {equipment.glpi_ticket && infoRow(<PackageCheck size={16} className="text-cyan-500" />, 'GLPI заявка', equipment.glpi_ticket)}
          {equipment.comment && infoRow(<MessageSquare size={16} className="text-yellow-500" />, 'Комментарий', equipment.comment)}
        </div>
        {equipment.status === 'active' && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <button onClick={() => setShowTakeModal(true)} className="w-full px-4 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center justify-center gap-2">
              <PackageX size={16} />Вынести оборудование
            </button>
          </div>
        )}
      </div>
      {showTakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className={`${cardClass} p-6 w-full max-w-md`}>
            <h2 className="text-lg font-bold mb-4">Вынос оборудования</h2>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Оборудование: <strong>{equipment.inventory_number}</strong></p>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Кто выносит *</label>
                <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className={inputClass}>
                  <option value="">Выберите сотрудника</option>
                  {employees.map((emp) => (<option key={emp.id} value={emp.id}>{emp.full_name}</option>))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Подтверждение</label>
                <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder='Введите "ПОДТВЕРЖДАЮ"' className={inputClass} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleTake} disabled={!selectedEmployee || confirmText !== 'ПОДТВЕРЖДАЮ'} className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed">Подтвердить</button>
                <button onClick={() => { setShowTakeModal(false); setConfirmText(''); }} className={`px-4 py-2.5 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
