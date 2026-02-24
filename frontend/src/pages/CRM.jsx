import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI, projectAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const CRM = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterProject, setFilterProject] = useState('ALL');

    const statuses = ['Token', 'Booked', 'Agreement', 'Registered', 'Cancelled'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [custRes, projRes] = await Promise.all([
                customerAPI.getAll(),
                projectAPI.getAll({ active: true })
            ]);
            setCustomers(custRes.data.data || []);
            setProjects(projRes.data.data || []);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch CRM data:', err);
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await customerAPI.update(id, { transactionStatus: newStatus });
            setCustomers(prev => prev.map(c => c._id === id ? { ...c, transactionStatus: newStatus } : c));
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Failed to transition lead stage');
        }
    };

    const filteredCustomers = customers.filter(customer => {
        const matchesProject = filterProject === 'ALL' || customer.projectId?._id === filterProject;
        const matchesSearch = customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            customer.phone?.includes(searchTerm);
        return matchesProject && matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Syncing Pipeline...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10 px-4 mt-4">
                
                {/* Header Strategy */}
                <div className="bg-gradient-to-br from-slate-900 via-[#1B315A] to-slate-900 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden group border border-white/5">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-700"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="w-12 h-12 bg-white/10 backdrop-blur-2xl border border-white/10 rounded-xl flex items-center justify-center text-xl hover:bg-white hover:text-slate-900 transition-all active:scale-90 group/home shadow-lg"
                                title="Return to Dashboard"
                            >
                                <span className="group-hover/home:-translate-y-1 transition-transform">🏠</span>
                            </button>
                            <div className="space-y-1">
                                <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">
                                    CRM <span className="text-[#F38C32]">Pipeline</span>
                                </h1>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 text-nowrap">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Lifecycle Matrix
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl text-center shadow-lg">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Outreach</p>
                                <p className="text-2xl font-black text-white leading-none whitespace-nowrap">{filteredCustomers.length} <span className="text-[8px] text-slate-500">LEADS</span></p>
                            </div>
                            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl text-center shadow-lg">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Valuation</p>
                                <p className="text-2xl font-black text-emerald-400 leading-none">
                                    ₹{(filteredCustomers.reduce((acc, curr) => acc + (curr.dealValue || 0), 0) / 100000).toFixed(1)}L
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Command Bar */}
                <div className="flex flex-col xl:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <span className="text-slate-400 group-focus-within:text-blue-500 transition-colors text-sm">🔍</span>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Identify lead..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-xl shadow-sm outline-none font-bold text-[11px] text-slate-900 uppercase tracking-tight focus:border-blue-500 transition-all placeholder:text-slate-300"
                        />
                    </div>

                    <div className="w-full xl:w-72 relative">
                        <select 
                            value={filterProject}
                            onChange={(e) => setFilterProject(e.target.value)}
                            className="w-full pl-5 pr-10 py-3 bg-white border border-slate-100 rounded-xl shadow-sm outline-none font-bold text-[11px] text-slate-900 uppercase tracking-tight appearance-none cursor-pointer focus:border-[#F38C32] transition-all"
                        >
                            <option value="ALL">ALL VENTURES</option>
                            {projects.map(p => (
                                <option key={p._id} value={p._id}>{p.projectName}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-[10px]">
                            ▼
                        </div>
                    </div>

                    <button 
                        onClick={() => navigate('/customers?add=true')}
                        className="px-8 py-3 bg-[#F38C32] text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-500/20 hover:bg-[#1B315A] transition-all"
                    >
                        + NEW LEAD
                    </button>
                </div>

                {/* Pipeline Visualizer */}
                <div className="overflow-x-auto pb-6 scrollbar-hide -mx-2 px-2">
                    <div className="flex gap-4 min-w-[1200px]">
                        {statuses.map((status) => (
                            <div key={status} className="w-64 flex-shrink-0 flex flex-col gap-4">
                                {/* Pillar Header */}
                                <div className="flex items-center justify-between px-5 py-3 bg-slate-900 rounded-xl text-white shadow-lg relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 h-full w-1 ${status === 'Token' ? 'bg-orange-400' : status === 'Booked' ? 'bg-blue-400' : status === 'Agreement' ? 'bg-indigo-400' : status === 'Registered' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest italic">{status}</span>
                                    <span className="bg-white/10 px-2.5 py-0.5 rounded-lg text-[10px] font-black border border-white/5">
                                        {filteredCustomers.filter(c => (c.transactionStatus || 'Token') === status).length}
                                    </span>
                                </div>

                                {/* Pillar Cards */}
                                <div className="flex-1 space-y-3 min-h-[400px] p-1.5 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                    {filteredCustomers
                                        .filter(c => (c.transactionStatus || 'Token') === status)
                                        .map((customer) => (
                                            <div 
                                                key={customer._id}
                                                onClick={() => navigate(`/customers/${customer._id}`)}
                                                className="group bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden"
                                            >
                                                <div className={`absolute top-0 right-0 w-1.5 h-full ${status === 'Token' ? 'bg-orange-400' : status === 'Booked' ? 'bg-blue-400' : status === 'Agreement' ? 'bg-indigo-400' : status === 'Registered' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                                
                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-1.5">
                                                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">CP-{customer._id.slice(-4).toUpperCase()}</p>
                                                            <div className="flex gap-0.5">
                                                                {statuses.map((s, idx) => (
                                                                    <div 
                                                                        key={idx} 
                                                                        className={`w-3 h-0.5 rounded-full ${statuses.indexOf(customer.transactionStatus || 'Token') >= idx ? (status === 'Registered' ? 'bg-emerald-500' : 'bg-blue-500') : 'bg-slate-100'}`}
                                                                    ></div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">
                                                            {customer.firstName} {customer.lastName}
                                                        </h3>
                                                    </div>

                                                    <div className="space-y-2 bg-slate-50 p-2.5 rounded-lg group-hover:bg-blue-50/30 transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px]">🏢</span>
                                                            <span className="text-[9px] font-black text-slate-600 uppercase italic truncate">{customer.projectId?.projectName || 'No Project'}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px]">⛳</span>
                                                                <span className="text-[9px] font-black text-slate-500 uppercase">P-{customer.plotId?.plotNumber || 'NA'}</span>
                                                            </div>
                                                            <p className="text-[9px] font-black text-blue-500 tracking-tighter">{customer.phone}</p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                                                        <div className="flex gap-1.5">
                                                            {statuses.indexOf(status) > 0 && (
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const prevStatus = statuses[statuses.indexOf(status) - 1];
                                                                        handleStatusUpdate(customer._id, prevStatus);
                                                                    }}
                                                                    className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90 text-[10px]"
                                                                >
                                                                    ←
                                                                </button>
                                                            )}
                                                            {statuses.indexOf(status) < statuses.length - 1 && (
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const nextStatus = statuses[statuses.indexOf(status) + 1];
                                                                        handleStatusUpdate(customer._id, nextStatus);
                                                                    }}
                                                                    className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-90 text-[10px]"
                                                                >
                                                                    →
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[8px] font-black text-slate-900 tracking-tighter">₹{(customer.dealValue || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    
                                    {filteredCustomers.filter(c => (c.transactionStatus || 'Token') === status).length === 0 && (
                                        <div className="h-40 flex flex-col items-center justify-center opacity-20 grayscale scale-75">
                                            <div className="text-2xl mb-2">📭</div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Empty</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance Footprint Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-blue-400 italic">Conversion Velocity</h4>
                                <span className="text-xl">⚡</span>
                            </div>
                            <div>
                                <p className="text-3xl font-black italic tracking-tighter">
                                    {((filteredCustomers.filter(c => c.transactionStatus === 'Registered').length / (filteredCustomers.length || 1)) * 100).toFixed(1)}%
                                </p>
                                <div className="w-full h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000" 
                                        style={{ width: `${(filteredCustomers.filter(c => c.transactionStatus === 'Registered').length / (filteredCustomers.length || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-emerald-100 italic">Registry Count</h4>
                                <span className="text-xl">🏆</span>
                            </div>
                            <div>
                                <p className="text-3xl font-black italic tracking-tighter">
                                    {filteredCustomers.filter(c => c.transactionStatus === 'Registered').length} <span className="text-sm font-bold opacity-60">UNITS</span>
                                </p>
                                <p className="text-[9px] font-bold uppercase tracking-widest mt-2 text-emerald-100">Successful completions</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1B315A] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-orange-400 italic">Pipeline Value</h4>
                                <span className="text-xl">💰</span>
                            </div>
                            <div>
                                <p className="text-3xl font-black italic tracking-tighter">
                                    ₹{(filteredCustomers.reduce((acc, curr) => acc + (curr.dealValue || 0), 0) / 100000).toFixed(1)}L
                                </p>
                                <p className="text-[9px] font-bold uppercase tracking-widest mt-2 text-slate-400">Total potential revenue</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
    );
};

export default CRM;
