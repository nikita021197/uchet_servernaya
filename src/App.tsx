import { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeMode, Notification } from './types';
import { getTheme, setTheme } from './store';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/EquipmentList';
import EquipmentNew from './pages/EquipmentNew';
import EquipmentDetail from './pages/EquipmentDetail';
import Employees from './pages/Employees';
import DataPage from './pages/DataPage';
import StatsPage from './pages/StatsPage';
import LogsPage from './pages/LogsPage';
import {
  LayoutDashboard,
  Package,
  Users,
  Database,
  BarChart3,
  ScrollText,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';

function AppContent() {
  const [theme, setThemeState] = useState<ThemeMode>(getTheme());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const location = useLocation();

  // App initialized

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    setTheme(theme);
  }, [theme]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addNotification = useCallback((type: Notification['type'], message: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const navItems = [
    { path: '/', label: 'Главная', icon: LayoutDashboard },
    { path: '/equipment', label: 'Оборудование', icon: Package },
    { path: '/employees', label: 'Сотрудники', icon: Users },
    { path: '/data', label: 'Данные', icon: Database },
    { path: '/stats', label: 'Статистика', icon: BarChart3 },
    { path: '/logs', label: 'Журнал', icon: ScrollText },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Mobile header */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="font-semibold text-sm">Учёт оборудования</span>
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-full w-64 transform transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r`}>
        <div className="flex flex-col h-full">
          <div className={`h-14 flex items-center px-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <span className="text-lg">🖥️</span>
            <span className="ml-2 font-bold text-sm">Серверная комната</span>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? theme === 'dark'
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'bg-blue-50 text-blue-700'
                      : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon size={18} />
                  <span className="ml-3">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className={`p-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={toggleTheme}
              className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                theme === 'dark'
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span className="ml-3">{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard theme={theme} addNotification={addNotification} />} />
            <Route path="/equipment" element={<EquipmentList theme={theme} addNotification={addNotification} />} />
            <Route path="/equipment/new" element={<EquipmentNew theme={theme} addNotification={addNotification} />} />
            <Route path="/equipment/:id" element={<EquipmentDetail theme={theme} addNotification={addNotification} />} />
            <Route path="/employees" element={<Employees theme={theme} addNotification={addNotification} />} />
            <Route path="/data" element={<DataPage theme={theme} addNotification={addNotification} />} />
            <Route path="/stats" element={<StatsPage theme={theme} />} />
            <Route path="/logs" element={<LogsPage theme={theme} />} />
          </Routes>
        </div>
      </main>

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-slide-in max-w-sm ${
              n.type === 'success' ? 'bg-green-500 text-white' :
              n.type === 'error' ? 'bg-red-500 text-white' :
              n.type === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
