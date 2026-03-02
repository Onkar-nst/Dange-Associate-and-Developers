import React, { useState, useEffect } from 'react';
import { jvAPI, ledgerAPI, userAPI, customerAPI } from '../api/services';
import Layout from '../components/Layout';

const JVEntry = () => {
    const [jvs, setJvs] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [executives, setExecutives] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [mode, setMode] = useState('add');
    const [selectedId, setSelectedId] = useState(null);

    const initialFormState = {
        branch: 'MAIN BRANCH',
        transactionDate: new Date().toISOString().split('T')[0],
        debitAccount: '',
        creditAccount: '',
        amount: 0,
        narration: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [jvRes, accRes, execRes, custRes] = await Promise.all([
                jvAPI.getAll(),
                ledgerAPI.getAll(),
                userAPI.getList(),
                customerAPI.getAll()
            ]);
            
            setJvs(jvRes.data.data || []);
            setAccounts(accRes.data.data || []);
            setExecutives((execRes.data.data || []).filter(u => ['Executive', 'Head Executive', 'The Boss'].includes(u.role)));
            setCustomers(custRes.data.data || []);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch initial data matrix');
            setLoading(false);
        }
    };

    const fetchJVs = async () => {
        try {
            const res = await jvAPI.getAll();
            setJvs(res.data.data || []);
        } catch (err) {
            setError('Failed to refresh JV synchronization');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const combinedAccounts = [
        ...accounts.map(a => ({ id: a._id, name: a.accountName, type: 'ledger_account', code: a.branch.slice(0,3).toUpperCase(), icon: '🏦' })),
        ...executives.map(e => ({ id: e._id, name: e.name, type: 'executive', code: e.userId, icon: '👔' })),
        ...customers.map(c => ({ id: c._id, name: c.name, type: 'customer', code: 'CUST', icon: '👤' }))
    ];

    const filteredJVs = jvs.filter(jv => {
        if (!formData.debitAccount && !formData.creditAccount) return true;
        const isMatched = (partyId) => 
            (formData.debitAccount && partyId === formData.debitAccount) || 
            (formData.creditAccount && partyId === formData.creditAccount);
        return isMatched(jv.debitAccount.partyId) || isMatched(jv.creditAccount.partyId);
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.debitAccount === formData.creditAccount) {
            setError('Operational Error: Debit and Credit entities must be distinct');
            return;
        }
        if (formData.amount <= 0) {
            setError('Fiscal Error: Transaction amount must be positive');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const debitParty = combinedAccounts.find(a => a.id === formData.debitAccount);
            const creditParty = combinedAccounts.find(a => a.id === formData.creditAccount);

            const payload = {
                branch: formData.branch,
                transactionDate: formData.transactionDate,
                amount: parseFloat(formData.amount),
                narration: formData.narration,
                debitAccount: {
                    partyType: debitParty.type,
                    partyId: debitParty.id,
                    accountName: `${debitParty.name} - ${debitParty.code}`
                },
                creditAccount: {
                    partyType: creditParty.type,
                    partyId: creditParty.id,
                    accountName: `${creditParty.name} - ${creditParty.code}`
                }
            };

            if (mode === 'edit') {
                await jvAPI.update(selectedId, payload);
                setSuccess('Protocol Success: JV Ledger Posting Updated');
            } else {
                await jvAPI.create(payload);
                setSuccess('Protocol Success: JV Ledger Posting Complete');
            }

            setFormData(initialFormState);
            setMode('add');
            setSelectedId(null);
            fetchJVs();
        } catch (err) {
            setError(err.response?.data?.error || 'System Error: Ledger Posting Failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (jv) => {
        setMode('edit');
        setSelectedId(jv._id);
        setFormData({
            branch: jv.branch,
            transactionDate: new Date(jv.transactionDate).toISOString().split('T')[0],
            debitAccount: jv.debitAccount.partyId,
            creditAccount: jv.creditAccount.partyId,
            amount: jv.amount,
            narration: jv.narration
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setMode('add');
        setSelectedId(null);
        setFormData(initialFormState);
        setError('');
        setSuccess('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to DEACTIVATE this JV record?')) return;
        try {
            await jvAPI.delete(id);
            fetchJVs();
        } catch (err) {
            setError('Operational Failure: JV Deletion Protocol Terminated');
        }
    };

    const Label = ({ children, icon }) => (
        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1 mb-1 block flex items-center gap-2">
            <span>{icon}</span> {children}
        </label>
    );

    if (loading) return <div className="flex items-center justify-center min-h-[400px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Syncing Journal Matrix...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-fade-in px-4 pb-20">
                
                {/* Protocol Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-4">
                            <span>📓</span> Journal Voucher Entry
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Double-Entry Fiscal Integrity & Internal Multi-Entity Transfers</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Entry Form Section */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="bg-white rounded-[2rem] p-5 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                            
                            <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label icon="🏢">Operational Branch</Label>
                                        <select 
                                            name="branch"
                                            value={formData.branch}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-[11px] uppercase text-slate-700 focus:border-blue-500 focus:bg-white transition-all outline-none"
                                        >
                                            <option value="MAIN BRANCH">CENTRAL HUB</option>
                                            <option value="SUB BRANCH">REGIONAL UNIT</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label icon="📅">Posting Date</Label>
                                        <input 
                                            type="date"
                                            name="transactionDate"
                                            value={formData.transactionDate}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-[11px] text-slate-700 focus:border-blue-500 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 rounded-[1.5rem] bg-blue-50/30 border border-blue-100/50 space-y-3 relative overflow-hidden">
                                        <div>
                                            <Label icon="➖">Debit Account (From)</Label>
                                            <select 
                                                name="debitAccount"
                                                value={formData.debitAccount}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2 font-bold text-[11px] uppercase text-slate-700 focus:border-blue-600 transition-all outline-none shadow-sm"
                                            >
                                                <option value="">-- SELECT SOURCE --</option>
                                                {combinedAccounts.map(a => (
                                                    <option key={a.id} value={a.id}>{a.icon} {a.name} ({a.code})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <Label icon="💎">Amount (₹)</Label>
                                            <input 
                                                type="number"
                                                name="amount"
                                                value={formData.amount}
                                                onChange={handleChange}
                                                className="w-full bg-transparent border-b border-blue-200 py-1 text-2xl font-black text-blue-600 outline-none focus:border-blue-600 transition-all placeholder:text-blue-200"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-[1.5rem] bg-rose-50/30 border border-rose-100/50 space-y-3 relative overflow-hidden">
                                        <div>
                                            <Label icon="➕">Credit Account (To)</Label>
                                            <select 
                                                name="creditAccount"
                                                value={formData.creditAccount}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-white border border-rose-200 rounded-xl px-4 py-2 font-bold text-[11px] uppercase text-slate-700 focus:border-rose-600 transition-all outline-none shadow-sm"
                                            >
                                                <option value="">-- SELECT TARGET --</option>
                                                {combinedAccounts.map(a => (
                                                    <option key={a.id} value={a.id}>{a.icon} {a.name} ({a.code})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <Label icon="✍️">Narration</Label>
                                            <input 
                                                type="text"
                                                name="narration"
                                                value={formData.narration}
                                                onChange={handleChange}
                                                className="w-full bg-transparent border-b border-rose-200 py-1 text-xs font-bold text-slate-600 outline-none focus:border-rose-600 transition-all placeholder:text-rose-200"
                                                placeholder="Explain purpose..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button 
                                        type="submit"
                                        disabled={submitting}
                                        className={`flex-1 ${mode === 'edit' ? 'bg-blue-600' : 'bg-[#1B315A]'} text-white py-3 rounded-lg font-black uppercase tracking-[0.1em] text-[10px] shadow-lg hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-30`}
                                    >
                                        {submitting ? 'Post...' : (mode === 'edit' ? 'Update' : 'Post Entry')}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-6 bg-slate-100 text-slate-500 py-3 rounded-lg font-black uppercase tracking-widest text-[9px] hover:bg-slate-200 transition-all"
                                    >
                                        {mode === 'edit' ? 'Cancel' : 'Clear'}
                                    </button>
                                </div>

                                {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-shake leading-relaxed">{error}</div>}
                                {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-fade-in">{success}</div>}
                            </form>
                        </div>
                    </div>

                    {/* JV Audit Table Section */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[800px]">
                            <div className="bg-[#5BC0DE] px-6 py-2 text-white">
                                <h2 className="text-base font-bold">JV Detail</h2>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-slate-200">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-200">
                                            <th className="border-r border-slate-200 p-2 text-left font-bold text-slate-800 text-[11px]">Del</th>
                                            <th className="border-r border-slate-200 p-2 text-left font-bold text-slate-800 text-[11px]">Date</th>
                                            <th className="border-r border-slate-200 p-2 text-left font-bold text-slate-800 text-[11px]">Dr/Cr</th>
                                            <th className="border-r border-slate-200 p-2 text-left font-bold text-slate-800 text-[11px]">Tr.No.</th>
                                            <th className="border-r border-slate-200 p-2 text-left font-bold text-slate-800 text-[11px]">Account</th>
                                            <th className="p-2 text-right font-bold text-slate-800 text-[11px]">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {filteredJVs.map((jv) => (
                                            <React.Fragment key={jv._id}>
                                                {/* Debit Row */}
                                                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                    <td className="border-r border-slate-200 p-2 text-center" rowSpan="2">
                                                        <div className="flex flex-col gap-1 items-center">
                                                            <button 
                                                                onClick={() => handleDelete(jv._id)}
                                                                className="px-2 py-1 bg-[#5BC0DE] text-white text-[10px] font-bold rounded shadow-sm hover:brightness-95 active:scale-95 transition-all"
                                                            >
                                                                Del
                                                            </button>
                                                            <button 
                                                                onClick={() => handleEdit(jv)}
                                                                className="text-[#5BC0DE] hover:text-[#46b8da] transition-colors"
                                                            >
                                                                <span className="text-[9px] font-bold uppercase tracking-tight">Edit</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="border-r border-slate-200 p-2 text-[#333] font-medium text-[11px]" rowSpan="2">
                                                        {new Date(jv.transactionDate).toISOString().split('T')[0]}
                                                    </td>
                                                    <td className="border-r border-slate-200 p-2 text-center text-[#555] font-bold text-[11px]">D</td>
                                                    <td className="border-r border-slate-200 p-2 text-[#555] font-medium text-[11px]" rowSpan="2">
                                                        {jv.jvNumber}
                                                    </td>
                                                    <td className="border-r border-slate-200 p-2 text-[#333] font-bold text-[11px]">
                                                        {jv.debitAccount.accountName}
                                                    </td>
                                                    <td className="p-2 text-right font-bold text-slate-800 text-[11px]">
                                                        {jv.amount.toLocaleString('en-IN')}
                                                    </td>
                                                </tr>
                                                {/* Credit Row */}
                                                <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                                    <td className="border-r border-slate-200 p-2 text-center text-[#555] font-bold text-[11px]">C</td>
                                                    <td className="border-r border-slate-200 p-2 text-[#333] italic font-medium text-[11px]">
                                                        {jv.creditAccount.accountName}
                                                        <div className="text-[8px] text-slate-400 mt-0.5">{jv.narration}</div>
                                                    </td>
                                                    <td className="p-2 text-right font-bold text-slate-400 italic text-[11px]">
                                                        {jv.amount.toLocaleString('en-IN')}
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        ))}
                                        {filteredJVs.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="py-40 text-center">
                                                    <div className="text-6xl mb-6 grayscale opacity-10">📜</div>
                                                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">Audit Trail Clean / No Postings Found</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>

                <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pb-10">Dange Associates Enterprise Ledger Infrastructure © 2026</p>
            </div>
    );
};

export default JVEntry;
