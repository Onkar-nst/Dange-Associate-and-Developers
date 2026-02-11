import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { plotAPI } from '../api/services';
import Layout from '../components/Layout';

const SalesPositionDetailed = () => {
    const { projectId } = useParams();
    const [searchParams] = useSearchParams();
    const projectName = searchParams.get('name') || 'Project';
    const [plots, setPlots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlots();
    }, [projectId]);

    const fetchPlots = async () => {
        setLoading(true);
        try {
            const res = await plotAPI.getAll({ projectId });
            setPlots(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'available': return {
                card: 'bg-emerald-50 border-emerald-100 text-emerald-800 hover:bg-emerald-100 shadow-emerald-500/5',
                badge: 'bg-emerald-600 text-white',
                icon: '⭕'
            };
            case 'booked': return {
                card: 'bg-amber-50 border-amber-100 text-amber-800 hover:bg-amber-100 shadow-amber-500/5',
                badge: 'bg-amber-600 text-white',
                icon: '⏳'
            };
            case 'sold': return {
                card: 'bg-rose-50 border-rose-100 text-rose-800 hover:bg-rose-100 shadow-rose-500/5',
                badge: 'bg-rose-600 text-white',
                icon: '✅'
            };
            default: return {
                card: 'bg-slate-50 border-slate-100 text-slate-800',
                badge: 'bg-slate-600 text-white',
                icon: '❓'
            };
        }
    };

    const StatusItem = ({ label, color, count }) => (
        <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className={`w-3 h-3 rounded-full ${color}`}></div>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{label}</span>
            <span className="ml-2 py-0.5 px-2 bg-slate-50 rounded-lg text-[10px] font-black text-slate-800">{count}</span>
        </div>
    );

    if (loading && plots.length === 0) return <div className="flex items-center justify-center min-h-[400px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Mapping Plot Matrix...</div>;

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-fade-in px-6 pb-20">
                
                {/* Header Intelligence */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center text-2xl font-black shadow-2xl">🌍</div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Sales Landscape</h1>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mt-2 italic px-2 py-0.5 bg-blue-50 rounded-md w-fit">Venture: {projectName}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                        <StatusItem label="Inventory" color="bg-emerald-500" count={plots.filter(p => p.status === 'available').length} />
                        <StatusItem label="Reservation" color="bg-amber-500" count={plots.filter(p => p.status === 'booked').length} />
                        <StatusItem label="Finalized" color="bg-rose-500" count={plots.filter(p => p.status === 'sold').length} />
                    </div>
                </div>

                {/* Plot Grid Visualization */}
                <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    
                    <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 xxl:grid-cols-10 gap-6">
                        {plots.map((plot) => {
                            const styles = getStatusStyles(plot.status);
                            return (
                                <div 
                                    key={plot._id}
                                    className={`relative group p-6 rounded-[2rem] border-2 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 flex flex-col items-center justify-between min-h-[160px] ${styles.card}`}
                                >
                                    <div className="absolute top-4 right-4 text-sm opacity-20 group-hover:opacity-100 transition-opacity">
                                        {styles.icon}
                                    </div>
                                    
                                    <div className="text-center w-full">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Unit ID</p>
                                        <h3 className="text-3xl font-black tracking-tighter group-hover:scale-110 transition-transform">{plot.plotNumber}</h3>
                                    </div>
                                    
                                    <div className="w-full space-y-3">
                                        <div className="h-px w-full bg-current opacity-10"></div>
                                        <div className="flex flex-col items-center gap-2">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm ${styles.badge}`}>
                                                {plot.status}
                                            </span>
                                            {plot.size && (
                                                <span className="text-[9px] font-black font-mono opacity-50 italic">
                                                    {plot.size} <span className="text-[7px]">SQFT</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Action Hover */}
                                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 rounded-[2rem] transition-all"></div>
                                </div>
                            );
                        })}
                    </div>

                    {plots.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-slate-100 rounded-[3rem] animate-fade-in">
                            <div className="text-7xl mb-6 grayscale opacity-10">🏕️</div>
                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em]">No Unit Mapping Found for this Territory</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-center gap-10 pt-10 border-t border-slate-50">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">📊</span>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-tighter">Inventory Density</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Global Portfolio Coverage: 88%</span>
                        </div>
                    </div>
                </div>

                <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pb-10">Dange Associates Spatial Intelligence © 2026</p>
            </div>
    );
};

export default SalesPositionDetailed;
