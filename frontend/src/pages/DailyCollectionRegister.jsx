import React, { useState, useEffect } from 'react';
import { reportAPI, projectAPI, userAPI } from '../api/services';
import Layout from '../components/Layout';

const DailyCollectionRegister = () => {
    const [data, setData] = useState({ cash: [], bank: [], summary: {} });
    const [tokens, setTokens] = useState([]);
    const [projects, setProjects] = useState([]);
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        projectId: '',
        partnerId: ''
    });

    useEffect(() => {
        fetchInitial();
    }, []);

    const fetchInitial = async () => {
        try {
            const [pRes, uRes] = await Promise.all([
                projectAPI.getAll(),
                userAPI.getList()
            ]);
            setProjects(pRes.data.data || []);
            setPartners((uRes.data.data || []).filter(u => ['The Boss', 'Head Executive'].includes(u.role)));
        } catch (err) { console.error(err); }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await reportAPI.getDailyCollection(filters);
            setData(res.data.data || { cash: [], bank: [], summary: {} });
            setTokens(res.data.tokens || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

    const handlePrint = () => {
        window.print();
    };

    const TableHeader = ({ title, icon, color }) => (
        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-6 shadow-sm border ${color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : color === 'orange' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-slate-50 border-slate-100 text-slate-800'}`}>
            <span className="text-xl">{icon}</span>
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{title}</span>
        </div>
    );

    const Label = ({ children }) => <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1 mb-2 block">{children}</label>;

    if (loading && !data.summary.cashRec) return <Layout><div className="flex items-center justify-center min-h-[400px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Syncing Collection Register...</div></Layout>;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-10 animate-fade-in px-4 print:p-0">
                
                {/* Header Filter Bar (Glassmorphism) */}
                <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl shadow-blue-900/20 text-white relative overflow-hidden group print:hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                        <div className="md:col-span-2 grid grid-cols-2 gap-4">
                            <div>
                                <Label>📅 Start Date</Label>
                                <input type="date" name="startDate" value={filters.startDate} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none font-black text-xs text-white transition-all focus:bg-white/10" />
                            </div>
                            <div>
                                <Label>📅 End Date</Label>
                                <input type="date" name="endDate" value={filters.endDate} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none font-black text-xs text-white transition-all focus:bg-white/10" />
                            </div>
                        </div>
                        <div>
                            <Label>🏢 Venture</Label>
                            <select name="projectId" value={filters.projectId} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none font-black text-[10px] uppercase transition-all focus:bg-white/10">
                                <option value="" className="text-slate-800">ALL VENTURES</option>
                                {projects.map(p => <option key={p._id} value={p._id} className="text-slate-800">{p.projectName}</option>)}
                            </select>
                        </div>
                        <div>
                            <Label>💼 Partner</Label>
                            <select name="partnerId" value={filters.partnerId} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none font-black text-[10px] uppercase transition-all focus:bg-white/10">
                                <option value="" className="text-slate-800">ALL PARTNERS</option>
                                {partners.map(p => <option key={p._id} value={p._id} className="text-slate-800">{p.name}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={fetchReport} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95">📡 Sync</button>
                            <button onClick={handlePrint} className="w-12 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-all">🖨️</button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden min-h-[800px] flex flex-col print:border-none print:shadow-none">
                    
                    {/* Report Corporate Header */}
                    <div className="p-12 text-center border-b border-slate-50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-40"></div>
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center text-2xl font-black mb-4">DA</div>
                            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Dange Associates & Developers</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-4">Daily Collection Register Audit</p>
                            <div className="px-6 py-2 bg-emerald-50 border border-emerald-100 rounded-full">
                                <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Period: {filters.startDate} <span className="opacity-30">➔</span> {filters.endDate}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 space-y-16">
                        {/* CASH SECTION */}
                        <section>
                            <TableHeader title="Cash in Hand Archive" icon="💵" color="emerald" />
                            <table className="modern-table border !border-slate-50">
                                <thead>
                                    <tr>
                                        <th className="w-12">#</th>
                                        <th>Date & Ref</th>
                                        <th>Customer Portfolio</th>
                                        <th>Type</th>
                                        <th>Audit Remarks</th>
                                        <th className="text-right">Receipt (+)</th>
                                        <th className="text-right">Payment (-)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.cash.map((c, i) => (
                                        <tr key={i} className="group hover:bg-emerald-50/30 transition-colors border-b border-slate-50">
                                            <td className="text-center font-bold text-slate-300">{i + 1}</td>
                                            <td>
                                                <div className="font-bold text-slate-700">{new Date(c.date).toLocaleDateString()}</div>
                                                <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">#R-{c.recNo}</div>
                                            </td>
                                            <td>
                                                <div className="font-black text-slate-800 uppercase tracking-tighter text-[11px]">{c.customerName}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verified Account</div>
                                            </td>
                                            <td><span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{c.recType}</span></td>
                                            <td className="text-slate-400 italic font-medium">{c.particular}</td>
                                            <td className="text-right font-black text-emerald-600 bg-emerald-50/10">₹{c.received.toLocaleString()}</td>
                                            <td className="text-right font-black text-rose-500">₹{c.payment.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-emerald-50 font-black">
                                        <td colSpan="5" className="text-right uppercase tracking-[0.2em] text-[9px] pr-4">Nett Cash Movements:</td>
                                        <td className="text-right text-emerald-700 py-4">₹{data.summary.cashRec?.toLocaleString()}</td>
                                        <td className="text-right text-rose-600 py-4">₹{data.summary.cashPay?.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        {/* BANK SECTION */}
                        <section>
                            <TableHeader title="Bank Transaction Audit" icon="🏦" color="emerald" />
                            <table className="modern-table border !border-slate-50">
                                <thead>
                                    <tr>
                                        <th className="w-12">#</th>
                                        <th>Date & Ref</th>
                                        <th>Customer Portfolio</th>
                                        <th>Type</th>
                                        <th>Audit Remarks</th>
                                        <th className="text-right">Receipt (+)</th>
                                        <th className="text-right">Payment (-)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.bank.map((c, i) => (
                                        <tr key={i} className="group hover:bg-emerald-50/30 transition-colors border-b border-slate-50">
                                            <td className="text-center font-bold text-slate-300">{i + 1}</td>
                                            <td>
                                                <div className="font-bold text-slate-700">{new Date(c.date).toLocaleDateString()}</div>
                                                <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">#R-{c.recNo}</div>
                                            </td>
                                            <td>
                                                <div className="font-black text-slate-800 uppercase tracking-tighter text-[11px]">{c.customerName}</div>
                                            </td>
                                            <td><span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{c.recType}</span></td>
                                            <td className="text-slate-400 italic font-medium">{c.particular}</td>
                                            <td className="text-right font-black text-emerald-600 bg-emerald-50/10">₹{c.received.toLocaleString()}</td>
                                            <td className="text-right font-black text-rose-500">₹{c.payment.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-emerald-50 font-black">
                                        <td colSpan="5" className="text-right uppercase tracking-[0.2em] text-[9px] pr-4">Nett Bank Movements:</td>
                                        <td className="text-right text-emerald-700 py-4">₹{data.summary.bankRec?.toLocaleString()}</td>
                                        <td className="text-right text-rose-600 py-4">₹{data.summary.bankPay?.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        {/* Combined Summary & Tokens */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                            {/* Combined Summary */}
                            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-900/10 border border-white/5 order-2 lg:order-1">
                                <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-8 text-blue-400 flex items-center gap-3">
                                    <span>📊</span> Fiscal Convergence
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center py-4 border-b border-white/5">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cash Liquidity</p>
                                            <p className="text-sm font-black uppercase">Nett Flow</p>
                                        </div>
                                        <p className="text-xl font-black text-emerald-400">₹{(data.summary.cashRec - data.summary.cashPay)?.toLocaleString()}</p>
                                    </div>
                                    <div className="flex justify-between items-center py-4 border-b border-white/5">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Banking Assets</p>
                                            <p className="text-sm font-black uppercase">Nett Flow</p>
                                        </div>
                                        <p className="text-xl font-black text-emerald-400">₹{(data.summary.bankRec - data.summary.bankPay)?.toLocaleString()}</p>
                                    </div>
                                    <div className="pt-6">
                                        <div className="bg-blue-600 p-8 rounded-[2rem] flex flex-col items-center gap-2 shadow-2xl shadow-blue-500/20">
                                            <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.4em]">Combined Daily Balance</p>
                                            <p className="text-4xl font-black tracking-tighter">₹{(data.summary.cashRec + data.summary.bankRec - (data.summary.cashPay + data.summary.bankPay))?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Token Registry */}
                            <div className="space-y-6 order-1 lg:order-2">
                                <TableHeader title={`Active Token Registry (${tokens.length})`} icon="🎟️" color="orange" />
                                <div className="bg-white rounded-[2.5rem] border border-amber-100 overflow-hidden shadow-sm">
                                    <table className="modern-table">
                                        <thead className="!bg-amber-50">
                                            <tr>
                                                <th className="w-12 !text-amber-800">#</th>
                                                <th className="!text-amber-800">Client</th>
                                                <th className="!text-amber-800 text-center">Unit No.</th>
                                                <th className="text-right !text-amber-800">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tokens.map((t, idx) => (
                                                <tr key={idx} className="hover:bg-amber-50/20 transition-colors border-b border-amber-50/50">
                                                    <td className="text-center font-bold text-amber-300">{idx + 1}</td>
                                                    <td>
                                                        <div className="font-black text-slate-800 uppercase text-[10px] tracking-tight">{t.name}</div>
                                                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t.project}</div>
                                                    </td>
                                                    <td className="text-center font-black text-slate-900">{t.plotNo}</td>
                                                    <td className="text-right">
                                                        <span className="bg-amber-600 text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest leading-none block w-fit ml-auto">
                                                            {t.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {tokens.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="py-20 text-center opacity-30 font-black text-[10px] uppercase tracking-widest">No Token Deployments Found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Report Footer Signature */}
                    <div className="hidden print:flex justify-between items-end p-20 mt-10 border-t border-slate-100">
                        <div className="text-center w-64 border-t-2 border-slate-800 pt-4">
                            <p className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Internal Auditor</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Dange Associates</p>
                        </div>
                        <div className="text-center w-64 border-t-2 border-slate-800 pt-4">
                            <p className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Authorized Signatory</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Verification Required</p>
                        </div>
                    </div>
                </div>

                <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pb-10">Secure Financial Infrastructure © 2026 Dange Associates</p>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body * { visibility: hidden; background: white !important; }
                    .print-area, .print-area *, .max-w-7xl, .max-w-7xl * { visibility: visible; }
                    .max-w-7xl { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
                    header, footer, nav, aside, button, .print\\:hidden { display: none !important; }
                    .bg-slate-900 { background: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; }
                    .bg-blue-600 { background: #2563eb !important; -webkit-print-color-adjust: exact; }
                }
            `}} />
        </Layout>
    );
};

export default DailyCollectionRegister;
