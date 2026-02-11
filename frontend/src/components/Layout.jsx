import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../api/services';
import Sidebar from './Sidebar';
import logo from '../assets/logo.png';

const Layout = ({ children, hideFooter }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  // Fetch on mount + poll every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowPanel(!showPanel);
    if (!showPanel) fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationAPI.delete(id);
      const deleted = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (deleted && !deleted.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden font-jakarta">
      
      {/* Sidebar - Modernized */}
      <Sidebar />

      {/* Primary Content Matrix */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Cinematic Navigation Head */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0 sticky top-0 z-40 backdrop-blur-xl bg-white/80">
          <div className="flex items-center gap-8">
            <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#F38C32] transition-all shadow-lg shadow-slate-900/10"
            >
                <span>🏠</span> Home
            </button>

            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operative</span>
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                {user?.userId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <div className="hidden lg:flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">System Pulse</span>
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>

              {/* Notification Bell */}
              <div className="relative" ref={panelRef}>
                <button 
                  onClick={handleBellClick}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition-all cursor-pointer relative ${showPanel ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-900 hover:text-white'}`}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-lg shadow-rose-500/30 animate-bounce">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Panel */}
                {showPanel && (
                  <div className="absolute right-0 top-14 w-[420px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-fade-in">
                    
                    {/* Panel Header */}
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Notifications</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-100"
                        >
                          ✓ Mark All Read
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                      {notifications.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-3 opacity-40">
                          <span className="text-4xl grayscale">🔕</span>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Notifications Yet</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n._id} 
                            className={`group flex items-start gap-4 px-6 py-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                            onClick={() => !n.isRead && handleMarkRead(n._id)}
                          >
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${!n.isRead ? 'bg-blue-100' : 'bg-slate-100'}`}>
                              {n.icon || '🔔'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-[11px] font-black uppercase tracking-tight truncate ${!n.isRead ? 'text-slate-900' : 'text-slate-500'}`}>
                                  {n.title}
                                </p>
                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                              </div>
                              <p className={`text-[10px] mt-0.5 leading-relaxed truncate ${!n.isRead ? 'font-bold text-slate-600' : 'font-medium text-slate-400'}`}>
                                {n.message}
                              </p>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }}
                              className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-500 flex items-center justify-center text-slate-400 text-[10px] transition-all shrink-0 mt-1"
                            >
                              ✕
                            </button>
                            {!n.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <button 
                onClick={handleLogout}
                className="group flex items-center gap-3 px-6 py-2.5 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-rose-500/5"
            >
                <span className="group-hover:animate-bounce">🚪</span> Secure Exit
            </button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-10 scrollbar-hide">
            {children || <Outlet />}
            
            {/* Terminal Footer */}
            {!hideFooter && (
              <footer className="mt-20 pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 pb-12 opacity-50">
                <div className="flex items-center gap-4">
                  <img src={logo} alt="Logo" className="w-8 h-auto" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Integrated Real Estate Intelligence System © 2026</p>
                </div>
                <div className="flex gap-6">
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2"><span>🛡️</span> SSL ENCRYPTED</span>
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2"><span>⚡</span> LATENCY: 14MS</span>
                </div>
              </footer>
            )}
        </main>
      </div>
    </div>
  );
};

export default Layout;
