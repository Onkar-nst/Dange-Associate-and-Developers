import React, { useState, useEffect } from 'react';
import { reportAPI } from '../api/services';

const MonthlyEMIReminder = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCustomers, setSelectedCustomers] = useState([]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await reportAPI.getMonthlyEMIReminder({ date: selectedDate });
            setData(res.data.data || []);
            setSelectedCustomers([]); // Reset selection on new fetch
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedCustomers(data.map(r => r.sr));
        } else {
            setSelectedCustomers([]);
        }
    };

    const toggleSelect = (sr) => {
        if (selectedCustomers.includes(sr)) {
            setSelectedCustomers(selectedCustomers.filter(id => id !== sr));
        } else {
            setSelectedCustomers([...selectedCustomers, sr]);
        }
    };

    return (
        <div className="min-h-screen bg-white p-8 animate-fade-in">
            <style>
                {`
                    @media print {
                        .no-print { display: none !important; }
                    }
                    .emi-container {
                        border: 1.5px solid #444;
                        padding: 30px;
                        max-width: 1000px;
                        margin: 0 auto;
                        position: relative;
                        min-height: 500px;
                    }
                    .emi-table {
                        width: 100%;
                        border-collapse: separate;
                        border-spacing: 4px;
                        margin-top: 20px;
                    }
                    .emi-table th {
                        background-color: #AEEA0088;
                        border: 1px solid #ccc;
                        padding: 8px;
                        font-size: 13px;
                        font-weight: bold;
                        color: #333;
                    }
                    .emi-table td {
                        border: 1px solid #efefef;
                        padding: 8px;
                        font-size: 12px;
                        text-align: center;
                        color: #555;
                    }
                `}
            </style>

            <div className="emi-container shadow-2xl">
                {/* Filter Section */}
                <div className="flex justify-center items-center gap-3 no-print">
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border-[1.5px] border-[#fb8c00] rounded-md px-4 py-1.5 outline-none font-bold text-sm min-w-[200px]"
                    />
                    <button 
                        onClick={fetchReport}
                        className="bg-[#0D47A1] text-white px-8 py-1.5 rounded-md font-bold text-sm hover:bg-[#1565C0] transition-all shadow-md active:scale-95"
                    >
                        Show
                    </button>
                </div>

                {/* SMS Button */}
                <div className="mt-8 no-print">
                    <button 
                        className="bg-[#d32f2f] text-white px-6 py-1.5 rounded-md font-bold text-sm hover:bg-[#b71c1c] transition-all shadow-md active:scale-95 flex items-center gap-2"
                        onClick={() => alert(`Sending reminders to ${selectedCustomers.length} customers...`)}
                    >
                        Send SMS
                    </button>
                </div>

                {/* Report Content */}
                <div className="mt-8">
                    <h2 className="text-[#689F38] text-xl font-black italic tracking-wide mb-4">
                        All Instalments Date Wise Customers List
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="emi-table">
                            <thead>
                                <tr>
                                    <th className="w-10">
                                        <input 
                                            type="checkbox" 
                                            onChange={toggleSelectAll}
                                            checked={selectedCustomers.length === data.length && data.length > 0}
                                            className="accent-[#689F38] scale-110"
                                        />
                                    </th>
                                    <th>EMI Date</th>
                                    <th className="text-left px-4">Customer Name</th>
                                    <th>Plot No.</th>
                                    <th>EMI Amt.</th>
                                    <th>Contact No.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((r, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedCustomers.includes(r.sr)}
                                                onChange={() => toggleSelect(r.sr)}
                                                className="accent-[#689F38]"
                                            />
                                        </td>
                                        <td className="font-bold">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                                        <td className="text-left px-4 font-black uppercase text-slate-700">{r.name}</td>
                                        <td className="font-bold text-slate-600">{r.plotNo}</td>
                                        <td className="font-black text-slate-800">₹{r.emiAmount.toLocaleString('en-IN')}</td>
                                        <td className="font-bold text-slate-500">{r.phone}</td>
                                    </tr>
                                ))}
                                {data.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">
                                            No installments due for the selected day
                                        </td>
                                    </tr>
                                )}
                                {loading && (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center animate-pulse text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                            Compiling Daily Reminder Matrix...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Signature (Print only) */}
                <div className="hidden print:block mt-20 flex justify-between">
                    <div className="border-t border-black px-8 pt-2 text-[10px] font-bold">Authorized Signatory</div>
                    <div className="border-t border-black px-8 pt-2 text-[10px] font-bold">Manager Approval</div>
                </div>
            </div>

            <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] mt-10 no-print">
                Dange Associates Integrated Reminder System © 2026
            </p>
        </div>
    );
};

export default MonthlyEMIReminder;
