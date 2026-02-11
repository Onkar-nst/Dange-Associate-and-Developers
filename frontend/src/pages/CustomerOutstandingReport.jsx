import React, { useState, useEffect } from 'react';
import { reportAPI, projectAPI } from '../api/services';
import Layout from '../components/Layout';

const CustomerOutstandingReport = () => {
    const [data, setData] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedProject, setSelectedProject] = useState('');
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchProjects();
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
            const res = await reportAPI.getOutstanding({ projectId: selectedProject });
            setData(res.data.data || []);
            setTotal(res.data.totalOutstanding || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const Label = ({ children, icon }) => (
        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-2">
            <span>{icon}</span> {children}
        </label>
    );

    if (loading && data.length === 0) return <Layout><div className="flex items-center justify-center min-h-[400px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Scanning Defaulter Matrix...</div></Layout>;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-10 animate-fade-in px-4 pb-20">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3">
                            <span>📉</span> Outstanding Dues Matrix
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Recovery Analytics & Pending Receivables</p>
                    </div>
                </div>

                {/* Filter Matrix & Summary Banner */}
                <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl shadow-blue-900/20 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-12 items-end">
                        <div className="lg:col-span-1 space-y-3">
                            <Label icon="🏢">Target Venture Scope</Label>
                            <select 
                                value={selectedProject} 
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="modern-input !bg-white/5 !border-white/10 !text-white !py-4 font-black text-[11px] uppercase"
                            >
                                <option value="" className="text-slate-800">GLOBAL ARCHIVE (ALL PROJECTS)</option>
                                {projects.map(p => <option key={p._id} value={p._id} className="text-slate-800">{p.projectName}</option>)}
                            </select>
                        </div>
                        <div className="lg:col-span-1">
                            <button 
                                onClick={fetchReport}
                                className="btn-primary w-full !py-4 rounded-[2rem] uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 text-[11px] font-black flex items-center justify-center gap-3"
                            >
                                📡 Sync Audit
                            </button>
                        </div>
                        <div className="lg:col-span-2">
                            {total > 0 ? (
                                <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] flex flex-col items-center justify-center gap-2">
                                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em]">Gross Liability Exposure</p>
                                    <p className="text-4xl font-black text-rose-500 font-mono tracking-tighter italic">₹{total.toLocaleString('en-IN')}</p>
                                </div>
                            ) : (
                                <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] flex flex-col items-center justify-center gap-2">
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Recovery Integrity Status</p>
                                    <p className="text-2xl font-black text-emerald-500 uppercase tracking-tighter italic">Clearance Matrix Active</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Data Matrix */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
                    <table className="modern-table border !border-slate-50">
                        <thead>
                            <tr>
                                <th className="w-16 pl-12">Sr.</th>
                                <th>Account Identity</th>
                                <th className="text-center">Venture Unit</th>
                                <th className="text-right">Contract Value</th>
                                <th className="text-right">Nett Realized</th>
                                <th className="text-right">Balance Due</th>
                                <th className="text-center pr-12">Signals</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr key={idx} className="group hover:bg-rose-50/10 transition-colors border-b border-slate-50">
                                    <td className="pl-12 font-bold text-slate-300">{idx + 1}</td>
                                    <td>
                                        <div className="font-black text-slate-800 uppercase tracking-tight text-sm">{row.name}</div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Contact: {row.phone}</div>
                                    </td>
                                    <td className="text-center">
                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                            PLOT {row.plotId?.plotNumber || 'NA'}
                                        </span>
                                    </td>
                                    <td className="text-right font-black text-slate-400">₹{row.dealValue.toLocaleString('en-IN')}</td>
                                    <td className="text-right font-black text-emerald-600">₹{row.paidAmount.toLocaleString('en-IN')}</td>
                                    <td className="text-right font-black text-rose-500 bg-rose-50/10 text-base">₹{row.balanceAmount.toLocaleString('en-IN')}</td>
                                    <td className="text-center pr-12">
                                        <a href={`https://wa.me/${row.phone}`} target="_blank" className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                            💬
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="py-40 text-center">
                                        <div className="text-6xl mb-6 grayscale opacity-10">🛡️</div>
                                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">Zero Delinquency Found in Current Scope</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {data.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-900 text-white font-black">
                                    <td colSpan="5" className="py-8 pl-12 text-right uppercase tracking-[0.4em] text-[10px] text-slate-500">Gross Recovery Target Balance ➔</td>
                                    <td className="text-right text-2xl font-mono text-rose-400 tracking-tighter">₹{total.toLocaleString('en-IN')}</td>
                                    <td className="pr-12"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pb-10">Dange Associates Recovery Intelligence © 2026</p>
            </div>
        </Layout>
    );
};

export default CustomerOutstandingReport;
