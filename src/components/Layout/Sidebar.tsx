import React, { useState, useRef, useEffect } from 'react';
import { FileText, TrendingUp, LogIn, Bell, Menu, LogOut, Settings, FileCheck, BookOpen, Scroll, Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogin: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogin }) => {
  const { user, logout } = useAuth();
  
  // Utilisation sécurisée du contexte des notifications
  let unreadCount = 0;
  try {
    const notificationContext = useNotifications();
    unreadCount = notificationContext?.unreadCount || 0;
  } catch (error) {
    // Fallback silencieux si le contexte n'est pas disponible
    unreadCount = 0;
  }

  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsBurgerMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Définition des onglets disponibles
  const tabs = [
    { id: 'fiches', label: 'Fiches d\'arrêt', icon: FileText },
    { id: 'publications', label: 'Publications', icon: Edit },
    { id: 'cours', label: 'Cours', icon: BookOpen },
    { id: 'protocole', label: 'Protocole', icon: Scroll },
    { id: 'trending', label: 'Tendances', icon: TrendingUp },
  ];

  const authTabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell, requiresAuth: true },
  ];

  const handleTabClick = (tabId: string, requiresAuth: boolean = false) => {
    if (!user && requiresAuth) {
      onLogin();
      return;
    }
    onTabChange(tabId);
  };

  const handleLogout = () => {
    logout();
    setIsBurgerMenuOpen(false);
    onTabChange('publications'); // Rediriger vers le fil d'actualité après déconnexion
  };

  const handleSettings = () => {
    onTabChange('settings');
    setIsBurgerMenuOpen(false);
  };

  const handleTerms = () => {
    // TODO: Implémenter la navigation vers les conditions d'utilisation
    setIsBurgerMenuOpen(false);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 fixed top-28 left-0 h-[calc(100vh-7rem)] flex flex-col z-30">
      {/* Zone de navigation scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <nav className="space-y-2">
          {/* Onglets principaux */}
          {tabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* Onglets nécessitant une authentification */}
          {authTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id, item.requiresAuth)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors relative ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {/* Badge pour les notifications non lues */}
                {item.id === 'notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Menu burger fixe en bas */}
      <div className="flex-shrink-0 p-6 border-t border-gray-200" ref={menuRef}>
        <div className="relative">
          <button
            onClick={() => setIsBurgerMenuOpen(!isBurgerMenuOpen)}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-700">Menu</span>
          </button>

          {/* Dropdown Menu - S'ouvre vers le haut */}
          {isBurgerMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              {/* Paramètres - Toujours visible */}
              <button
                onClick={handleSettings}
                className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4 text-gray-400" />
                <span>Paramètres</span>
              </button>
              
              {/* Conditions - Toujours visible */}
              <button
                onClick={handleTerms}
                className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileCheck className="h-4 w-4 text-gray-400" />
                <span>Conditions</span>
              </button>
              
              {/* Se déconnecter - Seulement si connecté */}
              {user && (
                <>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Se déconnecter</span>
                  </button>
                </>
              )}
              
              {/* Se connecter - Seulement si non connecté */}
              {!user && (
                <>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => {
                      onLogin();
                      setIsBurgerMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-left text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Se connecter</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
