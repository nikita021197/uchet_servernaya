import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEquipment, getActiveEmployees } from '../store';
import { Employee, ThemeMode, Notification } from '../types';
import { ArrowLeft, PackagePlus } from 'lucide-react';

interface Props { theme: ThemeMode; addNotification: (type: Notification['type'], message: string) => void; }

export default function EquipmentNew({ theme, addNotification }: Props) {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({ inventoryNumber: '', broughtBy: '', comment: '', glpiTicket: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveEmployees().then(emps => {
      setEmployees(emps);
      if (emps.length > 0) setForm(f => ({ ...f, broughtBy: emps[0].id }));
      setLoading(false);
    });
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.inventoryNumber.trim()) errs.inventoryNumber = 'Обязательное поле';
    else if (form.inventoryNumber.trim().length < 3) errs.inventoryNumber = 'Минимум 3 символа';
    if (!form.broughtBy) errs.broughtBy = 'Выберите сотрудника';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const eq = await createEquipment({
        inventoryNumber: form.inventoryNumber.trim(),
        broughtBy: form.broughtBy,
        comment: form.comment.trim(),
        glpiTicket: form.glpiTicket.trim(),
      });
      addNotification('success', `Оборудование "${eq.inventory_number}" успешно внесено`);
      navigate(`/equipment/${eq.id}`);
    } catch (err) {
      addNotification('error', (err as Error).message);
    }
  };

  const inputClass = `w-full px-4 py-2.5 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} border focus:outline-none focus:ring-2 focus:ring-blue-500`;
  const labelClass = `block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`;

  if (loading) return <div className="text-center py-12">Загрузка...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}><ArrowLeft size={16} />Назад</button>
      <div className={`${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'} rounded-xl p-6`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2.5 rounded-lg ${theme === 'dark' ? 'bg-blue-600/20' : 'bg-blue-50'}`}><PackagePlus size={22} className="text-blue-500" /></div>
          <div><h1 className="text-xl font-bold">Внесение оборудования</h1><p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Заполните данные</p></div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Инвентарный номер *</label>
            <input type="text" value={form.inventoryNumber} onChange={(e) => setForm({ ...form, inventoryNumber: e.target.value })} placeholder="SRV-001" className={`${inputClass} ${errors.inventoryNumber ? 'border-red-500' : ''}`} />
            {errors.inventoryNumber && <p className="text-red-500 text-xs mt-1">{errors.inventoryNumber}</p>}
          </div>
          <div>
            <label className={labelClass}>Сотрудник *</label>
            <select value={form.broughtBy} onChange={(e) => setForm({ ...form, broughtBy: e.target.value })} className={`${inputClass} ${errors.broughtBy ? 'border-red-500' : ''}`}>
              <option value="">Выберите сотрудника</option>
              {employees.map((emp) => (<option key={emp.id} value={emp.id}>{emp.full_name}</option>))}
            </select>
          </div>
          <div>
            <label className={labelClass}>GLPI заявка</label>
            <input type="text" value={form.glpiTicket} onChange={(e) => setForm({ ...form, glpiTicket: e.target.value })} placeholder="#12345" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Комментарий</label>
            <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Описание" rows={3} className={inputClass} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Внести</button>
            <button type="button" onClick={() => navigate('/equipment')} className={`px-4 py-2.5 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}
