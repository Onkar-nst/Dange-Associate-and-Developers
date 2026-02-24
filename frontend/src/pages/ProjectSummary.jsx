import React, { useState, useEffect } from 'react';
import { reportAPI, projectAPI } from '../api/services';

const ProjectSummary = () => {
    const [data, setData] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ projectId: '' });

    useEffect(() => {
        fetchProjects();
        fetchReport();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await projectAPI.getAll();
            setProjects(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await reportAPI.getUnitCalculation(filters);
            setData(res.data.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

    const totals = data.reduce((acc, d) => ({
        totalPlots: acc.totalPlots + d.totalPlots,
        totalArea: acc.totalArea + (d.totalArea || 0),
        soldPlots: acc.soldPlots + d.soldPlots,
        bookedPlots: acc.bookedPlots + d.bookedPlots,
        availablePlots: acc.availablePlots + d.availablePlots,
        soldArea: acc.soldArea + (d.soldArea || 0),
        availableArea: acc.availableArea + (d.availableArea || 0),
        totalDealValue: acc.totalDealValue + (d.totalDealValue || 0),
        totalReceived: acc.totalReceived + (d.totalReceived || 0),
        totalOutstanding: acc.totalOutstanding + (d.totalOutstanding || 0)
    }), { totalPlots: 0, totalArea: 0, soldPlots: 0, bookedPlots: 0, availablePlots: 0, soldArea: 0, availableArea: 0, totalDealValue: 0, totalReceived: 0, totalOutstanding: 0 });

    const Label = ({ children, icon }) => (
        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-2">
            <span>{icon}</span> {children}
        </label>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 animate-fade-in px-4 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3">
                        <span>🏢</span> Project Summary
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Project-wise Unit & Area Statistics</p>
                </div>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl shadow-blue-900/10 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <div>
                        <Label icon="🏢">Project</Label>
                        <select name="projectId" value={filters.projectId} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-4 font-black text-[11px] uppercase">
                            <option value="" className="text-slate-800">ALL PROJECTS</option>
                            {projects.map(p => <option key={p._id} value={p._id} className="text-slate-800">{p.projectName}</option>)}
                        </select>
                    </div>
                    <button onClick={fetchReport} className="btn-primary w-full !py-4 rounded-[2rem] uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 text-[11px] font-black flex items-center justify-center gap-3">
                        📐 Calculate Units
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {data.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Units</p>
                        <p className="text-2xl font-black text-slate-800 mt-1">{totals.totalPlots}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Sold</p>
                        <p className="text-2xl font-black text-emerald-700 mt-1">{totals.soldPlots}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-blue-100 shadow-sm">
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Booked</p>
                        <p className="text-2xl font-black text-blue-700 mt-1">{totals.bookedPlots}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available</p>
                        <p className="text-2xl font-black text-slate-700 mt-1">{totals.availablePlots}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm">
                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Outstanding</p>
                        <p className="text-lg font-black text-rose-700 mt-1">₹{(totals.totalOutstanding / 100000).toFixed(2)}L</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden min-h-[300px]">
                <div className="overflow-x-auto">
                    <table className="modern-table border !border-slate-50 min-w-[1000px]">
                        <thead>
                            <tr>
                                <th className="w-10 pl-6 text-center py-2">#</th>
                                <th className="py-2">Project Name</th>
                                <th className="text-center py-2">Units</th>
                                <th className="text-right py-2">Total Area</th>
                                <th className="text-center text-emerald-600 py-2">Sold</th>
                                <th className="text-center text-blue-600 py-2">Booked</th>
                                <th className="text-center py-2">Avail</th>
                                <th className="text-right py-2">Sold Area</th>
                                <th className="text-right py-2">Avail Area</th>
                                <th className="text-right py-2">Deal Val</th>
                                <th className="text-right text-emerald-600 py-2">Rec.</th>
                                <th className="text-right text-rose-600 pr-6 py-2">O/S</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((r, i) => (
                                <tr key={i} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                                    <td className="pl-6 text-center font-bold text-slate-300">{i + 1}</td>
                                    <td className="font-black text-slate-800 uppercase tracking-tight text-[10px]">{r.projectName}</td>
                                    <td className="text-center font-black text-slate-900">{r.totalPlots}</td>
                                    <td className="text-right text-slate-400 font-mono text-[10px]">{(r.totalArea || 0).toLocaleString('en-IN')}</td>
                                    <td className="text-center font-black text-emerald-600">{r.soldPlots}</td>
                                    <td className="text-center font-black text-blue-600">{r.bookedPlots}</td>
                                    <td className="text-center font-black text-slate-500">{r.availablePlots}</td>
                                    <td className="text-right text-emerald-500 font-mono text-[10px]">{(r.soldArea || 0).toLocaleString('en-IN')}</td>
                                    <td className="text-right text-slate-400 font-mono text-[10px]">{(r.availableArea || 0).toLocaleString('en-IN')}</td>
                                    <td className="text-right font-black text-slate-800 text-[10px]">₹{(r.totalDealValue || 0).toLocaleString('en-IN')}</td>
                                    <td className="text-right font-black text-emerald-600 text-[10px]">₹{(r.totalReceived || 0).toLocaleString('en-IN')}</td>
                                    <td className="text-right font-black text-rose-600 pr-6 text-[10px]">₹{(r.totalOutstanding || 0).toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                            {data.length > 1 && (
                                <tr className="bg-slate-50 font-black">
                                    <td colSpan="2" className="pl-6 text-right uppercase tracking-[0.2em] text-[9px] pr-4">Total:</td>
                                    <td className="text-center">{totals.totalPlots}</td>
                                    <td className="text-right font-mono text-[10px]">{totals.totalArea.toLocaleString('en-IN')}</td>
                                    <td className="text-center text-emerald-600">{totals.soldPlots}</td>
                                    <td className="text-center text-blue-600">{totals.bookedPlots}</td>
                                    <td className="text-center">{totals.availablePlots}</td>
                                    <td className="text-right text-emerald-500 font-mono text-[10px]">{totals.soldArea.toLocaleString('en-IN')}</td>
                                    <td className="text-right font-mono text-[10px]">{totals.availableArea.toLocaleString('en-IN')}</td>
                                    <td className="text-right text-[10px]">₹{totals.totalDealValue.toLocaleString('en-IN')}</td>
                                    <td className="text-right text-emerald-600 text-[10px]">₹{totals.totalReceived.toLocaleString('en-IN')}</td>
                                    <td className="text-right text-rose-600 pr-6 text-[10px]">₹{totals.totalOutstanding.toLocaleString('en-IN')}</td>
                                </tr>
                            )}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan="12" className="py-40 text-center">
                                        <div className="text-6xl mb-6 grayscale opacity-10">📐</div>
                                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">Unit Calculation Matrix Loading...</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pb-10">Dange Associates Unit Analytics © 2026</p>
        </div>
    );
};

export default ProjectSummary;
