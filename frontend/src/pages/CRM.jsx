import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI, projectAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';

const CRM = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterProject, setFilterProject] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

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
        } catch (err) {
            console.error('CRM Data Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const statuses = ['Token', 'Booked', 'Agreement', 'Registered', 'Cancelled'];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Token': return 'border-orange-500 text-orange-600 bg-orange-50';
            case 'Booked': return 'border-blue-500 text-blue-600 bg-blue-50';
            case 'Agreement': return 'border-indigo-500 text-indigo-600 bg-indigo-50';
            case 'Registered': return 'border-emerald-500 text-emerald-600 bg-emerald-50';
            case 'Cancelled': return 'border-rose-500 text-rose-600 bg-rose-50';
            default: return 'border-slate-500 text-slate-600 bg-slate-50';
        }
    };

    const filteredCustomers = customers.filter(c => {
        const matchesProject = filterProject === 'ALL' || c.projectId?._id === filterProject;
        const matchesSearch = (c.firstName + ' ' + c.lastName).toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (c.phone && c.phone.includes(searchTerm));
        return matchesProject && matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="font-black text-slate-300 uppercase tracking-[0.5em] animate-pulse italic">
                    Initializing Sales Matrix...
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
            
            {/* Header Strategy */}
            <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic italic">
                            CRM <span className="text-[#F38C32]">Pipeline</span>
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">
                            Global Lifecycle Management & Conversion Matrix
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md text-center group-hover:bg-white/10 transition-colors">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Pipeline</p>
                            <p className="text-2xl font-black text-white">{filteredCustomers.length}</p>
                        </div>
                        <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md text-center group-hover:bg-white/10 transition-colors">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Deal Val</p>
                            <p className="text-2xl font-black text-emerald-400">
                                ₹{(filteredCustomers.reduce((acc, curr) => acc + (curr.dealValue || 0), 0) / 100000).toFixed(1)}L
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tactical Controls */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <span className="text-slate-400 group-focus-within:text-blue-500 transition-colors text-lg">🔍</span>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search assets by holder name or identity number..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm outline-none font-black text-xs text-slate-900 uppercase tracking-tight focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                    />
                </div>

                <div className="w-full md:w-80 relative">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <span className="text-slate-400 text-lg">🎯</span>
                    </div>
                    <select 
                        value={filterProject}
                        onChange={(e) => setFilterProject(e.target.value)}
                        className="w-full pl-14 pr-10 py-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm outline-none font-black text-xs text-slate-900 uppercase tracking-tight appearance-none cursor-pointer focus:border-[#F38C32] transition-all"
                    >
                        <option value="ALL">ALL VENTURES</option>
                        {projects.map(p => (
                            <option key={p._id} value={p._id}>{p.projectName}</option>
                        ))}
                    </select>
                </div>

                <button 
                    onClick={() => navigate('/customers')}
                    className="px-10 py-5 bg-[#F38C32] text-white rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                    + Deploy New Lead
                </button>
            </div>

            {/* Global Pipeline Matrix */}
            <div className="overflow-x-auto pb-10 scrollbar-hide">
                <div className="flex gap-8 min-w-[1200px]">
                    {statuses.map((status) => (
                        <div key={status} className="w-80 flex-shrink-0 space-y-6">
                            {/* Column Identity */}
                            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 rounded-2xl text-white shadow-lg sticky top-0 z-10">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">{status}</span>
                                <span className="bg-white/10 px-2 py-0.5 rounded-lg text-[10px] font-black">
                                    {filteredCustomers.filter(c => (c.transactionStatus || 'Token') === status).length}
                                </span>
                            </div>

                            {/* Column Body */}
                            <div className="space-y-4 min-h-[200px] p-2">
                                {filteredCustomers
                                    .filter(c => (c.transactionStatus || 'Token') === status)
                                    .map((customer) => (
                                        <div 
                                            key={customer._id}
                                            onClick={() => navigate(`/customers/${customer._id}`)}
                                            className="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer relative overflow-hidden"
                                        >
                                            <div className={`absolute top-0 right-0 w-2 h-full ${status === 'Token' ? 'bg-orange-400' : status === 'Booked' ? 'bg-blue-400' : status === 'Agreement' ? 'bg-indigo-400' : status === 'Registered' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Lead ID: CP-{customer._id.slice(-4).toUpperCase()}</p>
                                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">
                                                        {customer.firstName} {customer.lastName}
                                                    </h3>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs">🏢</span>
                                                        <span className="text-[9px] font-black text-slate-600 uppercase italic truncate">{customer.projectId?.projectName || 'No Project'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs">⛳</span>
                                                        <span className="text-[9px] font-black text-slate-500 uppercase">Plot: {customer.plotId?.plotNumber || 'N/A'}</span>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Deal Value</p>
                                                        <p className="text-xs font-black text-slate-800 tracking-tighter italic">₹{(customer.dealValue || 0).toLocaleString('en-IN')}</p>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                                                        ➔
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                
                                {filteredCustomers.filter(c => (c.transactionStatus || 'Token') === status).length === 0 && (
                                    <div className="h-40 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center grayscale opacity-30">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] font-black text-[10px]">Zero Presence</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Strategic Footer Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-3xl -mr-12 -mt-12 group-hover:scale-150 transition-transform"></div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">⚡</div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efficiency Index</p>
                            <p className="text-xl font-black text-slate-900 tracking-tighter">
                                {((filteredCustomers.filter(c => c.transactionStatus === 'Registered').length / (filteredCustomers.length || 1)) * 100).toFixed(1)}%
                            </p>
                            <div className="w-32 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 transition-all duration-1000" 
                                    style={{ width: `${(filteredCustomers.filter(c => c.transactionStatus === 'Registered').length / (filteredCustomers.length || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-3xl -mr-12 -mt-12 group-hover:scale-150 transition-transform"></div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🏛️</div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Acquisitions</p>
                            <p className="text-xl font-black text-slate-900 tracking-tighter">
                                {filteredCustomers.filter(c => c.transactionStatus === 'Registered').length} <span className="text-[10px] text-slate-400 uppercase">Closed Units</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-3xl -mr-12 -mt-12 group-hover:scale-150 transition-transform"></div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">📉</div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Retention Attrition</p>
                            <p className="text-xl font-black text-slate-900 tracking-tighter">
                                {filteredCustomers.filter(c => c.transactionStatus === 'Cancelled').length} <span className="text-[10px] text-slate-400 uppercase">Assets Lost</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default CRM;
