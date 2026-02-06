import React, { useState, useEffect } from 'react';
import { customerAPI, projectAPI, userAPI, reportAPI } from '../api/services';
import Layout from '../components/Layout';
import logo from '../assets/logo.png';

const PartyLedger = () => {
    const [customers, setCustomers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [executives, setExecutives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState('');

    // Form States
    const [startDate, setStartDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedExecutive, setSelectedExecutive] = useState('');

    // Report Data
    const [ledgerData, setLedgerData] = useState([]);
    const [openingBalance, setOpeningBalance] = useState(0);
    const [closingBalance, setClosingBalance] = useState(0);
    const [currentPartyName, setCurrentPartyName] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [custRes, projRes, execRes] = await Promise.all([
                customerAPI.getAll(),
                projectAPI.getAll({ active: true }),
                userAPI.getList()
            ]);
            setCustomers(custRes.data.data || []);
            setProjects(projRes.data.data || []);
            setExecutives((execRes.data.data || []).filter(u => ['Executive', 'Head Executive', 'The Boss'].includes(u.role)));
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch filter data');
            setLoading(false);
        }
    };

    const handleFetchLedger = async () => {
        if (!selectedCustomer) {
            setError('Please select a customer first');
            return;
        }

        setFetching(true);
        setError('');
        try {
            const params = {
                partyId: selectedCustomer,
                partyType: 'customer',
                startDate,
                endDate
            };
            const res = await reportAPI.getLedger(params);
            setLedgerData(res.data.data || []);
            setOpeningBalance(res.data.openingBalance || 0);
            setClosingBalance(res.data.closingBalance || 0);
            
            const customer = customers.find(c => c._id === selectedCustomer);
            setCurrentPartyName(customer ? customer.name : 'Unknown Party');
            
            setFetching(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch ledger transactions');
            setFetching(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const Label = ({ children, icon }) => (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1.5 flex items-center gap-2">
            <span>{icon}</span> {children}
        </label>
    );

    if (loading) return <Layout><div className="flex items-center justify-center min-h-[400px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Syncing Party Archive...</div></Layout>;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in px-4 print:p-0">
                
                {/* Header Area (No Print) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3">
                            <span>📖</span> Party Ledger
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Transaction History & Financial Audits</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    
                    {/* Filter Sidebar (No Print) */}
                    <div className="xl:col-span-4 space-y-6 print:hidden">
                        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 space-y-8">
                            <section>
                                <h2 className="text-blue-600 text-[11px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                    <span>🔍</span> Audit Parameters
                                </h2>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label icon="📅">From</Label>
                                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="modern-input" />
                                        </div>
                                        <div>
                                            <Label icon="📅">To</Label>
                                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="modern-input" />
                                        </div>
                                    </div>

                                    <div>
                                        <Label icon="👤">Search Customer</Label>
                                        <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="modern-input font-black uppercase">
                                            <option value="">-- ALL ACCOUNTS --</option>
                                            {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <Label icon="🏢">Project Filter</Label>
                                        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="modern-input font-black uppercase">
                                            <option value="">-- ALL VENTURES --</option>
                                            {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <Label icon="💼">Executive Filter</Label>
                                        <select value={selectedExecutive} onChange={(e) => setSelectedExecutive(e.target.value)} className="modern-input font-black uppercase">
                                            <option value="">-- ALL EXECUTIVES --</option>
                                            {executives.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-3">
                                        <span className="text-rose-500 text-lg leading-none">⚠️</span>
                                        <p className="text-[9px] text-rose-600 font-black uppercase leading-relaxed tracking-tighter">
                                            Warning: Selecting a specific project code will bypass historical opening balance calculations for this audit.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <div className="space-y-3">
                                <button 
                                    onClick={handleFetchLedger} 
                                    disabled={fetching}
                                    className="btn-primary w-full !py-4 rounded-2xl shadow-xl shadow-blue-500/20 uppercase tracking-widest text-[11px] flex items-center justify-center gap-3"
                                >
                                    {fetching ? 'Syncing...' : '📡 Generate Report'}
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={handlePrint} className="bg-slate-900 text-white rounded-2xl py-4 font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                                        <span>🖨️</span> Print PDF
                                    </button>
                                    <button className="bg-emerald-600 text-white rounded-2xl py-4 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                        <span>📊</span> Project Sum.
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[11px] font-black uppercase tracking-widest text-center">{error}</div>}
                    </div>

                    {/* Report Output */}
                    <div className="xl:col-span-8">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden print:border-none print:shadow-none min-h-[600px] flex flex-col">
                            
                            {/* Report Header */}
                            <div className="p-12 text-center border-b border-slate-50 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
                                <div className="relative z-10 flex flex-col items-center gap-2">
                                    <img src={logo} alt="Logo" className="h-16 w-auto mb-4" />
                                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Dange Associates & Developers</h1>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Commercial Financial Audit Report</p>
                                    <div className="w-20 h-1 bg-blue-600 rounded-full mt-4"></div>
                                </div>

                                {currentPartyName && (
                                    <div className="mt-10 bg-slate-50 inline-block px-10 py-5 rounded-[2rem] border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Fiscal Statement for</p>
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{currentPartyName}</h3>
                                        <div className="h-px bg-slate-200 my-2 mx-auto w-1/2"></div>
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                            {formatDate(startDate)} <span className="opacity-30">TO</span> {formatDate(endDate)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Report Content */}
                            <div className="p-10 flex-1 relative print:p-0">
                                <table className="modern-table border !border-slate-100">
                                    <thead>
                                        <tr>
                                            <th>Date & Ref</th>
                                            <th>Transaction Particulars</th>
                                            <th className="text-right">Debit (-)</th>
                                            <th className="text-right">Credit (+)</th>
                                            <th className="text-right">Audit Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Opening Balance */}
                                        <tr className="bg-slate-50/50">
                                            <td className="font-bold text-slate-400">{formatDate(startDate)}</td>
                                            <td className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                                <span>🏦</span> Opening Balance Forward
                                            </td>
                                            <td className="text-right font-black text-slate-300">-</td>
                                            <td className="text-right font-black text-slate-300">-</td>
                                            <td className="text-right font-black text-blue-600">
                                                ₹{Math.abs(openingBalance).toLocaleString()} {openingBalance >= 0 ? 'Dr' : 'Cr'}
                                            </td>
                                        </tr>

                                        {/* Transactions */}
                                        {ledgerData.map((entry, idx) => (
                                            <tr key={idx} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                                <td className="relative">
                                                    <div className="font-bold text-slate-700">{formatDate(entry.transactionDate)}</div>
                                                    <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest absolute -bottom-1">#AUDIT-{entry.referenceId ? entry.referenceId.slice(-6).toUpperCase() : 'NA'}</div>
                                                </td>
                                                <td>
                                                    <div className="font-black text-slate-800 uppercase tracking-tight leading-tight">{entry.description || 'General Transaction'}</div>
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Automated Entry</div>
                                                </td>
                                                <td className="text-right font-black text-rose-500">
                                                    {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="text-right font-black text-emerald-600">
                                                    {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="text-right font-black text-slate-900 bg-slate-50/30">
                                                    ₹{Math.abs(entry.runningBalance).toLocaleString()} {entry.runningBalance >= 0 ? 'Dr' : 'Cr'}
                                                </td>
                                            </tr>
                                        ))}

                                        {ledgerData.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="py-32 text-center flex-col items-center">
                                                    <div className="text-5xl mb-4 grayscale opacity-10">📑</div>
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Audit Trail Clear / No Postings found</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-900 text-white font-black">
                                            <td colSpan="2" className="text-right uppercase tracking-widest text-[9px] pr-4">Nett Totals :</td>
                                            <td className="text-right py-6">
                                                ₹{ledgerData.reduce((acc, curr) => acc + (curr.debit || 0), 0).toLocaleString()}
                                            </td>
                                            <td className="text-right py-6">
                                                ₹{ledgerData.reduce((acc, curr) => acc + (curr.credit || 0), 0).toLocaleString()}
                                            </td>
                                            <td className="text-right py-6 text-blue-400 border-l border-white/10">
                                                ₹{Math.abs(closingBalance).toLocaleString()} {closingBalance >= 0 ? 'Dr' : 'Cr'}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Footer Signature (Print Only) */}
                            <div className="hidden print:flex justify-between items-end p-20 mt-20 border-t border-slate-100">
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
                    </div>

                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body * {
                        visibility: hidden;
                        background: white !important;
                    }
                    .print-area, .print-area *, .xl\\:col-span-8, .xl\\:col-span-8 * {
                        visibility: visible;
                    }
                    .xl\\:col-span-8 {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .modern-table th {
                        background: #f8fafc !important;
                        color: #000 !important;
                    }
                    .modern-table td {
                        border-bottom: 1px solid #f1f5f9 !important;
                    }
                    header, footer, nav, aside, button, .print\\:hidden {
                        display: none !important;
                    }
                }
            `}} />
        </Layout>
    );
};

export default PartyLedger;
