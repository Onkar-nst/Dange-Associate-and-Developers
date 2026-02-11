import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, plotAPI } from '../api/services';
import logo from '../assets/logo.png';

const PublicProjectStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [showInquiry, setShowInquiry] = useState(false);

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
    hold: 'bg-[#1E1B4B]',   // Regi./Dark Blue
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center font-black uppercase text-slate-700 tracking-[0.5em] animate-pulse">
        CALIBRATING SAT-MAP...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Public Navbar */}
      <nav className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-8 md:px-16 sticky top-0 z-50">
        <div className="flex items-center gap-4">
             <img src={logo} alt="DA" className="h-16 w-auto" />
             <p className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-900 hidden md:block border-l-2 border-slate-100 pl-4 ml-2">Inventory Navigator</p>
        </div>
        <div className="flex items-center gap-6">
            <button 
                onClick={() => navigate('/explore')}
                className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors"
            >
                Portfolio
            </button>
            <button 
                onClick={() => setShowInquiry(true)}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/10 hover:bg-slate-900 transition-all active:scale-95"
            >
                Book Now / Enquire
            </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto space-y-6 py-12 px-4 md:px-8">
        
        {/* Header Unit */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div>
                <h1 className="text-4xl font-black text-slate-900 uppercase italic leading-none tracking-tighter">
                   {project?.projectName}
                </h1>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                    <span>🏢</span> PROJECT HUB <span className="opacity-20">|</span> 🛰️ LIVE SATELLITE MAP
                </p>
             </div>
             <div className="px-6 py-2 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                Currently {project?.status} for booking
             </div>
          </div>

          <div className="relative z-10 text-[11px] font-black text-slate-800 uppercase tracking-tight leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100 border-l-8 border-l-blue-500">
            Mauja : <span className="text-slate-500">{project?.mauza || 'N/A'}</span> <span className="mx-2 text-slate-200">|</span> 
            Khasara : <span className="text-slate-500">{project?.khasara || 'N/A'}</span> <span className="mx-2 text-slate-200">|</span> 
            P.H.N. No. : <span className="text-slate-500">{project?.phn || 'N/A'}</span> <span className="mx-2 text-slate-200">|</span> 
            Taluka : <span className="text-slate-500">{project?.taluka || 'N/A'}</span> <span className="mx-2 text-slate-200">|</span> 
            District : <span className="text-slate-500 text-blue-600 italic tracking-widest">{project?.district || 'N/A'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Plot Detail Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-fit sticky top-32 transition-all duration-500 border-t-8 border-t-[#F38C32]">
               <div className="bg-[#E2F0F7] px-6 py-4 text-[#1B315A] font-black text-[11px] uppercase tracking-widest border-b border-[#D0E6F0]">
                 Asset Specifications
               </div>
               <div className="p-8 min-h-[150px]">
                 {selectedPlot ? (
                   <div className="space-y-6 animate-fade-in text-center font-black uppercase">
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-4xl italic text-slate-900 leading-none">P-{selectedPlot.plotNumber}</p>
                        <p className="text-[10px] text-slate-400 mt-2">UNIT IDENTIFIER</p>
                     </div>
                     <div className="h-px bg-slate-100"></div>
                     <div className="grid grid-cols-1 gap-6 text-center">
                        <div>
                          <p className="text-[8px] text-slate-400 tracking-[0.2em] mb-1">TOTAL DEVELOPED AREA</p>
                          <p className="text-2xl italic text-blue-600 font-black leading-none">{selectedPlot.size} <span className="text-[10px] text-slate-400">SQFT</span></p>
                        </div>

                        {/* Directions Matrix */}
                        <div className="pt-4 border-t border-slate-50 text-left">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span> Matrix Boundaries
                           </p>
                           <div className="grid grid-cols-2 gap-2">
                             {[
                               { label: 'East', val: selectedPlot.east },
                               { label: 'West', val: selectedPlot.west },
                               { label: 'North', val: selectedPlot.north },
                               { label: 'South', val: selectedPlot.south }
                             ].map((dir, i) => (
                               <div key={i} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 group">
                                 <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{dir.label}</p>
                                 <p className="text-[10px] text-slate-800 font-black truncate">{dir.val || '-'}</p>
                               </div>
                             ))}
                           </div>
                        </div>

                        {/* Valuation Logic */}
                        <div className="bg-[#1B315A] p-6 rounded-[2.5rem] shadow-xl shadow-blue-900/10 relative overflow-hidden group text-left border border-white/5">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-125 transition-transform"></div>
                           <p className="text-[8px] font-black text-blue-300/60 uppercase tracking-widest mb-1 relative z-10">Unit Valuation</p>
                           <div className="flex items-baseline gap-1 relative z-10">
                              <span className="text-white text-sm font-black">₹</span>
                              <p className="text-2xl font-black text-white italic tracking-tighter leading-none">
                                {(selectedPlot.size * (selectedPlot.rate || 0)).toLocaleString('en-IN')}
                              </p>
                           </div>
                           <p className="text-[8px] font-black text-emerald-400 mt-3 uppercase tracking-widest border-l-2 border-emerald-400/30 pl-2 relative z-10">
                              Standard Rate: ₹{selectedPlot.rate || 0}/Ft²
                           </p>
                        </div>

                        <div className="pt-2">
                          <p className={`text-[10px] font-black px-8 py-2.5 rounded-full inline-block border-2 shadow-sm ${
                            selectedPlot.status === 'vacant' ? 'bg-lime-50 text-lime-700 border-lime-200' :
                            selectedPlot.status === 'booked' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            selectedPlot.status === 'sold' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {selectedPlot.status === 'vacant' ? 'AVAILABLE FOR POSSESSION' : selectedPlot.status}
                          </p>
                        </div>
                        {selectedPlot.status === 'vacant' && (
                            <button 
                                onClick={() => setShowInquiry(true)}
                                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl active:scale-95 group flex items-center justify-center gap-3"
                            >
                                Secure This Unit <span className="group-hover:translate-x-2 transition-transform">➔</span>
                            </button>
                        )}
                      </div>
                   </div>
                 ) : (
                   <div className="text-slate-300 text-[10px] font-black uppercase text-center py-12 tracking-widest leading-loose italic">
                      SYSTEM READY<br/>
                      <span className="text-blue-200">PLEASE SELECT A UNIT</span><br/>
                      TO VIEW DETAILS
                   </div>
                 )}
               </div>
            </div>
          </div>

          {/* Plot Map Area */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden border-t-8 border-t-slate-800">
               <div className="bg-slate-900 px-8 py-4 text-white font-black text-[11px] uppercase tracking-[0.2em] flex justify-between items-center">
                 <span>Geospatial Identity Layout</span>
                 <span className="text-blue-400 italic">V.{project?.projectCode}</span>
               </div>
               
               <div className="p-10">
                 {/* Legend */}
                 <div className="grid grid-cols-4 w-full mb-12 overflow-hidden rounded-2xl border-2 border-slate-900 shadow-[6px_6px_0px_#1e293b]">
                    <div className="bg-[#CFF75E] py-4 text-center text-[10px] font-black text-slate-800 uppercase italic border-r-2 border-slate-900">Available</div>
                    <div className="bg-[#FF0000] py-4 text-center text-[10px] font-black text-white uppercase italic border-r-2 border-slate-900">Booked</div>
                    <div className="bg-[#22C55E] py-4 text-center text-[10px] font-black text-white uppercase italic border-r-2 border-slate-900">Sold</div>
                    <div className="bg-[#1E1B4B] py-4 text-center text-[10px] font-black text-white uppercase italic">Registry</div>
                 </div>

                 {/* Grid */}
                 <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-7 gap-6">
                    {plots.map((plot) => (
                      <div 
                        key={plot._id}
                        onClick={() => setSelectedPlot(plot)}
                        className={`${statusColors[plot.status] || 'bg-slate-200'} p-0 rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_#000] cursor-pointer hover:translate-y-[-4px] hover:translate-x-[-4px] hover:shadow-[8px_8px_0px_#000] transition-all flex flex-col items-center justify-between min-h-[100px] group overflow-hidden`}
                      >
                         <div className="w-full text-center py-2 border-b-2 border-slate-900/10">
                            <span className={`text-base font-black italic ${plot.status === 'vacant' ? 'text-slate-900' : 'text-white'}`}>
                              {plot.plotNumber}
                            </span>
                         </div>
                         <div className="flex-1 flex flex-col items-center justify-center py-2">
                            <span className={`text-[12px] font-black uppercase tracking-tighter italic ${plot.status === 'vacant' ? 'text-slate-900' : 'text-white'}`}>
                              {plot.size}
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${plot.status === 'vacant' ? 'text-slate-900/60' : 'text-white/60'}`}>
                              Sq.Ft.
                            </span>
                         </div>
                      </div>
                    ))}
                 </div>

                 {plots.length === 0 && (
                   <div className="py-24 text-center text-slate-200 font-black uppercase text-[12px] tracking-[0.5em] italic">
                     Satellite Synchronizing... No Units Configured
                   </div>
                 )}
               </div>

               <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-Time Inventory Status Feed</p>
                  </div>
                  <button 
                    onClick={() => setShowInquiry(true)}
                    className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:text-slate-900 transition-colors"
                  >
                    Contact Corporate Hub for Reservations ➔
                  </button>
               </div>
            </div>
          </div>
        </div>

        {/* Inquiry Overlay */}
        {showInquiry && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 animate-fade-in">
                <div className="bg-white rounded-[3rem] p-12 max-w-xl w-full shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    
                    <div className="relative space-y-8">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Executive Inquiry</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Corporate Reservation Protocol</p>
                            </div>
                            <button onClick={() => setShowInquiry(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">✕</button>
                        </div>

                        <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100 space-y-4">
                            <h3 className="text-[11px] font-black text-[#1B315A] uppercase tracking-widest">Direct Communication Matrix</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-blue-200/50 shadow-sm">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Primary Hotline</span>
                                    <span className="text-sm font-black text-slate-900">+91 [CORPORATE NUMBER]</span>
                                </div>
                                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-blue-200/50 shadow-sm">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Office Protocol</span>
                                    <span className="text-sm font-black text-slate-900">Nagpur HQ District</span>
                                </div>
                            </div>
                            <p className="text-[9px] font-bold text-[#1B315A]/60 uppercase text-center leading-relaxed">
                                Quote Project Code: <span className="text-[#1B315A] font-black">{project?.projectCode}</span> {selectedPlot ? `and Plot Unit: ${selectedPlot.plotNumber}` : ''}
                            </p>
                        </div>

                        <button 
                            onClick={() => setShowInquiry(false)}
                            className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95"
                        >
                            Return To Inventory Navigator
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
      
      {/* Global Footer */}
      <footer className="py-20 bg-slate-100 flex flex-col items-center gap-6 border-t border-slate-200">
         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md font-black text-xs text-slate-900">DA</div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Official Corporate Repository © 2026 Dange Associates</p>
      </footer>
    </div>
  );
};

export default PublicProjectStatus;
