import React, { useState, useEffect } from 'react';
import { reportAPI } from '../api/services';

const ExecutiveCustomerReminder = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [message, setMessage] = useState('');
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'Customer',
        reminderType: 'Date of Birth'
    });

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await reportAPI.getBirthdayReminders(filters);
            setData(res.data.data || []);
            setSelectedIds([]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(data.map((_, idx) => idx));
        }
    };

    const toggleSelect = (idx) => {
        if (selectedIds.includes(idx)) {
            setSelectedIds(selectedIds.filter(id => id !== idx));
        } else {
            setSelectedIds([...selectedIds, idx]);
        }
    };

    const handleSendSMS = () => {
        if (selectedIds.length === 0) {
            alert('Please select at least one recipient');
            return;
        }
        if (!message.trim()) {
            alert('Please enter a message correctly');
            return;
        }
        const selectedPhones = selectedIds.map(idx => data[idx].phone);
        alert(`Sending SMS to ${selectedIds.length} recipients: ${selectedPhones.join(', ')}\n\nMessage: ${message}`);
    };

    return (
        <div className="w-full font-sans animate-fade-in p-4">
            {/* Top Bar Filter */}
            <div className="bg-[#56CCF2] p-2 flex flex-wrap items-center gap-4 rounded-t-lg shadow-sm">
                <input 
                    type="date" 
                    name="date"
                    value={filters.date}
                    onChange={handleFilterChange}
                    className="border border-slate-300 px-3 py-1 text-sm bg-white rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <select 
                    name="type" 
                    value={filters.type}
                    onChange={handleFilterChange}
                    className="border border-slate-300 px-3 py-1 text-sm bg-white rounded min-w-[120px] focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                    <option value="Customer">Customer</option>
                    <option value="Executive">Executive</option>
                </select>
                <select 
                    name="reminderType" 
                    value={filters.reminderType}
                    onChange={handleFilterChange}
                    className="border border-slate-300 px-3 py-1 text-sm bg-white rounded min-w-[150px] focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                    <option value="Date of Birth">Date of Birth</option>
                    <option value="Marriage Anniversary">Marriage Anniversary</option>
                </select>
                <button 
                    onClick={fetchReport}
                    className="bg-[#2D9CDB] hover:bg-blue-600 text-white px-6 py-1 rounded text-sm font-bold shadow-md transition-all active:scale-95"
                >
                    Show
                </button>
            </div>

            <div className="p-6 border-l border-r border-b border-slate-300 bg-white shadow-lg rounded-b-lg">
                {/* Actions Section */}
                <div className="mb-6 space-y-4">
                    <div>
                        <button 
                            onClick={handleSendSMS}
                            className="bg-[#EB5757] hover:bg-rose-600 text-white px-5 py-2 rounded text-sm font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 mb-4"
                        >
                            Send SMS
                        </button>
                        <div className="text-[#6FCF97] font-black text-[11px] uppercase tracking-widest mb-2 flex items-center gap-2">
                             Note : Please, Enter 160 Charcters for 1 SMS
                        </div>
                        <textarea 
                            className="w-full md:w-80 h-32 border border-slate-400 p-3 text-sm rounded shadow-inner focus:outline-none focus:border-blue-400 transition-colors bg-slate-50 font-medium"
                            placeholder="Type your message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto rounded-lg border border-slate-300">
                    <table className="w-full border-collapse text-xs md:text-sm">
                        <thead className="bg-[#AEEA00]">
                            <tr className="border-b border-slate-400">
                                <th className="border-r border-slate-400 p-3 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded cursor-pointer"
                                        checked={data.length > 0 && selectedIds.length === data.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="border-r border-slate-400 p-3 text-left font-black uppercase tracking-tighter">Sr.No.</th>
                                <th className="border-r border-slate-400 p-3 text-left font-black uppercase tracking-tighter">Name</th>
                                <th className="border-r border-slate-400 p-3 text-left font-black uppercase tracking-tighter">Exe.Code</th>
                                <th className="border-r border-slate-400 p-3 text-left font-black uppercase tracking-tighter">Plot.No</th>
                                <th className="border-r border-slate-400 p-3 text-left font-black uppercase tracking-tighter">Contact No.</th>
                                <th className="p-3 text-left font-black uppercase tracking-tighter">DOB</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr key={idx} className={`border-b border-slate-200 transition-colors ${selectedIds.includes(idx) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                    <td className="border-r border-slate-200 p-3 text-center">
                                        <input 
                                            type="checkbox"
                                            className="w-4 h-4 rounded cursor-pointer"
                                            checked={selectedIds.includes(idx)}
                                            onChange={() => toggleSelect(idx)}
                                        />
                                    </td>
                                    <td className="border-r border-slate-200 p-3 font-bold text-slate-500">{idx + 1}</td>
                                    <td className="border-r border-slate-200 p-3 font-black text-slate-900 uppercase tracking-tight">{row.name}</td>
                                    <td className="border-r border-slate-200 p-3 font-black text-[#2D9CDB]">{row.exeCode}</td>
                                    <td className="border-r border-slate-200 p-3 font-bold">{row.plotNo}</td>
                                    <td className="border-r border-slate-200 p-3 font-mono font-bold text-slate-600">{row.phone}</td>
                                    <td className="p-3 font-black text-slate-700">{row.dob}</td>
                                </tr>
                            ))}
                            {data.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="7" className="py-24 text-center">
                                        <div className="text-4xl mb-4 grayscale opacity-30">📅</div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No Birthdays / Anniversaries Found for this Date</p>
                                    </td>
                                </tr>
                            )}
                            {loading && (
                                <tr>
                                    <td colSpan="7" className="py-24 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                                        </div>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mt-4">Syncing Central Audit Records...</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ExecutiveCustomerReminder;
