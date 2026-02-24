import React, { useState, useEffect } from 'react';
import { reportAPI, projectAPI, executiveAPI } from '../api/services';
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
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleToggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isFullscreen]);

    const fetchInitialData = async () => {
        try {
            const [pRes, eRes] = await Promise.all([
                projectAPI.getAll(),
                executiveAPI.getAll()
            ]);
            setProjects(pRes.data.data || []);
            setExecutives(eRes.data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchReport = async (appliedFilters = filters) => {
        setLoading(true);
        try {
            const res = await reportAPI.getDues(appliedFilters);
            setData(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const newFilters = { ...filters, [e.target.name]: e.target.value };
        setFilters(newFilters);
        fetchReport(newFilters);
    };

    const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : '';

    if (loading && data.length === 0) return <div className="flex items-center justify-center min-h-[400px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Syncing EMI Repayment Schedule...</div>;

    const selectedExecName = executives.find(e => e._id === filters.executiveId)?.name || 'ALL EXECUTIVES';

    return (
        <div className="max-w-[100%] mx-auto space-y-4 animate-fade-in px-2 pb-20 font-serif">
            <style>
                {`
                    @media print {
                        @page { margin: 0.2cm; size: landscape; }
                        body * { visibility: hidden !important; }
                        .print-report, .print-report * { visibility: visible !important; }
                        .print-report {
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        .no-print { display: none !important; }
                    }
                    .dues-table th {
                        background-color: #00fa9a;
                        color: #333;
                        border: 1px solid #777;
                        padding: 8px 4px;
                        font-size: 13px;
                        font-weight: bold;
                    }
                    .dues-table td {
                        border: 1px solid #ccc;
                        padding: 8px 4px;
                        font-size: 13px;
                        text-align: center;
                    }
                    .dues-table .text-right { text-align: right; }
                    .dues-table .text-left { text-align: left; }
                    .fullscreen-mode {
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        background: white !important;
                        z-index: 9999 !important;
                        padding: 20px !important;
                        overflow: auto !important;
                    }
                `}
            </style>

            <div className="text-center no-print">
                <h1 className="text-2xl font-bold text-[#558B2F]">Customer Dues</h1>
                
                <div className="flex flex-wrap justify-center items-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-700">project :</label>
                        <select 
                            name="projectId" 
                            value={filters.projectId} 
                            onChange={handleChange}
                            className="px-3 py-1 bg-white border border-slate-300 rounded text-xs outline-none focus:border-emerald-500 shadow-sm min-w-[200px]"
                        >
                            <option value="">-- ALL PROJECTS --</option>
                            {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-700">Executive Wise :</label>
                        <select 
                            name="executiveId" 
                            value={filters.executiveId} 
                            onChange={handleChange}
                            className="px-3 py-1 bg-white border border-slate-300 rounded text-xs outline-none focus:border-emerald-500 shadow-sm min-w-[200px]"
                        >
                            <option value="">-- SELECT EXECUTIVE --</option>
                            {executives.map(e => <option key={e._id} value={e._id}>{e.name} [ {e.code} ]</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                        <button 
                            onClick={handleToggleFullscreen}
                            className={`p-1 px-2 border border-slate-300 rounded hover:bg-slate-100 shadow-sm transition-all ${isFullscreen ? 'bg-orange-500 text-white border-orange-600' : ''}`} 
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
                        >
                            {isFullscreen ? '✖' : '📊'}
                        </button>
                        <button onClick={() => window.print()} className="p-1 px-2 border border-slate-300 rounded hover:bg-slate-100 shadow-sm" title="Print Report">🖨️</button>
                    </div>
                </div>
            </div>

            <div className={`border border-slate-400 p-1 print-report ${isFullscreen ? 'fullscreen-mode' : ''}`}>
                {isFullscreen && (
                    <div className="no-print flex justify-between items-center bg-slate-800 text-white p-2 mb-2 rounded">
                        <span className="text-xs font-bold uppercase tracking-widest ml-2">Audit Mode: Full Table View</span>
                        <button onClick={handleToggleFullscreen} className="bg-rose-500 hover:bg-rose-600 px-3 py-1 rounded text-xs font-black">EXIT [ESC]</button>
                    </div>
                )}
                <div className="bg-[#FFEB3B] text-center py-2 border-b border-slate-400">
                    <h2 className="text-sm font-bold uppercase tracking-wide">Customer Due Summary</h2>
                    <p className="text-[11px] font-bold">Executive Name : {selectedExecName}</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full dues-table border-collapse">
                        <thead>
                            <tr>
                                <th>Sr</th>
                                <th>Name</th>
                                <th className="w-20">Plot No.</th>
                                <th>Area (Sq.Ft.)</th>
                                <th>EMI Amt</th>
                                <th>Cost</th>
                                <th>Paid Amt</th>
                                <th>Bal.</th>
                                <th className="w-24">DP/Paid</th>
                                <th>No.EMI</th>
                                <th>BE Amt</th>
                                <th>Interest</th>
                                <th>Total Bal.</th>
                                <th>Contact No.</th>
                                <th>Agent</th>
                                <th className="w-24">EMI Date</th>
                                <th className="w-8">N1</th>
                                <th className="w-8">N2</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((r, i) => (
                                <tr key={i} className="hover:bg-[#f9f9f9]">
                                    <td>{i + 1}</td>
                                    <td className="text-left font-bold uppercase whitespace-nowrap px-2">{r.name}</td>
                                    <td className="font-bold">{r.plotNo}</td>
                                    <td>{r.area}</td>
                                    <td>{r.emiAmt.toFixed(2)}</td>
                                    <td>{r.cost.toFixed(2)}</td>
                                    <td>{r.paidAmt.toFixed(2)}</td>
                                    <td>{r.balance.toFixed(2)}</td>
                                    <td>{r.dpPaid || 0}/0</td>
                                    <td className="p-0 border-none">
                                        <div className={`w-full h-full py-1 text-white font-bold flex items-center justify-center ${r.noEMI > 0 ? 'bg-[#FF9800]' : 'bg-[#4CAF50]'}`}>
                                            {r.noEMI}
                                        </div>
                                    </td>
                                    <td>{(r.beAmt || 0).toFixed(2)}</td>
                                    <td>{(r.interest || 0).toFixed(2)}</td>
                                    <td className="font-bold">{(r.totalBal || 0).toFixed(2)}</td>
                                    <td>{r.contactNo}</td>
                                    <td className="text-left text-[12px] px-2">{r.agent}</td>
                                    <td className="whitespace-nowrap">{formatDate(r.emiDate)}</td>
                                    <td className="p-0">🖨️</td>
                                    <td className="p-0">📓</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-[#00fa9a] font-bold">
                            <tr>
                                <td colSpan="4"></td>
                                <td>{data.reduce((acc, r) => acc + r.emiAmt, 0).toFixed(2)}</td>
                                <td>{data.reduce((acc, r) => acc + r.cost, 0).toFixed(2)}</td>
                                <td colSpan="4"></td>
                                <td>{data.reduce((acc, r) => acc + r.beAmt, 0 || 0).toFixed(2)}</td>
                                <td>{data.reduce((acc, r) => acc + r.interest, 0 || 0).toFixed(2)}</td>
                                <td>{data.reduce((acc, r) => acc + r.totalBal, 0 || 0).toFixed(2)}</td>
                                <td colSpan="5"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pb-10">Dange Associates Intelligence Platform © 2026</p>
        </div>
    );
};

export default CustomerDuesReport;
