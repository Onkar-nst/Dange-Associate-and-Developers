import React, { useState, useEffect } from 'react';
import { reportAPI, executiveAPI } from '../api/services';
import Layout from '../components/Layout';
import logo from '../assets/logo.png'; // Assuming logo is here based on other files

const ExecutiveSalesReport = () => {
    const [executives, setExecutives] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [filters, setFilters] = useState({
        executiveId: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchExecutives();
    }, []);

    const fetchExecutives = async () => {
        try {
            const res = await executiveAPI.getAll();
            setExecutives(res.data.data || []);
        } catch (err) {
            console.error('Error fetching executives:', err);
        }
    };

    const fetchReport = async () => {
        if (!filters.executiveId) return;
        setLoading(true);
        try {
            const res = await reportAPI.getExecutiveBusiness(filters);
            setReportData(res.data);
        } catch (err) {
            console.error('Error fetching report:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const Label = ({ children }) => <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{children}</label>;

    return (
        <div className="max-w-7xl mx-auto p-4 space-y-6">
            <style>
                {`
                    @media print {
                        @page {
                            margin: 0.5cm;
                            size: A4 portrait;
                        }
                        body * {
                            visibility: hidden !important;
                        }
                        .print-area, .print-area * {
                            visibility: visible !important;
                        }
                        .print-area {
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                            width: 100% !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}
            </style>

            {/* Selection Header */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 no-print">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="md:col-span-1">
                        <Label>Executive Name</Label>
                        <select
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500"
                            value={filters.executiveId}
                            name="executiveId"
                            onChange={(e) => setFilters({ ...filters, executiveId: e.target.value })}
                        >
                            <option value="">Select Executive</option>
                            {executives.map(exec => (
                                <option key={exec._id} value={exec._id}>{exec.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label>Date From</Label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label>Date To</Label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchReport}
                            disabled={loading || !filters.executiveId}
                            className="flex-1 bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Show'}
                        </button>
                        {reportData && (
                            <button
                                onClick={handlePrint}
                                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all"
                            >
                                Print
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Report Content */}
            {reportData && (
                <div className="print-area bg-white p-4 font-serif">
                    <div className="border-[1px] border-slate-400 p-1 border-double border-4">
                        <div className="border border-slate-400 p-4">
                            {/* Branding Header */}
                            <div className="text-center space-y-1 mb-4">
                                <p className="text-[12px] font-bold">|| Om Sai Ram ||</p>
                                <div className="flex flex-col items-center justify-center py-2">
                                    <img src={logo} alt="Logo" className="h-16 object-contain mb-1" />
                                </div>
                            </div>

                            {/* Header Info */}
                            <div className="flex justify-between items-start text-[11px] mb-4 border-t border-slate-300 pt-4">
                                <div className="space-y-1">
                                    <p><span className="font-bold">Executive Name :</span> {reportData.executiveInfo.name}</p>
                                </div>
                                <div className="space-y-1 text-center">
                                    <p><span className="font-bold">Contact No.:</span> {reportData.executiveInfo.phone || 'N/A'}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p><span className="font-bold">PAN No.:</span> {reportData.executiveInfo.pan || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="text-center mb-6">
                                <h2 className="text-[12px] font-black uppercase tracking-tight">
                                    Executive Business statement Date from {filters.startDate || 'Start'} To {filters.endDate || 'Today'}
                                </h2>
                            </div>

                            {/* Personal Business Section */}
                            <div className="mb-6">
                                <div className="bg-[#90EE90] text-center py-1 border border-black text-xs font-black uppercase">
                                    Personal Business
                                </div>
                                <table className="w-full border-collapse border border-black text-[10px]">
                                    <thead>
                                        <tr className="bg-[#90EE90]">
                                            <th className="border border-black px-2 py-1 text-left w-1/2">Customer Name</th>
                                            <th className="border border-black px-2 py-1 text-right">Sale Amount</th>
                                            <th className="border border-black px-2 py-1 text-right">Rec. Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.personalBusiness.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="border border-black px-2 py-1 uppercase">{item.name}</td>
                                                <td className="border border-black px-2 py-1 text-right">{item.saleAmount.toLocaleString('en-IN')}</td>
                                                <td className="border border-black px-2 py-1 text-right">{item.recAmount.toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-[#90EE90] font-black text-right">
                                            <td className="border border-black px-2 py-1">Total</td>
                                            <td className="border border-black px-2 py-1">{reportData.personalTotal.sale.toLocaleString('en-IN')}</td>
                                            <td className="border border-black px-2 py-1">{reportData.personalTotal.rec.toLocaleString('en-IN')}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Group Business Section */}
                            <div>
                                <div className="bg-[#90EE90] text-center py-1 border border-black text-xs font-black uppercase">
                                    Group Business
                                </div>
                                <table className="w-full border-collapse border border-black text-[10px]">
                                    <thead>
                                        <tr className="bg-[#90EE90]">
                                            <th className="border border-black px-2 py-1 text-left w-1/2">Agent Name</th>
                                            <th className="border border-black px-2 py-1 text-right">Sale Amount</th>
                                            <th className="border border-black px-2 py-1 text-right">Rec. Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.groupBusiness.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="border border-black px-2 py-1 uppercase">{item.name}</td>
                                                <td className="border border-black px-2 py-1 text-right">{item.saleAmount.toLocaleString('en-IN')}</td>
                                                <td className="border border-black px-2 py-1 text-right">{item.recAmount.toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                        <tr className="font-black text-right">
                                            <td className="border border-black px-2 py-1 border-none" colSpan="2"></td>
                                            <td className="border border-black px-2 py-1">{reportData.groupTotal.rec.toLocaleString('en-IN')}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!reportData && !loading && (
                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em]">Select Executive and Date range to generate statement</p>
                </div>
            )}
        </div>
    );
};

export default ExecutiveSalesReport;
