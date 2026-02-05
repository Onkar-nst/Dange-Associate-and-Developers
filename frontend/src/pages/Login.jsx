import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[160px] -mr-96 -mt-96 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px] -ml-64 -mb-64 animate-pulse delay-700"></div>
      
      <div className="relative z-10 w-full max-w-[480px] p-4">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-12 shadow-2xl space-y-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-white/10 transition-all duration-700"></div>
            
            <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.5rem] bg-blue-600 text-white text-3xl font-black mb-4 shadow-2xl shadow-blue-500/20">
                    DA
                </div>
                <h1 className="text-2xl font-black text-white tracking-widest uppercase">
                    Dange Associates
                </h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                    Enterprise Management Portal
                </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <span>🔑</span> Operator ID
                        </label>
                        <input
                            type="text"
                            value={credentials.userId}
                            onChange={(e) => setCredentials({ ...credentials, userId: e.target.value })}
                            className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-black text-white text-sm transition-all focus:bg-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 placeholder:text-slate-600"
                            placeholder="Enter system identifier"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <span>🛡️</span> Security Token
                        </label>
                        <input
                            type="password"
                            value={credentials.password}
                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-black text-white text-sm transition-all focus:bg-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 placeholder:text-slate-600"
                            placeholder="Enter access code"
                            required
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                        ⚠️ {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-slate-950 py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-white/5 hover:bg-blue-600 hover:text-white transition-all duration-500 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                            Authenticating...
                        </>
                    ) : (
                        <>Authorize Access ➔</>
                    )}
                </button>
            </form>

                <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-4 text-slate-600">
                        <div className="h-px w-8 bg-white/5"></div>
                        <p className="text-[9px] font-black uppercase tracking-widest">Public Engagement</p>
                        <div className="h-px w-8 bg-white/5"></div>
                    </div>
                    
                    <button 
                        onClick={() => navigate('/explore')}
                        className="w-full bg-blue-600/10 border border-blue-500/20 text-blue-400 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-600 hover:text-white transition-all duration-500 active:scale-95 flex items-center justify-center gap-3 group"
                    >
                        <span>🗺️</span> Explore Ventures / Booking
                        <span className="group-hover:translate-x-1 transition-transform">➔</span>
                    </button>

                    <div className="px-6 py-3 bg-white/5 border border-white/5 rounded-xl mt-2">
                        <p className="text-[10px] font-black text-slate-500 tracking-tighter uppercase">
                            Authorized Personnel Only <span className="text-white/10 mx-2">|</span> ID Required
                        </p>
                    </div>
                </div>
        </div>
        
        <p className="mt-12 text-center text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] opacity-40">
            Secure Infrastructure © 2026 Dange Associates
        </p>
      </div>
    </div>
  );
};

export default Login;
