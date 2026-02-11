import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, plotAPI } from '../api/services';
import Layout from '../components/Layout';

const ProjectStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlot, setSelectedPlot] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectRes, plotsRes] = await Promise.all([
        projectAPI.getById(id),
        plotAPI.getAll({ projectId: id })
      ]);
      setProject(projectRes.data.data);
      setPlots(plotsRes.data.data || []);
    } catch (err) {
      console.error('Data Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    vacant: 'bg-[#CFF75E]', // Balance/Lime
    booked: 'bg-[#FF0000]', // Booked/Red
    sold: 'bg-[#22C55E]',   // Sold/Green
    hold: 'bg-[#1E1B4B]',   // Regi./Dark Blue (Indigo-950)
  };

  if (loading) return <Layout><div className="p-20 text-center font-black uppercase tracking-[0.5em] text-slate-300">Syncing Asset Map...</div></Layout>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4">
        
        {/* Header Unit */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
             <button 
               onClick={() => navigate('/projects')}
               className="px-8 py-3 bg-[#38bdf8] text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
             >
               Back
             </button>
             <div className="flex-1 max-w-md ml-4">
                <div className="relative">
                  <div className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700">
                    {project?.projectName}
                  </div>
                </div>
             </div>
          </div>

          <div className="text-[11px] font-bold text-slate-800 uppercase tracking-tight leading-relaxed">
            Project Name : <span className="font-black text-slate-900 italic underline decoration-blue-500/30 underline-offset-4">{project?.projectName}</span>, 
            Mauja : <span className="font-black">{project?.mauza || 'N/A'}</span>, 
            Khasara : <span className="font-black">{project?.khasara || 'N/A'}</span>, 
            P.H.N. No. : <span className="font-black">{project?.phn || 'N/A'}</span>, 
            Taluka : <span className="font-black">{project?.taluka || 'N/A'}</span>, 
            District : <span className="font-black">{project?.district || 'N/A'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Plot Detail Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-fit">
               <div className="bg-[#E2F0F7] px-6 py-4 text-[#1B315A] font-black text-[11px] uppercase tracking-widest border-b border-[#D0E6F0]">
                 Plot/Unit Detail
               </div>
               <div className="p-6 min-h-[150px]">
                 {selectedPlot ? (
                   <div className="space-y-4 animate-fade-in text-center font-black uppercase tracking-[var(--tracking-tighter)]">
                     <p className="text-4xl italic text-slate-900 leading-none">P-{selectedPlot.plotNumber}</p>
                     <p className="text-[10px] text-slate-400">Inventory Registry Unit</p>
                     <div className="h-px bg-slate-100"></div>
                      <div className="grid grid-cols-2 gap-4 text-left">
                        <div>
                          <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Sq.Ft.</p>
                          <p className="text-lg italic text-slate-800 leading-none mt-1">{selectedPlot.size}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Status</p>
                          <p className={`text-[9px] font-black px-2 py-0.5 rounded-lg inline-block mt-1 ${
                            selectedPlot.status === 'vacant' ? 'bg-lime-100 text-lime-700' :
                            selectedPlot.status === 'booked' ? 'bg-rose-100 text-rose-700' :
                            selectedPlot.status === 'sold' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-indigo-100 text-indigo-700'
                          }`}>
                            {selectedPlot.status}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-50 text-left">
                        <div>
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                             <span className="w-1 h-1 bg-blue-500 rounded-full"></span> Matrix Directions
                           </p>
                           <div className="grid grid-cols-2 gap-2">
                             <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                               <p className="text-[7px] font-bold text-slate-400 uppercase">East</p>
                               <p className="text-[10px] text-slate-700 lowercase italic">{selectedPlot.east || '-'}</p>
                             </div>
                             <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                               <p className="text-[7px] font-bold text-slate-400 uppercase">West</p>
                               <p className="text-[10px] text-slate-700 lowercase italic">{selectedPlot.west || '-'}</p>
                             </div>
                             <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                               <p className="text-[7px] font-bold text-slate-400 uppercase">North</p>
                               <p className="text-[10px] text-slate-700 lowercase italic">{selectedPlot.north || '-'}</p>
                             </div>
                             <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                               <p className="text-[7px] font-bold text-slate-400 uppercase">South</p>
                               <p className="text-[10px] text-slate-700 lowercase italic">{selectedPlot.south || '-'}</p>
                             </div>
                           </div>
                        </div>

                        <div className="bg-[#1B315A] p-5 rounded-[2rem] shadow-lg shadow-blue-900/10 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all"></div>
                           <p className="text-[8px] font-black text-blue-300/60 uppercase tracking-widest mb-1">Asset Valuation</p>
                           <div className="flex items-baseline gap-1">
                              <span className="text-white text-xs font-black">₹</span>
                              <p className="text-2xl font-black text-white italic tracking-tighter leading-none">
                                 {(selectedPlot.size * (selectedPlot.rate || 0)).toLocaleString('en-IN')}
                              </p>
                           </div>
                           <p className="text-[8px] font-black text-emerald-400 mt-2 uppercase tracking-widest border-l-2 border-emerald-400/30 pl-2">
                              decided rate: ₹{selectedPlot.rate || 0} / ft²
                           </p>
                        </div>
                      </div>
                    </div>
                 ) : (
                   <div className="text-slate-300 text-[10px] font-black uppercase text-center py-10 tracking-widest leading-loose italic">
                      NO UNIT<br/>SELECTED<br/>FOR REVIEW
                   </div>
                 )}
               </div>
            </div>
          </div>

          {/* Plot Map Area */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="bg-[#E2F0F7] px-6 py-4 text-[#1B315A] font-black text-[11px] uppercase tracking-widest border-b border-[#D0E6F0]">
                 Plot/Unit Position
               </div>
               
               <div className="p-8">
                 {/* Legend */}
                 <div className="grid grid-cols-4 w-full mb-10 overflow-hidden rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_#1e293b]">
                    <div className="bg-[#CFF75E] py-3 text-center text-[10px] font-black text-slate-800 uppercase italic border-r-2 border-slate-900 shadow-inner">Balance</div>
                    <div className="bg-[#FF0000] py-3 text-center text-[10px] font-black text-white uppercase italic border-r-2 border-slate-900 shadow-inner">Booked</div>
                    <div className="bg-[#22C55E] py-3 text-center text-[10px] font-black text-white uppercase italic border-r-2 border-slate-900 shadow-inner">Sold</div>
                    <div className="bg-[#1E1B4B] py-3 text-center text-[10px] font-black text-white uppercase italic shadow-inner">Regi.</div>
                 </div>

                 {/* Grid */}
                 <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-5">
                    {plots.map((plot) => (
                      <div 
                        key={plot._id}
                        onClick={() => setSelectedPlot(plot)}
                        className={`${statusColors[plot.status] || 'bg-slate-200'} p-0 rounded-none border-2 border-slate-900 shadow-[3px_3px_0px_#000] cursor-pointer hover:translate-y-[-3px] hover:translate-x-[-3px] hover:shadow-[6px_6px_0px_#000] transition-all flex flex-col items-center justify-between min-h-[90px] group overflow-hidden`}
                      >
                         <div className="w-full text-center py-1.5 border-b-2 border-slate-900/20">
                            <span className={`text-sm font-black italic ${plot.status === 'vacant' ? 'text-slate-900' : 'text-white'}`}>
                              {plot.plotNumber}
                            </span>
                         </div>
                         <div className="flex-1 flex flex-col items-center justify-center py-2">
                            <span className={`text-[11px] font-black uppercase tracking-tighter italic ${plot.status === 'vacant' ? 'text-slate-900' : 'text-white'}`}>
                              {plot.size}
                            </span>
                            <span className={`text-[7px] font-black uppercase tracking-widest ${plot.status === 'vacant' ? 'text-slate-900/60' : 'text-white/60'}`}>
                              Sq.Ft.
                            </span>
                         </div>
                      </div>
                    ))}
                 </div>

                 {plots.length === 0 && (
                   <div className="py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.4em] italic">
                     Satellite Disconnected : No Assets Found
                   </div>
                 )}
               </div>

               <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center px-8">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Calculated by Enterprise Asset Matrix</p>
                  <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] italic">Dange Associates Official Repository</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectStatus;
