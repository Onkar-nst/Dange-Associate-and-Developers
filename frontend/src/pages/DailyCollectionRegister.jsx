import React, { useState, useEffect } from 'react';
import { reportAPI, projectAPI, userAPI, ledgerAPI, executiveAPI } from '../api/services';
import logo from '../assets/logo.png';

const DailyCollectionRegister = () => {
    const [data, setData] = useState({ cash: [], bank: [], summary: {} });
    const [tokens, setTokens] = useState([]);
    const [agreements, setAgreements] = useState([]);
    const [cancelled, setCancelled] = useState([]);
    const [projects, setProjects] = useState([]);
    const [executives, setExecutives] = useState([]);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        projectId: '',
        executiveId: '',
        bankId: '',
        allFilter: 'All',
        purchasePercent: 0,
        executivePercent: 0,
        otherPercent: 0
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [pRes, eRes, bRes] = await Promise.all([
                projectAPI.getAll(),
                executiveAPI.getAll(),
                ledgerAPI.getAll()
            ]);
            setProjects(pRes.data.data || []);
            setExecutives(eRes.data.data || []);
            setBanks((bRes.data.data || []).filter(l => l.type === 'Bank'));
        } catch (err) { console.error(err); }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await reportAPI.getDailyCollection(filters);
            setData(res.data.data || { cash: [], bank: [], summary: {} });
            setTokens(res.data.tokens || []);
            setAgreements(res.data.agreements || []);
            setCancelled(res.data.cancelled || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handlePrint = () => window.print();

    // Summary Calculations
    const totalRecieved = (data.summary.cashRec || 0) + (data.summary.bankRec || 0);
    const purchaseCost = (totalRecieved * (filters.purchasePercent || 0)) / 100;
    const commissionCost = (totalRecieved * (filters.executivePercent || 0)) / 100;
    const otherCost = (totalRecieved * (filters.otherPercent || 0)) / 100;
    const actualExp = purchaseCost + commissionCost + otherCost;
    const finalBalance = totalRecieved - actualExp;

    return (
        <div className="max-w-[100%] mx-auto space-y-4 font-sans text-xs pb-20 px-2 print:p-0">
            <style>
                {`
                    @media print {
                        @page { margin: 0.5cm; size: landscape; }
                        
                        /* Hide everything by default */
                        body * {
                            visibility: hidden !important;
                        }

                        /* Show ONLY the print container and its contents */
                        .print-container, 
                        .print-container * {
                            visibility: visible !important;
                        }

                        /* Position the container at the very top of the printed page */
                        .print-container {
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                            width: 100% !important;
                            height: auto !important;
                            background: white !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            display: block !important;
                            z-index: 99999 !important;
                            border: none !important;
                        }

                        .no-print { display: none !important; }
                    }
                    .reg-table th, .reg-table td {
                        border: 1px solid #777;
                        padding: 4px;
                        text-align: center;
                    }
                    .reg-table th { background-color: #f5f5f5; font-weight: bold; }
                    .reg-table .text-left { text-align: left; }
                `}
            </style>

            {/* Filter Bar (Premium Slate Gradient) */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-2xl space-y-5 no-print shadow-xl border border-slate-600/30">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">START DATE</label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleChange} className="px-3 py-1.5 rounded-lg border border-slate-600 bg-slate-900/50 text-white text-xs outline-none focus:border-emerald-500 transition-all font-bold" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">END DATE</label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleChange} className="px-3 py-1.5 rounded-lg border border-slate-600 bg-slate-900/50 text-white text-xs outline-none focus:border-emerald-500 transition-all font-bold" />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">PROJECT SCOPE</label>
                        <select name="projectId" value={filters.projectId} onChange={handleChange} className="px-3 py-1.5 rounded-lg border border-slate-600 bg-slate-900/50 text-white text-xs outline-none focus:border-emerald-500 transition-all font-bold min-w-[200px]">
                            <option value="" className="bg-slate-800">GLOBAL AGGREGATE</option>
                            {projects.map(p => <option key={p._id} value={p._id} className="bg-slate-800">{p.projectName}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">EXECUTIVE</label>
                        <select name="executiveId" value={filters.executiveId} onChange={handleChange} className="px-3 py-1.5 rounded-lg border border-slate-600 bg-slate-900/50 text-white text-xs outline-none focus:border-emerald-500 transition-all font-bold min-w-[140px]">
                            <option value="All" className="bg-slate-800">ALL PERSONNEL</option>
                            {executives.map(e => <option key={e._id} value={e._id} className="bg-slate-800">{e.name}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">FINANCIAL ENTITY</label>
                        <select name="bankId" value={filters.bankId} onChange={handleChange} className="px-3 py-1.5 rounded-lg border border-slate-600 bg-slate-900/50 text-white text-xs outline-none focus:border-emerald-500 transition-all font-bold min-w-[160px]">
                            <option value="" className="bg-slate-800">PRIMARY ACCOUNT</option>
                            {banks.map(b => <option key={b._id} value={b._id} className="bg-slate-800">{b.name}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1 self-end">
                        <div className="flex items-center gap-2">
                            <button onClick={fetchReport} className="bg-emerald-600 text-white px-8 py-1.5 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 active:scale-95 border border-emerald-500/50">Show Report</button>
                            <button onClick={handlePrint} className="p-1.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white hover:bg-white hover:text-slate-900 transition-all" title="Print Archive">🖨️</button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-8 pt-2 border-t border-slate-600/30">
                    <div className="flex items-center gap-3">
                        <label className="font-black text-[9px] text-slate-400 uppercase tracking-[0.2em]">Purchase Cost %</label>
                        <input type="number" name="purchasePercent" value={filters.purchasePercent} onChange={handleChange} className="w-16 px-2 py-1 rounded bg-slate-900/50 border border-slate-600 text-emerald-400 font-bold text-xs outline-none focus:border-emerald-500" />
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="font-black text-[9px] text-slate-400 uppercase tracking-[0.2em]">Executive Comm %</label>
                        <input type="number" name="executivePercent" value={filters.executivePercent} onChange={handleChange} className="w-16 px-2 py-1 rounded bg-slate-900/50 border border-slate-600 text-emerald-400 font-bold text-xs outline-none focus:border-emerald-500" />
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="font-black text-[9px] text-slate-400 uppercase tracking-[0.2em]">Other Overheads %</label>
                        <input type="number" name="otherPercent" value={filters.otherPercent} onChange={handleChange} className="w-16 px-2 py-1 rounded bg-slate-900/50 border border-slate-600 text-emerald-400 font-bold text-xs outline-none focus:border-emerald-500" />
                    </div>
                </div>
            </div>

            {/* Report Document */}
            <div className="bg-white p-6 border border-slate-300 rounded print-container">
                {/* Document Header */}
                <div className="flex flex-col items-center mb-6">
                    <img src={logo} alt="Dange Associates & Developers" className="h-16 w-auto mb-2" />
                    <p className="font-bold text-[10px] italic uppercase text-slate-600">Block No.7 Khadi Gram Sankul, Beside ICICI Bank, Kalmeshwar</p>
                    <p className="font-black text-[11px] mt-2 border-b border-black inline-block pb-1">
                        Daily Collection Register from {new Date(filters.startDate).toLocaleDateString()} To {new Date(filters.endDate).toLocaleDateString()}
                    </p>
                </div>

                {/* Main Table */}
                <table className="w-full reg-table border-collapse mb-8">
                    <thead>
                        <tr>
                            <th className="w-10">Sr.</th>
                            <th className="w-24">Date</th>
                            <th className="w-24">Rec.No.</th>
                            <th className="text-left py-2 px-3">Customer Name</th>
                            <th className="w-24 px-3">Rec.Type</th>
                            <th className="text-left px-3">Particular</th>
                            <th className="w-24 px-3">Recieved</th>
                            <th className="w-24 px-3">Payment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Cash Section */}
                        <tr>
                            <td colSpan="8" className="bg-[#f0f0f0] text-left font-black py-2 px-3 uppercase tracking-tighter">CASH IN HAND</td>
                        </tr>
                        {data.cash.map((c, i) => (
                            <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{new Date(c.date).toLocaleDateString()}</td>
                                <td>{c.recNo}</td>
                                <td className="text-left font-bold uppercase">{c.customerName}</td>
                                <td className="uppercase">{c.recType}</td>
                                <td className="text-left italic text-slate-500">{c.particular}</td>
                                <td className="text-right">{c.received.toFixed(2)}</td>
                                <td className="text-right">{c.payment.toFixed(2)}</td>
                            </tr>
                        ))}
                        <tr className="font-bold bg-[#fafafa]">
                            <td colSpan="6" className="text-right pr-4">Total :</td>
                            <td className="text-right">{data.summary.cashRec?.toFixed(2)}</td>
                            <td className="text-right">{data.summary.cashPay?.toFixed(2)}</td>
                        </tr>

                        {/* Our Bank Section */}
                        <tr>
                            <td colSpan="8" className="bg-[#f0f0f0] text-left font-black py-2 px-3 uppercase tracking-tighter">OUR BANK</td>
                        </tr>
                        {data.bank.map((c, i) => (
                            <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{new Date(c.date).toLocaleDateString()}</td>
                                <td>{c.recNo}</td>
                                <td className="text-left font-bold uppercase">{c.customerName}</td>
                                <td className="uppercase text-[10px]">
                                    {c.recType}
                                    <div className="text-[9px] font-black text-blue-600 leading-tight mt-0.5">{c.bankName}</div>
                                </td>
                                <td className="text-left italic text-slate-500">{c.particular}</td>
                                <td className="text-right">{c.received.toFixed(2)}</td>
                                <td className="text-right">{c.payment.toFixed(2)}</td>
                            </tr>
                        ))}
                        <tr className="font-bold bg-[#fafafa]">
                            <td colSpan="6" className="text-right pr-4">Total :</td>
                            <td className="text-right">{data.summary.bankRec?.toFixed(2)}</td>
                            <td className="text-right">{data.summary.bankPay?.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Summaries & Stats Container */}
                <div className="space-y-8 flex flex-col items-center">
                    
                    {/* Financial Summary Table */}
                    <div className="w-[80%] max-w-4xl overflow-x-auto">
                        <table className="w-full reg-table border-collapse">
                            <thead>
                                <tr className="bg-[#689F38] text-white">
                                    <th className="bg-[#689F38] text-white border-white"></th>
                                    <th className="bg-[#689F38] text-white border-white uppercase">Recieved</th>
                                    <th className="bg-[#689F38] text-white border-white uppercase">Payment</th>
                                    <th className="bg-[#689F38] text-white border-white uppercase">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="font-bold uppercase">Cash</td>
                                    <td>{data.summary.cashRec?.toLocaleString()}</td>
                                    <td>{data.summary.cashPay?.toLocaleString()}</td>
                                    <td className="font-bold">{(data.summary.cashRec - data.summary.cashPay)?.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td className="font-bold uppercase">Bank</td>
                                    <td>{data.summary.bankRec?.toLocaleString()}</td>
                                    <td>{data.summary.bankPay?.toLocaleString()}</td>
                                    <td className="font-bold">{(data.summary.bankRec - data.summary.bankPay)?.toLocaleString()}</td>
                                </tr>
                                <tr className="bg-[#f0f0f0] font-black text-blue-600">
                                    <td className="uppercase">Total</td>
                                    <td>{(data.summary.cashRec + data.summary.bankRec)?.toLocaleString()}</td>
                                    <td>{(data.summary.cashPay + data.summary.bankPay)?.toLocaleString()}</td>
                                    <td>{(data.summary.cashRec + data.summary.bankRec - (data.summary.cashPay + data.summary.bankPay))?.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Expense Calculation Table */}
                    <div className="w-[80%] max-w-4xl overflow-x-auto">
                        <table className="w-full reg-table border-collapse">
                            <thead>
                                <tr className="bg-[#EF9A9A] text-slate-800">
                                    <th className="bg-[#EF9A9A] uppercase px-4">Recieved</th>
                                    <th className="bg-[#EF9A9A] uppercase px-4">Actual Exp.</th>
                                    <th className="bg-[#EF9A9A] uppercase px-4 whitespace-nowrap">Purchase Cost {filters.purchasePercent}%</th>
                                    <th className="bg-[#EF9A9A] uppercase px-4 whitespace-nowrap">Commission{filters.executivePercent}%</th>
                                    <th className="bg-[#EF9A9A] uppercase px-4 whitespace-nowrap">Other Exp.{filters.otherPercent}%</th>
                                    <th className="bg-[#EF9A9A] uppercase px-4">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="font-black">
                                    <td>{totalRecieved.toLocaleString()}</td>
                                    <td>{actualExp.toLocaleString()}</td>
                                    <td>{purchaseCost.toLocaleString()}</td>
                                    <td>{commissionCost.toLocaleString()}</td>
                                    <td>{otherCost.toLocaleString()}</td>
                                    <td>{finalBalance.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Categorized Token/Agreement Tables */}
                    <div className="w-full space-y-6">
                        
                        {/* Token Section */}
                        <div className="space-y-1">
                            <div className="bg-[#FFCC80] py-1 border border-black font-black text-center text-[10px] uppercase">
                                No. of Token : {tokens.length}
                            </div>
                            <table className="w-full reg-table border-collapse">
                                <thead className="bg-[#FFCC80]">
                                    <tr className="bg-[#FFCC80]">
                                        <th className="w-12 bg-[#FFCC80]">Sr.</th>
                                        <th className="bg-[#FFCC80] px-4 text-left">Name of Customer</th>
                                        <th className="bg-[#FFCC80] px-4 text-left">Project Name</th>
                                        <th className="w-32 bg-[#FFCC80]">Plot No.</th>
                                        <th className="w-32 bg-[#FFCC80]">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tokens.map((t, idx) => (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td className="text-left px-4 font-bold uppercase">{t.name}</td>
                                            <td className="text-left px-4">{t.project}</td>
                                            <td>{t.plotNo}</td>
                                            <td>{t.status}</td>
                                        </tr>
                                    ))}
                                    {tokens.length === 0 && (
                                        <tr><td colSpan="5" className="py-2 italic opacity-50">Empty Archive</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Agreement Section */}
                        <div className="space-y-1">
                            <div className="bg-[#AEEA00] py-1 border border-black font-black text-center text-[10px] uppercase">
                                No. of Agreement : {agreements.length}
                            </div>
                            <table className="w-full reg-table border-collapse">
                                <thead className="bg-[#AEEA00]">
                                    <tr className="bg-[#AEEA00]">
                                        <th className="w-12 bg-[#AEEA00]">Sr.</th>
                                        <th className="bg-[#AEEA00] px-4 text-left">Name of Customer</th>
                                        <th className="bg-[#AEEA00] px-4 text-left">Project Name</th>
                                        <th className="w-32 bg-[#AEEA00]">Plot No.</th>
                                        <th className="w-32 bg-[#AEEA00]">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {agreements.map((t, idx) => (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td className="text-left px-4 font-bold uppercase">{t.name}</td>
                                            <td className="text-left px-4">{t.project}</td>
                                            <td>{t.plotNo}</td>
                                            <td>{t.status}</td>
                                        </tr>
                                    ))}
                                    {agreements.length === 0 && (
                                        <tr><td colSpan="5" className="py-2 italic opacity-50">Empty Archive</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Cancelled Section */}
                        <div className="space-y-1">
                            <div className="bg-[#E0E0E0] py-1 border border-black font-black text-center text-[10px] uppercase">
                                No. of Cancelled : {cancelled.length}
                            </div>
                            <table className="w-full reg-table border-collapse">
                                <thead className="bg-[#E0E0E0]">
                                    <tr className="bg-[#E0E0E0]">
                                        <th className="w-12 bg-[#E0E0E0]">Sr.</th>
                                        <th className="bg-[#E0E0E0] px-4 text-left">Name of Customer</th>
                                        <th className="bg-[#E0E0E0] px-4 text-left">Project Name</th>
                                        <th className="w-32 bg-[#E0E0E0]">Plot No.</th>
                                        <th className="w-32 bg-[#E0E0E0]">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cancelled.map((t, idx) => (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td className="text-left px-4 font-bold uppercase">{t.name}</td>
                                            <td className="text-left px-4">{t.project}</td>
                                            <td>{t.plotNo}</td>
                                            <td>{t.status}</td>
                                        </tr>
                                    ))}
                                    {cancelled.length === 0 && (
                                        <tr><td colSpan="5" className="py-2 italic opacity-50">Empty Archive</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyCollectionRegister;
