import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import logo from '../assets/logo.png';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex overflow-hidden font-jakarta">
      
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
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-lg hover:bg-slate-900 hover:text-white transition-all cursor-pointer">
                🔔
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

        {/* Global Action Banner (Optional for alerts) */}
        {/* <div className="mx-10 mt-6 p-4 bg-blue-900 rounded-3xl text-white flex items-center justify-between shadow-2xl shadow-blue-900/10">...</div> */}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-10 scrollbar-hide">
            {children}
            
            {/* Terminal Footer */}
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
        </main>
      </div>
    </div>
  );
};

export default Layout;
