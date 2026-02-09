import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import loginBg from '../assets/login_bg.png';

const Login = () => {
  const [credentials, setCredentials] = useState({ userId: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(credentials);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication sequence failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Cinematic Background Layer */}
      <div 
        className="absolute inset-0 z-0 scale-105 animate-slow-zoom"
        style={{ 
          backgroundImage: `url(${loginBg})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          filter: 'brightness(0.4) contrast(1.1)'
        }}
      />
      
      {/* Overlay Gradients for Depth */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-tr from-[#0f172a] via-transparent to-[#0f172a]/40"></div>
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0f172a]/20 to-[#0f172a]/60"></div>

      <div className="relative z-10 w-full max-w-[500px] p-6">
        {/* Main Glass Card */}
        <div className="bg-white/[0.03] backdrop-blur-[40px] border border-white/10 rounded-[3.5rem] p-10 md:p-14 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] space-y-10 relative overflow-hidden group">
            {/* Top Shine Effect */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            
            {/* Logo & Branding */}
            <div className="text-center space-y-4 animate-fade-in-up">
                <div className="inline-block p-4 bg-white/5 rounded-3xl backdrop-blur-md border border-white/10 mb-2 group-hover:scale-105 transition-transform duration-700">
                    <img src={logo} alt="Logo" className="w-40 h-auto" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                        Dange Associates
                    </h1>
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <span className="h-px w-6 bg-blue-500/50"></span>
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.4em]">
                            Enterprise Portal
                        </p>
                        <span className="h-px w-6 bg-blue-500/50"></span>
                    </div>
                </div>
            </div>
            
            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                    <div className="group/input space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Operator Identifier
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={credentials.userId}
                                onChange={(e) => setCredentials({ ...credentials, userId: e.target.value })}
                                className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white text-sm transition-all focus:bg-white/[0.08] focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-600"
                                placeholder="Enter system ID"
                                required
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-blue-500 transition-colors">
                                👤
                            </div>
                        </div>
                    </div>

                    <div className="group/input space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                            Security Token
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white text-sm transition-all focus:bg-white/[0.08] focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-600"
                                placeholder="Enter access code"
                                required
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-blue-500 transition-colors">
                                🛡️
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-shake backdrop-blur-md">
                        ⚠️ Validation Error: {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full group/btn relative bg-white text-[#0f172a] py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-[#F38C32] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative z-10 flex items-center justify-center gap-3 group-hover/btn:text-white transition-colors duration-500">
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                Establishing Link...
                            </>
                        ) : (
                            <>Authorize Session ➔</>
                        )}
                    </span>
                </button>
            </form>

            {/* Public Section Divider */}
            <div className="pt-8 border-t border-white/5 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/5"></div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Client Interface</p>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/5"></div>
                </div>
                
                <button 
                    onClick={() => navigate('/explore')}
                    className="w-full bg-white/5 border border-white/10 text-slate-300 py-5 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] hover:bg-white hover:text-[#0f172a] hover:border-white transition-all duration-500 flex items-center justify-center gap-3 group/public shadow-lg"
                >
                    <span className="group-hover/public:animate-pulse">🗺️</span> Venture Portfolio Registry
                    <span className="group-hover/public:translate-x-1 transition-transform">➔</span>
                </button>
            </div>
        </div>
        
        {/* System Footer Metadata */}
        <div className="mt-8 flex flex-col items-center gap-4 animate-fade-in opacity-40">
            <div className="flex items-center gap-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-2"><span className="w-1 h-1 bg-emerald-500 rounded-full"></span> 256-bit Encrypted</span>
                <span className="flex items-center gap-2"><span className="w-1 h-1 bg-blue-500 rounded-full"></span> Tier-3 Data Core</span>
            </div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em]">
                Secure Infrastructure © 2026 Dange Associates
            </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slow-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-slow-zoom { animation: slow-zoom 20s infinite alternate ease-in-out; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        .animate-fade-in { animation: fade-in 1.2s ease-out forwards; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}} />
    </div>
  );
};

export default Login;
