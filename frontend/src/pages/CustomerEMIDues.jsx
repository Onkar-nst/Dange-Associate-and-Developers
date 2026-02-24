import React, { useState, useEffect, useRef } from 'react';
import { reportAPI, projectAPI, customerAPI } from '../api/services';
import logo from '../assets/logo.png';

const CustomerEMIDues = () => {
    // Top Report State (Img-1)
    const [data, setData] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        searchDate: new Date().toISOString().split('T')[0],
        monthsEnter: '',
        projectId: ''
    });

    // Customer Selection & Ledger State (Img-2)
    const [allCustomers, setAllCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedLedger, setSelectedLedger] = useState(null);
    const [ledgerLoading, setLedgerLoading] = useState(false);

    const reportRef = useRef();

    useEffect(() => {
        fetchInitial();
    }, []);

    const fetchInitial = async () => {
        try {
            const [pRes, cRes] = await Promise.all([
                projectAPI.getAll(),
                customerAPI.getAll()
            ]);
            setProjects(pRes.data.data || []);
            setAllCustomers(cRes.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await reportAPI.getCustomerEMIDues(filters);
            setData(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCustomerChange = async (e) => {
        const id = e.target.value;
        setSelectedCustomerId(id);
        if (!id) {
            setSelectedLedger(null);
            return;
        }
        setLedgerLoading(true);
        try {
            const res = await reportAPI.getCustomerDetailedLedger(id);
            setSelectedLedger(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLedgerLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const formatInDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-GB');
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* STYLES FOR PRINTING */}
            <style>
                {`
                @media print {
                    @page { margin: 10mm; size: A4 landscape; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white; }
                    .print-card { border: 1px solid #ccc !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; }
                    table { width: 100% !important; border-collapse: collapse !important; }
                    th, td { border: 1px solid #eee !important; padding: 4px !important; font-size: 10px !important; }
                }
                .print-only { display: none; }
                `}
            </style>

            {/* IMG-1 SECTION: TOP FILTER BAR */}
            <div className="max-w-[1600px] mx-auto px-4 mt-6 no-print">
                <div className="bg-slate-900 rounded-[2rem] p-4 shadow-xl shadow-blue-900/10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-[60px] -mr-16 -mt-16"></div>
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1 block">Date</label>
                            <input 
                                type="date" 
                                name="searchDate"
                                value={filters.searchDate}
                                onChange={handleFilterChange}
                                className="modern-input !bg-white/5 !border-white/10 !text-white !py-2 !px-3 font-bold text-[10px] uppercase rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1 block">Months</label>
                            <input 
                                type="number" 
                                name="monthsEnter"
                                value={filters.monthsEnter}
                                onChange={handleFilterChange}
                                placeholder="Due"
                                className="modern-input !bg-white/5 !border-white/10 !text-white !py-2 !px-3 font-bold text-[10px] uppercase rounded-xl"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1 block">Project Scope</label>
                            <select 
                                name="projectId"
                                value={filters.projectId}
                                onChange={handleFilterChange}
                                className="modern-input !bg-white/5 !border-white/10 !text-white !py-2 !px-3 font-bold text-[10px] uppercase rounded-xl"
                            >
                                <option value="" className="text-slate-800">-- ALL TICKETS --</option>
                                {projects.map(p => <option key={p._id} value={p._id} className="text-slate-800">{p.projectName}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2 flex gap-2">
                            <button 
                                onClick={fetchReport}
                                className="btn-primary flex-1 !py-2 rounded-xl uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 text-[9px] font-black flex items-center justify-center gap-2"
                            >
                                🛰️ Show
                            </button>
                            <button 
                                onClick={handlePrint}
                                className="bg-white/5 text-white px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 border border-white/5"
                            >
                                🖨️
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* IMG-1 SECTION: REPORT TABLE */}
            <div className="max-w-[1600px] mx-auto px-4 mt-8 no-print">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Customer EMI Matrix</h2>
                        {filters.projectId && (
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">Scope: {projects.find(p => p._id === filters.projectId)?.projectName}</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
                    <div className="overflow-x-auto">
                        <table className="modern-table border !border-slate-50 min-w-[1200px]">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="w-12 py-4 pl-8 text-center">#</th>
                                    <th>Client Entity</th>
                                    <th className="text-center">Plot</th>
                                    <th className="text-right">Area</th>
                                    <th className="text-right">EMI Amt</th>
                                    <th className="text-right">Project Value</th>
                                    <th className="text-right text-emerald-600">Realized</th>
                                    <th className="text-right text-rose-600">Outstanding</th>
                                    <th className="text-right">DP/Total</th>
                                    <th className="text-center">Agr.Date</th>
                                    <th className="text-center pr-8">Tenure</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((r, i) => (
                                    <tr key={r.id || i} className="hover:bg-slate-50 transition-colors border-b border-slate-50 group">
                                        <td className="py-3 pl-8 text-center text-slate-300 font-bold">{i + 1}</td>
                                        <td>
                                            <div className="font-black text-slate-800 uppercase tracking-tight text-[11px]">{r.name}</div>
                                        </td>
                                        <td className="text-center font-black text-slate-700">{r.plotNo}</td>
                                        <td className="text-right text-slate-400 font-mono text-[10px]">{r.area.toLocaleString('en-IN')}</td>
                                        <td className="text-right font-black text-blue-600">₹{r.emiAmount.toLocaleString('en-IN')}</td>
                                        <td className="text-right font-bold text-slate-600">₹{r.cost.toLocaleString('en-IN')}</td>
                                        <td className="text-right font-black text-emerald-600">₹{r.paidAmount.toLocaleString('en-IN')}</td>
                                        <td className="text-right font-black text-rose-600 bg-rose-50/20">₹{r.balance.toLocaleString('en-IN')}</td>
                                        <td className="text-right font-bold text-slate-400 text-[10px]">₹{r.dpPaid.toLocaleString('en-IN')}</td>
                                        <td className="text-center text-[10px] font-bold text-slate-500">{formatInDate(r.agreementDate)}</td>
                                        <td className="text-center font-black text-slate-700 pr-8">{r.noEmi}M</td>
                                    </tr>
                                ))}
                            {data.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="11" className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">
                                        No EMI Dues data available. Adjust filters and "Show".
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* IMG-2 SECTION: CUSTOMER SELECTION BAR */}
            <div className="max-w-[1600px] mx-auto px-4 mt-12 no-print">
                <div className="bg-slate-900 rounded-[2.5rem] p-1 flex items-center shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <select 
                        value={selectedCustomerId}
                        onChange={handleCustomerChange}
                        className="flex-1 h-12 px-6 border-none bg-transparent text-white text-[11px] font-black uppercase tracking-widest focus:outline-none appearance-none relative z-10 cursor-pointer"
                    >
                        <option value="" className="text-slate-800">-- SELECT CLIENT FOR DETAILED AUDIT --</option>
                        {allCustomers.map(c => (
                            <option key={c._id} value={c._id} className="text-slate-800">{c.name} ({c.phone})</option>
                        ))}
                    </select>
                    <button 
                        onClick={() => window.print()}
                        className="h-10 px-8 bg-blue-600 text-white font-black rounded-[1.5rem] shadow-xl hover:bg-blue-700 active:scale-95 transition-all text-[10px] uppercase tracking-widest mr-1 relative z-10"
                    >
                        🖨️ Generate
                    </button>
                </div>
            </div>

            {/* IMG-2 SECTION: CUSTOMER STATEMENT CARD */}
            <div className="p-4 flex justify-center mt-4">
                {selectedLedger ? (
                    <div className="w-full max-w-5xl border border-slate-400 p-1 bg-white shadow-xl print-card">
                        <div className="border border-slate-400 p-2 text-center">
                            <p className="text-[12px] font-bold">|| Om Sai Ram ||</p>
                            <div className="flex flex-col items-center justify-center py-2">
                                <img src={logo} alt="Logo" className="h-16 object-contain mb-1" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Connecting Your Dream</p>
                            </div>
                            <div className="border-t border-slate-300 mt-2 py-1 bg-slate-50">
                                <p className="text-[10px] font-black uppercase tracking-tight">Block No.7 Khadi Gram Sankul, Beside ICICI Bank, Kalmeshwar</p>
                            </div>
                        </div>

                        <div className="border border-slate-400 border-t-0 divide-y divide-slate-400 text-[11px]">
                            <div className="p-1 px-3 grid grid-cols-[150px_1fr]">
                                <span className="font-normal text-slate-500">Customer Name :</span>
                                <span className="font-black uppercase">{selectedLedger.customerInfo.name}</span>
                            </div>
                            <div className="p-1 px-3 grid grid-cols-[150px_1fr]">
                                <span className="font-normal text-slate-500">Address :</span>
                                <span className="font-black uppercase">{selectedLedger.customerInfo.address}</span>
                            </div>
                        </div>

                        <div className="border border-slate-400 border-t-0">
                            <table className="w-full text-left text-[11px] border-collapse border-hidden">
                                <tbody>
                                    <tr className="border-b border-slate-400">
                                        <td className="p-1 px-3 border-r border-slate-400 w-1/6 text-slate-500">Contact No.</td>
                                        <td className="p-1 px-3 border-r border-slate-400 w-1/3 font-black">{selectedLedger.customerInfo.phone}</td>
                                        <td className="p-1 px-3 border-r border-slate-400 w-1/6"></td>
                                        <td className="p-1 px-3 border-r border-slate-400 w-1/6"></td>
                                        <td className="p-1 px-3 border-r border-slate-400 w-1/6"></td>
                                        <td className="p-1 px-3 font-black"></td>
                                    </tr>
                                    <tr className="border-b border-slate-400">
                                        <td className="p-1 px-3 border-r border-slate-400 text-slate-500">Project</td>
                                        <td className="p-1 px-3 border-r border-slate-400 font-black uppercase text-blue-600">{selectedLedger.customerInfo.project}</td>
                                        <td className="p-1 px-3 border-r border-slate-400 text-slate-500">Plot No.</td>
                                        <td className="p-1 px-3 border-r border-slate-400 font-black">{selectedLedger.customerInfo.plotNo}</td>
                                        <td className="p-1 px-3 border-r border-slate-400 text-slate-500">Area * Rate</td>
                                        <td className="p-1 px-3 font-black">{selectedLedger.customerInfo.area} * {selectedLedger.customerInfo.rate}</td>
                                    </tr>
                                    <tr className="border-b border-slate-400">
                                        <td className="p-1 px-3 border-r border-slate-400 text-slate-500">Mauja</td>
                                        <td className="p-1 px-3 border-r border-slate-400 font-black uppercase">{selectedLedger.customerInfo.mauza || '-'}</td>
                                        <td className="p-1 px-3 border-r border-slate-400 text-slate-500">P.H.N.</td>
                                        <td className="p-1 px-3 border-r border-slate-400 font-black">{selectedLedger.customerInfo.phn || '-'}</td>
                                        <td className="p-1 px-3 border-r border-slate-400 text-slate-500">Khasara</td>
                                        <td className="p-1 px-3 font-black">{selectedLedger.customerInfo.khasara || '-'}</td>
                                    </tr>
                                    <tr className="border-b border-slate-400">
                                        <td className="p-1 px-3 border-r border-slate-400 text-slate-500">Taluka</td>
                                        <td className="p-1 px-3 border-r border-slate-400 font-black uppercase">{selectedLedger.customerInfo.taluka || '-'}</td>
                                        <td className="p-1 px-3 border-r border-slate-400 text-slate-500">District</td>
                                        <td className="p-1 px-3 border-r border-slate-400 font-black uppercase">{selectedLedger.customerInfo.district || '-'}</td>
                                        <td className="p-1 px-3 border-r border-slate-400 text-slate-500">Agr.Date</td>
                                        <td className="p-1 px-3 font-black">{formatInDate(selectedLedger.customerInfo.agreementDate)}</td>
                                    </tr>
                                    <tr className="border-b border-slate-400">
                                        <td className="p-1 px-3 border-r border-slate-400 text-slate-500">Executive</td>
                                        <td className="p-1 px-3 border-r border-slate-400 font-black uppercase text-indigo-700">{selectedLedger.customerInfo.executive || '-'}</td>
                                        <td className="p-1 px-3 border-r border-slate-400 text-slate-500">EMI Amount</td>
                                        <td className="p-1 px-3 border-r border-slate-400 font-black">{selectedLedger.customerInfo.emiAmount}/-</td>
                                        <td className="p-1 px-3 border-r border-slate-400 text-slate-500">Last Date</td>
                                        <td className="p-1 px-3 font-black">{formatInDate(selectedLedger.customerInfo.lastDate)}</td>
                                    </tr>
                                    <tr>
                                        <td className="p-1 px-3 border-r border-slate-400 text-slate-500">Remark</td>
                                        <td colSpan="5" className="p-1 px-3 italic text-slate-400">{selectedLedger.customerInfo.remark || '-'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 border border-slate-400 border-double border-4 overflow-hidden">
                            <table className="w-full text-left text-[11px] border-collapse">
                                <thead className="bg-slate-500 text-white font-black uppercase text-[10px]">
                                    <tr>
                                        <th className="p-2 border-r border-slate-400">Date / Tr.No.</th>
                                        <th className="p-2 border-r border-slate-400">Particular</th>
                                        <th className="p-2 border-r border-slate-400 text-right">Debit</th>
                                        <th className="p-2 border-r border-slate-400 text-right">Credit</th>
                                        <th className="p-2 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-400">
                                    {selectedLedger.ledger.map((item, idx) => (
                                        <tr key={idx} className="bg-white">
                                            <td className="p-2 border-r border-slate-400">
                                                <div className="font-bold">{formatInDate(item.date)}</div>
                                                <div className="text-[9px] text-slate-400 font-black">{item.trNo}</div>
                                            </td>
                                            <td className="p-2 border-r border-slate-400 font-medium">{item.particular}</td>
                                            <td className="p-2 border-r border-slate-400 text-right font-black">{item.debit.toLocaleString('en-IN')}</td>
                                            <td className="p-2 border-r border-slate-400 text-right font-black">{item.credit.toLocaleString('en-IN')}</td>
                                            <td className="p-2 text-right font-black">
                                                {Math.abs(item.balance).toLocaleString('en-IN')} {item.balance >= 0 ? 'Dr' : 'Cr'}
                                            </td>
                                        </tr>
                                    ))}
                                    {selectedLedger.ledger.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-5 text-center text-slate-300 font-bold uppercase tracking-widest text-[9px]">No transactions recorded for this customer</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-50 font-black">
                                    <tr>
                                        <td className="p-2 border-r border-slate-400"></td>
                                        <td className="p-2 border-r border-slate-400 text-right uppercase">Total :</td>
                                        <td className="p-2 border-r border-slate-400 text-right font-black text-rose-600">{selectedLedger.totalDebit.toLocaleString('en-IN')}</td>
                                        <td className="p-2 border-r border-slate-400 text-right font-black text-emerald-600">{selectedLedger.totalCredit.toLocaleString('en-IN')}</td>
                                        <td className="p-2"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-5xl border border-slate-200 border-dashed rounded-3xl p-20 flex flex-col items-center justify-center bg-slate-50 no-print">
                        <div className="text-6xl mb-4 grayscale opacity-10">📔</div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Select a customer to view detailed statement matrix</p>
                    </div>
                )}
            </div>

            <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] mt-10 no-print">Dange Associates Dual-Report Engine © 2026</p>
        </div>
    );
};

export default CustomerEMIDues;
