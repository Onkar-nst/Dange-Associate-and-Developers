import React, { useState, useEffect } from 'react';
import { reportAPI, projectAPI, userAPI } from '../api/services';
import Layout from '../components/Layout';

const CustomerDuesReport = () => {
    const [data, setData] = useState([]);
    const [projects, setProjects] = useState([]);
    const [executives, setExecutives] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        projectId: '',
        executiveId: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [pRes, eRes] = await Promise.all([
                projectAPI.getAll(),
                userAPI.getList()
            ]);
            setProjects(pRes.data.data || []);
            setExecutives((eRes.data.data || []).filter(u => ['Executive', 'Head Executive'].includes(u.role)));
        } catch (err) { console.error(err); }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await reportAPI.getDues(filters);
            setData(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-GB') : 'N/A';

    const Label = ({ children, icon }) => (
        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-2">
            <span>{icon}</span> {children}
        </label>
    );

    if (loading && data.length === 0) return <div className="flex items-center justify-center min-h-[400px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Syncing EMI Repayment Schedule...</div>;

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 animate-fade-in px-4 pb-20">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3">
                            <span>📅</span> Customer Dues Matrix
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Global EMI Tracking & Strategic Repayment Analysis</p>
                    </div>
                </div>

                {/* Filter Grid */}
                <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl shadow-blue-900/10 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                        <div>
                            <Label icon="🏢">Operational Venture</Label>
                            <select 
                                name="projectId" 
                                value={filters.projectId} 
                                onChange={handleChange} 
                                className="modern-input !bg-white/5 !border-white/10 !text-white !py-4 font-black text-[11px] uppercase"
                            >
                                <option value="" className="text-slate-800">ALL PORTFOLIO ASSETS</option>
                                {projects.map(p => <option key={p._id} value={p._id} className="text-slate-800">{p.projectName}</option>)}
                            </select>
                        </div>
                        <div>
                            <Label icon="👔">Personnel Unit</Label>
                            <select 
                                name="executiveId" 
                                value={filters.executiveId} 
                                onChange={handleChange} 
                                className="modern-input !bg-white/5 !border-white/10 !text-white !py-4 font-black text-[11px] uppercase"
                            >
                                <option value="" className="text-slate-800">ALL OPERATIONAL AGENTS</option>
                                {executives.map(e => <option key={e._id} value={e._id} className="text-slate-800">{e.name}</option>)}
                            </select>
                        </div>
                        <button 
                            onClick={fetchReport} 
                            className="btn-primary w-full !py-4 rounded-[2rem] uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 text-[11px] font-black flex items-center justify-center gap-3"
                        >
                            📡 Generate Dues Archive
                        </button>
                    </div>
                </div>

                {/* Wide Data Matrix */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[600px] relative">
                    <div className="overflow-x-auto">
                        <table className="modern-table border !border-slate-50 min-w-[1400px]">
                            <thead>
                                <tr>
                                    <th className="w-12 pl-10 text-center">#</th>
                                    <th>Client Identity</th>
                                    <th className="text-center">Unit No.</th>
                                    <th className="text-right">Area</th>
                                    <th className="text-right">EMI (₹)</th>
                                    <th className="text-right">Total Cost</th>
                                    <th className="text-right">Nett Paid</th>
                                    <th className="text-right">Balance</th>
                                    <th className="text-right text-emerald-600">DP Paid</th>
                                    <th className="text-center">EMI Count</th>
                                    <th className="text-right text-rose-500">BE Amt</th>
                                    <th className="text-right">Gross Bal.</th>
                                    <th>Agent Entity</th>
                                    <th className="text-center pr-10">EMI Cycle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((r, i) => (
                                    <tr key={i} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                        <td className="pl-10 text-center font-bold text-slate-300">{i + 1}</td>
                                        <td>
                                            <div className="font-black text-slate-800 uppercase tracking-tight text-[11px]">{r.name}</div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Verified Profile</div>
                                        </td>
                                        <td className="text-center font-black text-slate-900">{r.plotNo}</td>
                                        <td className="text-right text-slate-400 font-mono text-[10px]">{r.area} <span className="text-[8px] uppercase">sqft</span></td>
                                        <td className="text-right font-black text-blue-600 bg-blue-50/10">₹{r.emiAmt.toLocaleString('en-IN')}</td>
                                        <td className="text-right font-black text-slate-800">₹{r.cost.toLocaleString('en-IN')}</td>
                                        <td className="text-right text-slate-400">₹{r.paidAmt.toLocaleString('en-IN')}</td>
                                        <td className="text-right font-black text-rose-600 bg-rose-50/10">₹{r.balance.toLocaleString('en-IN')}</td>
                                        <td className="text-right font-black text-emerald-600">₹{r.dpPaid.toLocaleString('en-IN')}</td>
                                        <td className="text-center">
                                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black text-slate-600">{r.noEMI} M</span>
                                        </td>
                                        <td className="text-right font-black text-rose-500 font-mono">₹{r.beAmt.toLocaleString('en-IN')}</td>
                                        <td className="text-right font-black text-slate-900 text-[12px] bg-slate-50/50">₹{r.totalBal.toLocaleString('en-IN')}</td>
                                        <td>
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter truncate max-w-[120px]">{r.agent}</div>
                                        </td>
                                        <td className="pr-10 text-center font-black text-blue-600 text-[10px] italic">
                                            {formatDate(r.emiDate)}
                                        </td>
                                    </tr>
                                ))}
                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan="14" className="py-40 text-center">
                                            <div className="text-6xl mb-6 grayscale opacity-10">🗓️</div>
                                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">Repayment Schedule Chamber Locked</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pb-10">Dange Associates Financial Planning Unit © 2026</p>
            </div>
    );
};

export default CustomerDuesReport;
