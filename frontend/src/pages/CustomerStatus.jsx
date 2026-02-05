import React, { useState, useEffect } from 'react';
import { customerAPI, projectAPI, userAPI } from '../api/services';
import Layout from '../components/Layout';

const CustomerStatus = () => {
    const [customers, setCustomers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [executives, setExecutives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Filters
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterProject, setFilterProject] = useState('');
    const [filterType, setFilterType] = useState('First Name');

    // Report Modal
    const [showReportModal, setShowReportModal] = useState(false);

    // Advanced Edit Modal (Edit Exec)
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [modalExecs, setModalExecs] = useState([]); 
    const [selectedExecToAdd, setSelectedExecToAdd] = useState('');
    const [customerRate, setCustomerRate] = useState(0);

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
            setError('Failed to fetch data matrix');
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterProject) params.projectId = filterProject;
            const res = await customerAPI.getAll(params);
            let filtered = res.data.data || [];
            
            if (filterCustomer) {
                const searchLower = filterCustomer.toLowerCase();
                filtered = filtered.filter(c => {
                    if (filterType === 'First Name') return c.firstName?.toLowerCase().includes(searchLower) || c.name?.toLowerCase().includes(searchLower);
                    if (filterType === 'Last Name') return c.lastName?.toLowerCase().includes(searchLower);
                    if (filterType === 'Phone') return c.phone?.includes(searchLower);
                    return c.name?.toLowerCase().includes(searchLower);
                });
            }
            setCustomers(filtered);
            setLoading(false);
        } catch (err) {
            setError('Search protocol failed');
            setLoading(false);
        }
    };

    const openEditModal = (customer) => {
        setEditingCustomer(customer);
        setModalExecs(customer.assignedExecutives || []);
        setCustomerRate(customer.rate || 0);
        setShowEditModal(true);
    };

    const handleAddExecToModal = () => {
        if (!selectedExecToAdd) return;
        const exists = modalExecs.find(e => e.executiveId?._id === selectedExecToAdd || e.executiveId === selectedExecToAdd);
        if (exists) return;

        const execObj = executives.find(e => e._id === selectedExecToAdd);
        setModalExecs([...modalExecs, { executiveId: execObj, percentage: 0 }]);
        setSelectedExecToAdd('');
    };

    const handleRemoveExecFromModal = (id) => {
        setModalExecs(modalExecs.filter(e => (e.executiveId?._id || e.executiveId) !== id));
    };

    const handlePercentageChange = (id, val) => {
        setModalExecs(modalExecs.map(e => {
            const execId = e.executiveId?._id || e.executiveId;
            if (execId === id) return { ...e, percentage: parseFloat(val) || 0 };
            return e;
        }));
    };

    const handleSaveEditChanges = async () => {
        try {
            const formattedExecs = modalExecs.map(e => ({
                executiveId: e.executiveId?._id || e.executiveId,
                percentage: e.percentage
            }));

            await customerAPI.update(editingCustomer._id, {
                assignedExecutives: formattedExecs,
                rate: customerRate,
                dealValue: customerRate * (editingCustomer.sqFt || 0) 
            });

            setShowEditModal(false);
            fetchInitialData();
        } catch (err) {
            setError('Failed to persist synchronization changes');
        }
    };

    const handleDeleteCustomer = async (id) => {
        if (!window.confirm('Are you sure you want to ARCHIVE this operational data?')) return;
        try {
            await customerAPI.delete(id);
            fetchInitialData();
        } catch (err) {
            setError('Operational deactivation failed');
        }
    };

    const handleExportCSV = () => {
        if (customers.length === 0) {
            setError('Data archive is empty');
            return;
        }
        
        const headers = ["Customer Name", "Phone", "Project", "Plot No", "Status", "Area (SqFt)", "Rate", "Total Deal Value"];
        const rows = customers.map(c => [
            `"${c.name}"`,
            `"${c.phone}"`,
            `"${c.projectId?.projectName || 'NA'}"`,
            `"${c.plotId?.plotNumber || 'NA'}"`,
            `"${c.transactionStatus || 'Token'}"`,
            c.sqFt || 0,
            c.rate || 0,
            (c.sqFt || 0) * (c.rate || 0)
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Dange_Cust_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const stats = {
        total: customers.length,
        registered: customers.filter(c => c.transactionStatus === 'Registered').length,
        pending: customers.filter(c => c.transactionStatus !== 'Registered').length,
        totalSqFt: customers.reduce((acc, curr) => acc + (curr.sqFt || 0), 0)
    };

    const StatCard = ({ label, value, icon, color }) => (
        <div className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] transition-transform duration-700 group-hover:scale-150 ${color === 'blue' ? 'bg-blue-600' : color === 'emerald' ? 'bg-emerald-600' : 'bg-slate-900'} rounded-full blur-3xl -mr-16 -mt-16`}></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-lg ${color === 'blue' ? 'bg-blue-600 shadow-blue-500/20 text-white' : color === 'emerald' ? 'bg-emerald-600 shadow-emerald-500/20 text-white' : 'bg-slate-900 shadow-slate-900/10 text-white'}`}>
                    {icon}
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2 py-1 bg-slate-50 rounded-lg">Operational</div>
            </div>
            <div className="relative z-10">
                <div className="text-3xl font-black text-slate-800 mb-1 tracking-tighter uppercase">{value}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none border-l-2 border-slate-100 pl-3">{label}</div>
            </div>
        </div>
    );

    if (loading) return <Layout><div className="flex items-center justify-center min-h-[400px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Scanning Client Matrix...</div></Layout>;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-fade-in px-4">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/30 backdrop-blur-md p-8 rounded-[3rem] border border-white/50 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-4">
                           <span className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-xl shadow-xl shadow-slate-900/10">👥</span>
                           <div>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Client Status</h1>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Audit & Deployment Center</p>
                           </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleExportCSV} className="px-6 py-3.5 bg-white border border-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm">
                            <span>📥</span> Export Matrix
                        </button>
                        <button onClick={() => setShowReportModal(true)} className="btn-primary px-8 py-3.5 rounded-2xl shadow-xl shadow-blue-500/20 uppercase tracking-widest text-[10px] flex items-center gap-3 font-black">
                            <span>📊</span> Executive Reports
                        </button>
                    </div>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatCard label="Total Portfolio" value={stats.total} icon="💼" color="slate" />
                    <StatCard label="Registered" value={stats.registered} icon="✅" color="emerald" />
                    <StatCard label="Token/Pending" value={stats.pending} icon="⏳" color="blue" />
                    <StatCard label="Gross Area Mapped" value={`${stats.totalSqFt.toLocaleString()} sqft`} icon="📐" color="slate" />
                </div>

                {/* Refined Filter Bar */}
                <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl shadow-blue-900/20 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                        <div className="md:col-span-5 space-y-3">
                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Search Profile</label>
                            <input 
                                type="text" 
                                value={filterCustomer} 
                                onChange={(e) => setFilterCustomer(e.target.value)}
                                placeholder="Enter Name, ID or Phone identifier..."
                                className="modern-input !bg-white/5 !border-white/10 !text-white !py-4 font-black text-sm"
                            />
                        </div>
                        <div className="md:col-span-3 space-y-3">
                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Archive Category</label>
                            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="modern-input !bg-white/5 !border-white/10 !text-white !py-4 font-black text-[10px] uppercase">
                                <option value="First Name" className="text-slate-800">Legal First Name</option>
                                <option value="Last Name" className="text-slate-800">Surname Identity</option>
                                <option value="Phone" className="text-slate-800">Phone Signal</option>
                            </select>
                        </div>
                        <div className="md:col-span-3 space-y-3">
                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Project Spectrum</label>
                            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="modern-input !bg-white/5 !border-white/10 !text-white !py-4 font-black text-[10px] uppercase">
                                <option value="" className="text-slate-800">Global Archive (All)</option>
                                {projects.map(p => <option key={p._id} value={p._id} className="text-slate-800">{p.projectName}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <button onClick={handleSearch} className="w-full h-[54px] bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center text-xl font-black">
                                📡
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error Pulse */}
                {error && <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[11px] font-black uppercase tracking-widest text-center animate-pulse">{error}</div>}

                {/* Enterprise Table */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th className="pl-10">Client Profile</th>
                                <th className="text-center">Venture & Log</th>
                                <th>Sales Deployment</th>
                                <th>Fiscal Documents</th>
                                <th className="text-right pr-10">Administration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((c) => (
                                <tr key={c._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="pl-10">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white text-lg transition-transform group-hover:scale-110">
                                                {c.name?.[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-800 uppercase tracking-tight text-sm">{c.name}</div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-black text-slate-400 font-mono tracking-tighter">{c.phone}</span>
                                                    <a href={`https://wa.me/${c.phone}`} target="_blank" className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1">
                                                        <span>💬</span> WhatsApp
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-center italic">
                                        <div className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1">{c.projectId?.projectName || 'NA'}</div>
                                        <div className="flex justify-center gap-1.5">
                                            <span className="text-[8px] font-black px-2 py-1 bg-slate-100 text-slate-500 rounded-lg uppercase tracking-widest">UNIT: {c.plotId?.plotNumber || 'NA'}</span>
                                            <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${c.transactionStatus === 'Registered' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {c.transactionStatus || 'Token'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-wrap gap-1 max-w-[160px]">
                                                {c.assignedExecutives && c.assignedExecutives.length > 0 ? c.assignedExecutives.map((e, idx) => (
                                                    <span key={idx} className="bg-slate-900 text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tight">{e.executiveId?.name}</span>
                                                )) : <span className="text-[9px] font-black text-slate-300 uppercase italic">Unassigned Units</span>}
                                            </div>
                                            <button onClick={() => openEditModal(c)} className="text-[8px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2 hover:translate-x-1 transition-transform">
                                                <span>⚙️</span> Sync Executives
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                            {['Agreement', 'NMRDA', 'Deed', 'Farm'].map(type => (
                                                <a key={type} href={`#`} className="text-[8px] font-black px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all uppercase tracking-widest">
                                                    {type}
                                                </a>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="text-right pr-10">
                                        <div className="flex justify-end gap-3">
                                            <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-blue-600 shadow-sm active:scale-95">Update Log</button>
                                            <button onClick={() => handleDeleteCustomer(c._id)} className="w-10 h-10 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all flex items-center justify-center shadow-sm">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* High-End Edit Modal */}
                {showEditModal && editingCustomer && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-fade-in">
                        <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] border border-white/20">
                            
                            <div className="md:w-80 bg-slate-900 p-12 text-white relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                                <div className="relative z-10 space-y-10">
                                    <div>
                                        <div className="bg-blue-600 text-[9px] font-black px-3 py-1.5 rounded-xl w-fit uppercase tracking-widest mb-6 shadow-lg shadow-blue-500/20">Audit Active</div>
                                        <h3 className="text-3xl font-black mb-1 uppercase tracking-tighter">{editingCustomer.name}</h3>
                                        <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase">ID: {editingCustomer._id.slice(-8).toUpperCase()}</p>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Summary</p>
                                            <div className="text-sm font-black uppercase tracking-tight">{editingCustomer.projectId?.projectName}</div>
                                            <div className="h-px bg-white/10"></div>
                                            <div className="flex justify-between text-[10px] font-black">
                                                <span className="text-slate-500">Unit ID</span>
                                                <span className="text-blue-400">{editingCustomer.plotId?.plotNumber}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-black">
                                                <span className="text-slate-500">Area</span>
                                                <span className="text-blue-400">{editingCustomer.sqFt} sqft</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Calibrated Sale Rate (₹)</label>
                                            <input 
                                                type="number" 
                                                value={customerRate} 
                                                onChange={(e) => setCustomerRate(parseFloat(e.target.value) || 0)}
                                                className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] outline-none font-black text-2xl text-blue-400 shadow-inner focus:border-blue-500/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 p-12 overflow-y-auto flex flex-col bg-[#fcfdfe]">
                                <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                        <span>🧬</span> Deployment & Incentives
                                    </h3>
                                    <button onClick={() => setShowEditModal(false)} className="w-12 h-12 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl flex items-center justify-center font-black transition-all shadow-sm">✕</button>
                                </div>

                                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm mb-10">
                                    <div className="flex flex-col lg:flex-row gap-6 items-end">
                                        <div className="flex-1 space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deploy New Personnel</label>
                                            <select 
                                                value={selectedExecToAdd} 
                                                onChange={(e) => setSelectedExecToAdd(e.target.value)}
                                                className="modern-input font-black uppercase"
                                            >
                                                <option value="">-- ARCHIVE --</option>
                                                {executives.map(e => <option key={e._id} value={e._id}>{e.name} ({e.userId})</option>)}
                                            </select>
                                        </div>
                                        <button onClick={handleAddExecToModal} className="btn-primary px-10 h-[54px] rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Assign Entity</button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-x-auto min-h-[300px]">
                                    <table className="modern-table">
                                        <thead>
                                            <tr>
                                                <th>Personnel Entity</th>
                                                <th className="text-center">Allocation (%)</th>
                                                <th className="text-right pr-4">Nett Incentive</th>
                                                <th className="text-right">Admin</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {modalExecs.map((item, idx) => {
                                                const exec = item.executiveId;
                                                const execId = exec?._id || exec;
                                                const potential = (customerRate * (editingCustomer.sqFt || 0) * (item.percentage / 100));
                                                return (
                                                    <tr key={idx} className="group hover:bg-white transition-colors">
                                                        <td>
                                                            <div className="font-black text-slate-800 uppercase tracking-tight">{exec?.name || 'Unknown Unit'}</div>
                                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: {exec?.userId || 'NA'}</div>
                                                        </td>
                                                        <td className="text-center">
                                                            <input 
                                                                type="number" 
                                                                value={item.percentage} 
                                                                onChange={(e) => handlePercentageChange(execId, e.target.value)}
                                                                className="w-20 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-center font-black text-blue-600 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"
                                                            />
                                                        </td>
                                                        <td className="text-right">
                                                            <div className="text-sm font-black text-slate-800">₹{potential.toLocaleString()}</div>
                                                            <div className="text-[9px] text-slate-300 font-bold uppercase tracking-widest italic">Live Calculation</div>
                                                        </td>
                                                        <td className="text-right">
                                                            <button onClick={() => handleRemoveExecFromModal(execId)} className="w-10 h-10 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all flex items-center justify-center font-bold shadow-sm">✕</button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="pt-10 flex gap-4">
                                    <button onClick={handleSaveEditChanges} className="flex-1 bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-slate-900/10 transition-all uppercase tracking-[0.3em] text-[11px] hover:bg-blue-600 active:scale-95">Commit Operations</button>
                                    <button onClick={() => setShowEditModal(false)} className="px-12 bg-white text-slate-400 font-black rounded-[2rem] border border-slate-100 transition-all uppercase tracking-widest text-[11px] hover:bg-slate-50">Discard</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CustomerStatus;
