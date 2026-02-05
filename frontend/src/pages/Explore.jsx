import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../api/services';

const Explore = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll({ active: true });
      setProjects(response.data.data || []);
    } catch (err) {
      console.error('Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center font-black uppercase text-slate-700 tracking-[0.5em] animate-pulse">
        Initializing Global Portfolio...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 md:p-16">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Public Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b-2 border-slate-100 pb-12">
            <div className="text-center md:text-left">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                    Dange Associates<br/>
                    <span className="text-blue-600 text-5xl">Venture Explorer</span>
                </h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-4">
                    Public Inventory Registry & Real Estate Assets
                </p>
            </div>
            <button 
                onClick={() => navigate('/login')}
                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-slate-200"
            >
                Staff Portal Login
            </button>
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {projects.map((project) => (
               <div key={project._id} className="group relative bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700 overflow-hidden flex flex-col h-full border-t-8 border-t-blue-500">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-900 rounded-bl-[3rem] flex items-center justify-center -mr-4 -mt-4 p-6 shadow-2xl">
                     <span className="text-white text-[10px] font-black italic tracking-tighter">{project.projectCode}</span>
                  </div>

                  <div className="mb-8 space-y-2">
                     <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Active Venture</p>
                     <h3 className="text-2xl font-black text-slate-900 uppercase italic leading-tight group-hover:text-blue-700 transition-colors">
                        {project.projectName}
                     </h3>
                  </div>

                  <div className="flex-1 space-y-6">
                     <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-lg">📍</div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                           <p className="text-[12px] font-black text-slate-700 uppercase italic">{project.mauza}, {project.taluka}</p>
                           <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">{project.district}</p>
                        </div>
                     </div>

                     <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                        <div className="flex justify-between items-center">
                           <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Inventory Size</p>
                              <p className="text-xl font-black text-slate-900 italic">{project.totalPlots} <span className="text-[9px] text-slate-400">PLOTS</span></p>
                           </div>
                           <div className="text-right">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                              <p className="text-[10px] font-black text-emerald-600 uppercase italic">{project.status}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <button 
                     onClick={() => navigate(`/explore/${project._id}`)}
                     className="mt-10 w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-[#F38C32] transition-all shadow-xl shadow-slate-100 group-hover:scale-[1.02]"
                  >
                     Explore Inventory ➔
                  </button>
               </div>
            ))}
        </div>

        {/* Public Footer */}
        <div className="pt-20 border-t border-slate-100 text-center space-y-4">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
                Dange Associates & Developers Official Registry
            </p>
            <div className="flex justify-center gap-10">
                <div className="text-center">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Inquiry Hotline</p>
                    <p className="text-[10px] font-black text-slate-900">+91 [CONTACT]</p>
                </div>
                <div className="text-center">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Corporate Suite</p>
                    <p className="text-[10px] font-black text-slate-900">NAGPUR, INDIA</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;
