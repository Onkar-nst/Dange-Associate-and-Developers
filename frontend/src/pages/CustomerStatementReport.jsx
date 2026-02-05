import React, { useState, useEffect } from 'react';
import { reportAPI, projectAPI } from '../api/services';
import Layout from '../components/Layout';

const CustomerStatementReport = () => {
    const [data, setData] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
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
            const res = await reportAPI.getCustomerStatement(filters);
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

    const Label = ({ children, icon }) => (
        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-2">
            <span>{icon}</span> {children}
        </label>
    );

    if (loading && data.length === 0) return <Layout><div className="flex items-center justify-center min-h-[400px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Aggregating Global Statements...</div></Layout>;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-10 animate-fade-in px-4 pb-20">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3">
                            <span>📋</span> Master Statement Center
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Unified Multi-Entity Fiscal Audit and Lifecycle Tracking</p>
                    </div>
                </div>

                {/* Filter Grid */}
                <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl shadow-blue-900/10 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
                        <div className="md:col-span-1 space-y-3">
                            <Label icon="📊">Operational Status</Label>
                            <select 
                                name="status" 
                                value={filters.status} 
                                onChange={handleChange}
                                className="modern-input !bg-white/5 !border-white/10 !text-white !py-4 font-black text-[11px] uppercase"
                            >
                                <option value="all" className="text-slate-800">GLOBAL (ALL)</option>
                                <option value="token" className="text-slate-800">TOKEN PHASE</option>
                                <option value="agreement" className="text-slate-800">AGREEMENT</option>
                                <option value="registered" className="text-slate-800">REGISTERED</option>
                                <option value="cancelled" className="text-slate-800">CANCELLED</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <Label icon="🏢">Project Spectrum</Label>
                            <select 
                                name="projectId" 
                                value={filters.projectId} 
                                onChange={handleChange}
                                className="modern-input !bg-white/5 !border-white/10 !text-white !py-4 font-black text-[11px] uppercase"
                            >
                                <option value="" className="text-slate-800">-- ALL VENTURE PORTFOLIOS --</option>
                                {projects.map(p => <option key={p._id} value={p._id} className="text-slate-800">{p.projectName}</option>)}
                            </select>
                        </div>
                        <button 
                            onClick={fetchReport} 
                            className="btn-primary w-full !py-4 rounded-[2rem] uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 text-[11px] font-black flex items-center justify-center gap-3"
                        >
                            📡 Sync Matrix
                        </button>
                    </div>
                </div>

                {/* Data Matrix */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
                    <div className="overflow-x-auto">
                        <table className="modern-table border !border-slate-50">
                            <thead>
                                <tr>
                                    <th className="pl-10 text-center">Protocol</th>
                                    <th className="text-center">Sr.</th>
                                    <th>Client Entity</th>
                                    <th className="text-center">Unit</th>
                                    <th className="text-right">Contract</th>
                                    <th className="text-right">Realized</th>
                                    <th className="text-right">Balance</th>
                                    <th className="text-center pr-10">Lifecycle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                        <td className="pl-10 text-center">
                                            <div className="flex gap-2 justify-center">
                                                <button className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">👁️</button>
                                                <button className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm">📔</button>
                                            </div>
                                        </td>
                                        <td className="text-center font-bold text-slate-300">{row.sr}</td>
                                        <td>
                                            <div className="font-black text-slate-800 uppercase tracking-tight text-[11px]">{row.name}</div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">verified_partner_id: {row._id?.slice(-6)}</div>
                                        </td>
                                        <td className="text-center font-black text-slate-900">{row.plotNo}</td>
                                        <td className="text-right text-slate-400 font-mono">₹{row.cost.toLocaleString()}</td>
                                        <td className="text-right font-black text-emerald-600 bg-emerald-50/10">₹{row.received.toLocaleString()}</td>
                                        <td className="text-right font-black text-rose-500 bg-rose-50/10">₹{row.balance.toLocaleString()}</td>
                                        <td className="pr-10 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                row.status === 'registered' ? 'bg-emerald-100 text-emerald-600' : 
                                                row.status === 'cancelled' ? 'bg-rose-100 text-rose-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="py-40 text-center">
                                            <div className="text-6xl mb-6 grayscale opacity-10">📑</div>
                                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">Statement Chamber Closed / Select Scope</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {data.length > 0 && (
                                <tfoot>
                                    <tr className="bg-slate-900 text-white font-black">
                                        <td colSpan="4" className="py-8 pl-10 text-right uppercase tracking-[0.4em] text-[10px] text-slate-500">Gross Period Aggregates ➔</td>
                                        <td className="text-right text-slate-400 font-mono">₹{data.reduce((acc, curr) => acc + curr.cost, 0).toLocaleString()}</td>
                                        <td className="text-right text-emerald-400 font-mono">₹{data.reduce((acc, curr) => acc + curr.received, 0).toLocaleString()}</td>
                                        <td className="text-right text-rose-400 font-mono text-lg">₹{data.reduce((acc, curr) => acc + curr.balance, 0).toLocaleString()}</td>
                                        <td className="pr-10"></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pb-10">Dange Associates Intelligence Vault © 2026</p>
            </div>
        </Layout>
    );
};

export default CustomerStatementReport;
