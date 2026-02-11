import React, { useState, useEffect } from 'react';
import { reportAPI, projectAPI } from '../api/services';
import Layout from '../components/Layout';

const SalesReportDetailed = () => {
    const [summary, setSummary] = useState({ deals: 0, value: 0 });
    const [data, setData] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        projectId: ''
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await projectAPI.getAll();
            setProjects(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await reportAPI.getSales(filters);
            setData(res.data.data || []);
            setSummary(res.data.summary || { deals: 0, value: 0 });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const Label = ({ children }) => <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1 mb-2 block">{children}</label>;

    if (loading && data.length === 0) return <div className="flex items-center justify-center min-h-[400px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Aggregating Sales Matrix...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in px-4">
                
                {/* Global Performance Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3">
                            <span>📈</span> Sales Revenue Intelligence
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-Venture Performance & Market Penetration</p>
                    </div>
                </div>

                {/* Cinematic Stat Banner */}
                <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl shadow-blue-900/10 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Conversions</p>
                                    <p className="text-2xl font-black text-blue-400 font-mono tracking-tighter">{summary.deals} Active Deals</p>
                                </div>
                                <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nett Valuation</p>
                                    <p className="text-2xl font-black text-emerald-400 font-mono tracking-tighter">₹{summary.value.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-6 items-end">
                                <div className="col-span-1">
                                    <Label>📅 Cycle Start</Label>
                                    <input type="date" name="startDate" value={filters.startDate} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-3" />
                                </div>
                                <div className="col-span-1">
                                    <Label>📅 Cycle End</Label>
                                    <input type="date" name="endDate" value={filters.endDate} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-3" />
                                </div>
                                <div className="col-span-1">
                                    <button onClick={fetchReport} className="btn-primary w-full !py-3.5 rounded-xl uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 text-[10px] font-black">
                                        Sync Audit ➔
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label>🏢 Filter by Venture Scope</Label>
                            <div className="grid grid-cols-1 gap-4">
                                <select 
                                    name="projectId" 
                                    value={filters.projectId} 
                                    onChange={handleChange}
                                    className="w-full px-8 py-5 bg-white border border-slate-100 rounded-[2rem] outline-none font-black text-[11px] uppercase transition-all shadow-sm text-slate-800"
                                >
                                    <option value="">GLOBAL SPECTRUM (ALL VENTURES)</option>
                                    {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analytical Data Matrix */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th className="pl-12">Operational Venture</th>
                                <th className="text-center">Deals Finalized</th>
                                <th className="text-right">Gross Revenue Flow</th>
                                <th className="text-right pr-12">Average Unit Yield</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                    <td className="pl-12">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs uppercase shadow-sm group-hover:bg-blue-600 transition-colors">
                                                {row.projectName?.[0]}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-800 uppercase tracking-tight text-sm">{row.projectName}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Verified Asset Pool</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <div className="inline-flex items-center justify-center px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
                                            <span className="text-xs font-black text-blue-600 font-mono italic">{row.totalDeals} Units</span>
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <div className="font-black text-slate-900 text-base">₹{row.totalValue.toLocaleString('en-IN')}</div>
                                        <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Nett Realized</div>
                                    </td>
                                    <td className="text-right pr-12">
                                        <div className="font-black text-slate-400 text-sm">₹{(row.totalValue / row.totalDeals).toLocaleString('en-IN')}</div>
                                        <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Per Strategic Unit</div>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-24 text-center">
                                        <div className="text-5xl opacity-10 mb-4 font-black">📊</div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No Fiscal Data in Current Scope</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {data.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-50 border-t border-slate-100">
                                    <td className="pl-12 py-8 font-black text-[10px] uppercase text-slate-400 tracking-widest">Aggregate Convergence</td>
                                    <td className="text-center font-black text-slate-800">{summary.deals} Deals</td>
                                    <td className="text-right font-black text-emerald-600 text-lg">₹{summary.value.toLocaleString('en-IN')}</td>
                                    <td className="text-right pr-12 font-black text-slate-400">
                                        ₹{(summary.value / summary.deals || 0).toLocaleString('en-IN')} <span className="text-[8px] tracking-widest ml-1">(avg)</span>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pb-10">Dange Associates Intelligence Platform © 2026</p>
            </div>
    );
};

export default SalesReportDetailed;
