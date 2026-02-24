import React, { useState, useEffect } from 'react';
import { reportAPI, projectAPI } from '../api/services';
import Layout from '../components/Layout';

const CustomerOutstandingReport = () => {
    const [data, setData] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        projectId: ''
    });

    useEffect(() => {
        fetchProjects();
        fetchReport();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await projectAPI.getAll();
            setProjects(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchReport = async (appliedFilters = filters) => {
        setLoading(true);
        try {
            const res = await reportAPI.getOutstanding(appliedFilters);
            setData(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const newFilters = { ...filters, [e.target.name]: e.target.value };
        setFilters(newFilters);
        fetchReport(newFilters);
    };

    if (loading && data.length === 0) return <div className="flex items-center justify-center min-h-[400px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Analyzing Outstanding Receivables...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in px-4 pb-20">
            <style>
                {`
                    @media print {
                        @page { margin: 0.5cm; size: portrait; }
                        body * { visibility: hidden !important; }
                        .print-container, .print-container * { visibility: visible !important; }
                        .print-container {
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            border: none !important;
                        }
                        .no-print { display: none !important; }
                    }
                `}
            </style>
            
            <div className="text-center no-print">
                <h1 className="text-3xl font-black text-[#558B2F]">Customer Outstanding</h1>
                
                <div className="flex justify-center items-center gap-2 mt-4">
                    <label className="text-xs font-bold text-slate-700">Project :</label>
                    <select 
                        name="projectId" 
                        value={filters.projectId} 
                        onChange={handleFilterChange}
                        className="px-3 py-1 bg-white border border-slate-300 rounded text-xs outline-none focus:border-orange-500 shadow-sm"
                    >
                        <option value="">-- ALL PROJECTS --</option>
                        {projects.map(p => (
                            <option key={p._id} value={p._id}>{p.projectName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Data Matrix with Orange Frame */}
            <div className="bg-white p-2 border-[3px] border-[#F38C32] rounded shadow-xl print-container">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-b from-[#FFA726] to-[#FB8C00] text-white">
                                <th className="border border-white py-2 px-4 text-sm font-bold uppercase tracking-tight">Customer Name</th>
                                <th className="border border-white py-2 px-2 text-sm font-bold uppercase tracking-tight w-24">Plot No.</th>
                                <th className="border border-white py-2 px-4 text-sm font-bold uppercase tracking-tight text-right w-32">Sale to</th>
                                <th className="border border-white py-2 px-4 text-sm font-bold uppercase tracking-tight text-right w-32">Reciept</th>
                                <th className="border border-white py-2 px-4 text-sm font-bold uppercase tracking-tight text-right w-32">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-200">
                                    <td className="border border-slate-200 px-4 py-2 text-center font-black text-slate-700 uppercase tracking-tighter text-xs">{row.name}</td>
                                    <td className="border border-slate-200 px-2 py-2 text-center font-bold text-slate-600 text-xs">{row.plotId?.plotNumber || 'N/A'}</td>
                                    <td className="border border-slate-200 px-4 py-2 text-right font-black text-slate-700 text-xs">{row.dealValue.toLocaleString('en-IN')}</td>
                                    <td className="border border-slate-200 px-4 py-2 text-right font-black text-slate-700 text-xs">{row.paidAmount.toLocaleString('en-IN')}</td>
                                    <td className="border border-slate-200 px-4 py-2 text-right font-black text-slate-700 text-xs">{row.balanceAmount.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">
                                        No Outstanding Data Found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {data.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-900 text-white font-black">
                                    <td className="border border-slate-700 px-4 py-3 text-right uppercase tracking-widest text-[10px]">Grand Total ➔</td>
                                    <td className="border border-slate-700 px-2 py-3 text-center text-xs">{data.length} Units</td>
                                    <td className="border border-slate-700 px-4 py-3 text-right text-xs">₹{data.reduce((acc, curr) => acc + curr.dealValue, 0).toLocaleString('en-IN')}</td>
                                    <td className="border border-slate-700 px-4 py-3 text-right text-xs">₹{data.reduce((acc, curr) => acc + curr.paidAmount, 0).toLocaleString('en-IN')}</td>
                                    <td className="border border-slate-700 px-4 py-3 text-right text-xs text-orange-400">₹{data.reduce((acc, curr) => acc + curr.balanceAmount, 0).toLocaleString('en-IN')}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            <div className="flex justify-end no-print">
                 <button onClick={() => window.print()} className="bg-slate-800 text-white px-8 py-2 rounded font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg active:scale-95">
                    Print Report Audit ➔
                 </button>
            </div>
        </div>
    );
};

export default CustomerOutstandingReport;
