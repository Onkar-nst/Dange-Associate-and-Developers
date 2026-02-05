import React, { useState, useEffect } from 'react';
import { projectAPI, customerAPI, reportAPI } from '../api/services';
import Layout from '../components/Layout';

const DirectCustomerStatement = () => {
    const [projects, setProjects] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [ledgerData, setLedgerData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState({ opening: 0, closing: 0 });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await projectAPI.getAll();
            setProjects(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    const handleProjectChange = async (e) => {
        const pId = e.target.value;
        setSelectedProject(pId);
        setSelectedCustomer('');
        setLedgerData([]);
        if (pId) {
            try {
                const res = await customerAPI.getAll({ projectId: pId });
                setCustomers(res.data.data || []);
            } catch (err) { console.error(err); }
        } else {
            setCustomers([]);
        }
    };

    const fetchStatement = async () => {
        if (!selectedCustomer) return;
        setLoading(true);
        try {
            const res = await reportAPI.getLedger({ 
                partyId: selectedCustomer, 
                partyType: 'customer' 
            });
            setLedgerData(res.data.data || []);
            setSummary({
                opening: res.data.openingBalance,
                closing: res.data.closingBalance
            });
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-GB');

    const Label = ({ children, icon }) => (
        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-2">
            <span>{icon}</span> {children}
        </label>
    );

    if (loading && ledgerData.length === 0) return <Layout><div className="flex items-center justify-center min-h-[400px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Scanning Financial Archive...</div></Layout>;

    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-10 animate-fade-in px-4 pb-20">
                
                {/* Protocol Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3">
                            <span>🧾</span> Direct Statement
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Isolated Financial Ledger Audit for Individual Assets</p>
                    </div>
                </div>

                {/* Filter Matrix */}
                <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl shadow-blue-900/10 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                        <div>
                            <Label icon="🏢">Operational Venture</Label>
                            <select 
                                value={selectedProject} 
                                onChange={handleProjectChange}
                                className="modern-input !bg-white/5 !border-white/10 !text-white !py-3 font-black text-[10px] uppercase"
                            >
                                <option value="" className="text-slate-800">-- SELECT VENTURE --</option>
                                {projects.map(p => <option key={p._id} value={p._id} className="text-slate-800">{p.projectName}</option>)}
                            </select>
                        </div>
                        <div>
                            <Label icon="👤">Target Client</Label>
                            <select 
                                value={selectedCustomer} 
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                                className="modern-input !bg-white/5 !border-white/10 !text-white !py-3 font-black text-[10px] uppercase"
                                disabled={!selectedProject}
                            >
                                <option value="" className="text-slate-800">-- SELECT CLIENT --</option>
                                {customers.map(c => <option key={c._id} value={c._id} className="text-slate-800">{c.name}</option>)}
                            </select>
                        </div>
                        <button 
                            onClick={fetchStatement}
                            className="btn-primary w-full !py-4 rounded-2xl uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 text-[10px] font-black flex items-center justify-center gap-3 disabled:opacity-30"
                            disabled={!selectedCustomer || loading}
                        >
                            {loading ? 'Analyzing...' : '📡 Generate Statement'}
                        </button>
                    </div>
                </div>

                {/* Statement Ledger */}
                {ledgerData.length > 0 && (
                    <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">
                        
                        {/* Statement Header */}
                        <div className="p-12 text-center border-b border-slate-50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
                            <div className="relative z-10 flex flex-col items-center gap-2">
                                <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center text-2xl font-black mb-4">DA</div>
                                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Dange Associates & Developers</h1>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-4">Financial Liability Statement</p>
                                <div className="px-8 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fiscal Record for</p>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                        {customers.find(c => c._id === selectedCustomer)?.name}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 flex-1 relative">
                            <table className="modern-table border !border-slate-50">
                                <thead>
                                    <tr>
                                        <th>Posting Date</th>
                                        <th>Statement Particulars</th>
                                        <th className="text-right">Debit (Dr) (-)</th>
                                        <th className="text-right">Credit (Cr) (+)</th>
                                        <th className="text-right">Liability Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-slate-50/50 font-black">
                                        <td className="text-slate-400 font-bold italic">B/F Archive</td>
                                        <td className="text-slate-500 uppercase flex items-center gap-2"><span>🏦</span> Opening Audit Balance</td>
                                        <td className="text-right text-slate-200">₹0</td>
                                        <td className="text-right text-slate-200">₹0</td>
                                        <td className="text-right text-blue-600">₹{summary.opening.toLocaleString()}</td>
                                    </tr>
                                    {ledgerData.map((t, idx) => (
                                        <tr key={idx} className="group hover:bg-slate-50/20 transition-colors border-b border-slate-50">
                                            <td className="font-bold text-slate-500">{formatDate(t.transactionDate)}</td>
                                            <td>
                                                <div className="font-black text-slate-800 uppercase tracking-tight text-[11px]">{t.description}</div>
                                                <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">Automated Asset Posting</div>
                                            </td>
                                            <td className="text-right font-black text-blue-600 bg-blue-50/10">₹{t.debit.toLocaleString()}</td>
                                            <td className="text-right font-black text-rose-500 bg-rose-50/10">₹{t.credit.toLocaleString()}</td>
                                            <td className="text-right font-black text-slate-900 bg-slate-50/30">₹{t.runningBalance.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-900 text-white font-black">
                                        <td colSpan="4" className="py-8 px-6 text-right uppercase tracking-[0.4em] text-[10px] text-blue-400">Final Liability Settlement Balance ➔</td>
                                        <td className="py-8 px-6 text-right text-2xl font-mono tracking-tighter shadow-2xl">₹{summary.closing.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="p-12 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Electronic Document Verified by System Auditor</div>
                            <button className="px-10 py-3 bg-white border border-slate-200 text-slate-800 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                🏙️ Export to ERP
                            </button>
                        </div>
                    </div>
                )}

                {ledgerData.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-slate-200 rounded-[3rem] animate-fade-in group hover:bg-slate-50/50 transition-colors">
                        <div className="text-6xl mb-6 grayscale group-hover:grayscale-0 transition-all duration-700">📑</div>
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">Audit Chamber Clear / Select Entity</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default DirectCustomerStatement;
