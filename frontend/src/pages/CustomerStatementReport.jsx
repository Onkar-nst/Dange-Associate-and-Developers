import React, { useState, useEffect } from 'react';
import { reportAPI, projectAPI } from '../api/services';
import Layout from '../components/Layout';
import logo from '../assets/logo.png';

const CustomerStatementReport = () => {
    const [data, setData] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        projectId: ''
    });

    const [selectedLedger, setSelectedLedger] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const handleViewLedger = async (id) => {
        setLoading(true);
        try {
            const res = await reportAPI.getCustomerDetailedLedger(id);
            setSelectedLedger(res.data);
            setIsModalOpen(true);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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

    const formatInDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-GB');
    };

    if (loading && data.length === 0) return <div className="flex items-center justify-center min-h-[400px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Aggregating Global Statements...</div>;

    return (
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
                                <option value="booked" className="text-slate-800">BOOKED</option>
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
                                                <button onClick={() => handleViewLedger(row.id)} className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Quick View">👁️</button>
                                                <button onClick={() => handleViewLedger(row.id)} className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Detailed Ledger">📔</button>
                                            </div>
                                        </td>
                                        <td className="text-center font-bold text-slate-300">{idx + 1}</td>
                                        <td>
                                            <div className="font-black text-slate-800 uppercase tracking-tight text-[11px]">{row.name}</div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">verified_partner_id: {row.id?.slice(-6)}</div>
                                        </td>
                                        <td className="text-center font-black text-slate-900">{row.plotNo}</td>
                                        <td className="text-right text-slate-400 font-mono">₹{row.cost.toLocaleString('en-IN')}</td>
                                        <td className="text-right font-black text-emerald-600 bg-emerald-50/10">₹{row.received.toLocaleString('en-IN')}</td>
                                        <td className="text-right font-black text-rose-500 bg-rose-50/10">₹{row.balance.toLocaleString('en-IN')}</td>
                                        <td className="pr-10 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                row.status === 'Registered' ? 'bg-emerald-100 text-emerald-600' : 
                                                row.status === 'Cancelled' ? 'bg-rose-100 text-rose-600' : 'bg-blue-50 text-blue-600'
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
                                        <td className="text-right text-slate-400 font-mono">₹{data.reduce((acc, curr) => acc + curr.cost, 0).toLocaleString('en-IN')}</td>
                                        <td className="text-right text-emerald-400 font-mono">₹{data.reduce((acc, curr) => acc + curr.received, 0).toLocaleString('en-IN')}</td>
                                        <td className="text-right text-rose-400 font-mono text-lg">₹{data.reduce((acc, curr) => acc + curr.balance, 0).toLocaleString('en-IN')}</td>
                                        <td className="pr-10"></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                {/* Ledger Modal - Classic Print Style */}
                {isModalOpen && selectedLedger && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto print-container">
                        <div className="bg-white w-full max-w-5xl my-10 rounded-2xl shadow-2xl flex flex-col relative animate-scale-up print-modal">
                            <div className="flex justify-between items-center p-6 border-b bg-slate-50 sticky top-0 z-20 rounded-t-2xl print:hidden">
                                <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                                    <span>🔍</span> Detailed Statement : {selectedLedger.customerInfo.name}
                                </h3>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => window.print()}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"
                                    >
                                        🖨️ Print
                                    </button>
                                    <button 
                                        onClick={() => setIsModalOpen(false)}
                                        className="bg-white border-2 border-slate-200 text-slate-400 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>

                            <style>
                                {`
                                    @media print {
                                        @page {
                                            margin: 0.5cm;
                                            size: A4 portrait;
                                        }

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
                                        }

                                        .print-modal {
                                            position: static !important;
                                            width: 100% !important;
                                            max-width: none !important;
                                            margin: 0 !important;
                                            padding: 0 !important;
                                            border: none !important;
                                            box-shadow: none !important;
                                            display: block !important;
                                            background: white !important;
                                        }

                                        .print-area {
                                            width: 100% !important;
                                            margin: 0 !important;
                                            padding: 0 !important;
                                            display: block !important;
                                        }

                                        /* Explicitly hide specific elements even within the container */
                                        .print\\:hidden, button, .no-print, header, footer {
                                            display: none !important;
                                            height: 0 !important;
                                            width: 0 !important;
                                        }

                                        table {
                                            width: 100% !important;
                                            border-collapse: collapse !important;
                                            page-break-inside: auto !important;
                                        }
                                        tr {
                                            page-break-inside: avoid !important;
                                        }
                                        thead {
                                            display: table-header-group !important;
                                        }
                                    }
                                `}
                            </style>

                            <div className="p-8 print:p-0 print-area">
                                {/* Report Frame - MIMIC IMAGE DESIGN */}
                                <div className="bg-white border-[1px] border-slate-400 p-1 font-serif text-slate-900 border-double border-4">
                                    {/* Header Section */}
                                    <div className="border border-slate-400 p-2 text-center space-y-1">
                                        <p className="text-[12px] font-bold">|| Om Sai Ram ||</p>
                                        <div className="flex flex-col items-center justify-center py-2">
                                            <img src={logo} alt="Logo" className="h-16 object-contain mb-1" />
                                            <p className="text-[10px] font-bold uppercase">Connecting Your Dream</p>
                                        </div>
                                    </div>

                                    {/* Branch Address */}
                                    <div className="border border-slate-400 border-t-0 p-1 text-center bg-slate-50">
                                        <p className="text-[11px] font-black uppercase tracking-tight">Block No.7 Khadi Gram Sankul, Beside ICICI Bank, Kalmeshwar</p>
                                    </div>

                                    {/* Customer Basic Info */}
                                    <div className="border border-slate-400 border-t-0 grid grid-cols-1 divide-y divide-slate-400 text-[11px]">
                                        <div className="p-1 px-3">
                                            <span className="font-normal">Customer Name : </span>
                                            <span className="font-black uppercase">{selectedLedger.customerInfo.name}</span>
                                        </div>
                                        <div className="p-1 px-3">
                                            <span className="font-normal">Address : </span>
                                            <span className="font-black uppercase">{selectedLedger.customerInfo.address}</span>
                                        </div>
                                    </div>

                                    {/* Detailed Grid Table */}
                                    <div className="border border-slate-400 border-t-0 text-[11px]">
                                        <table className="w-full border-collapse border-hidden">
                                            <tbody>
                                                <tr className="border-b border-slate-400">
                                                    <td className="border-r border-slate-400 p-1 px-2 w-[15%]">Contact No.</td>
                                                    <td className="border-r border-slate-400 p-1 px-2 w-[30%] font-black">{selectedLedger.customerInfo.phone}</td>
                                                    <td className="border-r border-slate-400 p-1 px-2 w-[15%]"></td>
                                                    <td className="border-r border-slate-400 p-1 px-2 w-[10%]"></td>
                                                    <td className="border-r border-slate-400 p-1 px-2 w-[15%]"></td>
                                                    <td className="p-1 px-2 font-black"></td>
                                                </tr>
                                                <tr className="border-b border-slate-400">
                                                    <td className="border-r border-slate-400 p-1 px-2">Project</td>
                                                    <td className="border-r border-slate-400 p-1 px-2 font-black uppercase">{selectedLedger.customerInfo.project}</td>
                                                    <td className="border-r border-slate-400 p-1 px-2">Plot No.</td>
                                                    <td className="border-r border-slate-400 p-1 px-2 font-black">{selectedLedger.customerInfo.plotNo}</td>
                                                    <td className="border-r border-slate-400 p-1 px-2">Area * Rate</td>
                                                    <td className="p-1 px-2 font-black">{selectedLedger.customerInfo.area} * {selectedLedger.customerInfo.rate}</td>
                                                </tr>
                                                <tr className="border-b border-slate-400">
                                                    <td className="border-r border-slate-400 p-1 px-2">Mauja</td>
                                                    <td className="border-r border-slate-400 p-1 px-2 font-black uppercase">{selectedLedger.customerInfo.mauza || 'N/A'}</td>
                                                    <td className="border-r border-slate-400 p-1 px-2">P.H.N.</td>
                                                    <td className="border-r border-slate-400 p-1 px-2 font-black">{selectedLedger.customerInfo.phn || 'N/A'}</td>
                                                    <td className="border-r border-slate-400 p-1 px-2">Khasara</td>
                                                    <td className="p-1 px-2 font-black">{selectedLedger.customerInfo.khasara || 'N/A'}</td>
                                                </tr>
                                                <tr className="border-b border-slate-400">
                                                    <td className="border-r border-slate-400 p-1 px-2">Taluka</td>
                                                    <td className="border-r border-slate-400 p-1 px-2 font-black uppercase">{selectedLedger.customerInfo.taluka || 'N/A'}</td>
                                                    <td className="border-r border-slate-400 p-1 px-2">District</td>
                                                    <td className="border-r border-slate-400 p-1 px-2 font-black uppercase">{selectedLedger.customerInfo.district || 'N/A'}</td>
                                                    <td className="border-r border-slate-400 p-1 px-2">Agr.Date</td>
                                                    <td className="p-1 px-2 font-black">{formatInDate(selectedLedger.customerInfo.agreementDate)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-400">
                                                    <td className="border-r border-slate-400 p-1 px-2">Executive</td>
                                                    <td className="border-r border-slate-400 p-1 px-2 font-black uppercase text-indigo-700">
                                                        {selectedLedger.customerInfo.executive}-{selectedLedger.customerInfo.executiveId}
                                                    </td>
                                                    <td className="border-r border-slate-400 p-1 px-2">EMI Amount</td>
                                                    <td className="border-r border-slate-400 p-1 px-2 font-black">{selectedLedger.customerInfo.emiAmount}/-</td>
                                                    <td className="border-r border-slate-400 p-1 px-2">Last Date</td>
                                                    <td className="p-1 px-2 font-black">{formatInDate(selectedLedger.customerInfo.lastDate)}</td>
                                                </tr>
                                                <tr>
                                                    <td className="border-r border-slate-400 p-1 px-2">Remark</td>
                                                    <td colSpan="5" className="p-1 px-2 italic text-slate-600">{selectedLedger.customerInfo.remark || 'N/A'}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Transaction Ledger Table */}
                                    <div className="mt-4 border border-slate-400 border-double border-4">
                                        <table className="w-full border-collapse text-[11px]">
                                            <thead>
                                                <tr className="bg-slate-500 text-white font-black text-left">
                                                    <th className="border border-slate-400 p-2 w-[12%]">Date / Tr.No.</th>
                                                    <th className="border border-slate-400 p-2">Particular</th>
                                                    <th className="border border-slate-400 p-2 text-right w-[15%]">Debit</th>
                                                    <th className="border border-slate-400 p-2 text-right w-[15%]">Credit</th>
                                                    <th className="border border-slate-400 p-2 text-right w-[15%]">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedLedger.ledger.map((entry, eIdx) => {
                                                    const isSpecial = entry.trNo && (entry.trNo.startsWith('JV') || entry.trNo.startsWith('CD') || entry.trNo.startsWith('BD'));
                                                    return (
                                                        <tr key={eIdx} className="border-b border-slate-400 align-top">
                                                            <td className="border-r border-slate-400 p-2">
                                                                <div className="font-bold">{formatInDate(entry.date)}</div>
                                                                <div className={`font-black uppercase text-[10px] mt-0.5 ${isSpecial ? 'text-rose-600' : 'text-slate-400'}`}>{entry.trNo}</div>
                                                            </td>
                                                            <td className="border-r border-slate-400 p-2 font-medium">
                                                                {entry.particular}
                                                            </td>
                                                            <td className="border-r border-slate-400 p-2 text-right font-black">
                                                                {entry.debit > 0 ? entry.debit.toLocaleString('en-IN') : '0'}
                                                            </td>
                                                            <td className="border-r border-slate-400 p-2 text-right font-black">
                                                                {entry.credit > 0 ? entry.credit.toLocaleString('en-IN') : '0'}
                                                            </td>
                                                            <td className="p-2 text-right font-black">
                                                                {Math.abs(entry.balance).toLocaleString('en-IN')} {entry.balance >= 0 ? 'Dr' : 'Cr'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {/* Filler Rows if needed or just Footer */}
                                                <tr className="border-t-2 border-slate-600 font-black bg-slate-50">
                                                    <td className="border-r border-slate-400 p-2"></td>
                                                    <td className="border-r border-slate-400 p-2 text-right">TOTAL :</td>
                                                    <td className="border-r border-slate-400 p-2 text-right">{selectedLedger.totalDebit.toLocaleString('en-IN')}</td>
                                                    <td className="border-r border-slate-400 p-2 text-right">{selectedLedger.totalCredit.toLocaleString('en-IN')}</td>
                                                    <td className="p-2 text-right"></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 border-t flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-b-2xl print:hidden">
                                <div>Dange Associates - Ledger Generation System</div>
                                <div>v2.1.0-STABLE</div>
                            </div>
                        </div>
                    </div>
                )}

                <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pb-10">Dange Associates Intelligence Vault © 2026</p>
            </div>
    );
};

export default CustomerStatementReport;

