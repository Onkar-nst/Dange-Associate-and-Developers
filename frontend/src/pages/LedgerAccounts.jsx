import React, { useState, useEffect } from 'react';
import { ledgerAPI } from '../api/services';
import Layout from '../components/Layout';

const LedgerAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [showTransactionForm, setShowTransactionForm] = useState(false);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [editForm, setEditForm] = useState({});

    const [transactionData, setTransactionData] = useState({
        amount: 0,
        description: '',
        entryType: 'Payment',
        date: new Date().toISOString().split('T')[0]
    });

    const initialFormState = {
        accountName: '',
        accountNumber: '',
        branch: 'MAIN BRANCH',
        address: '',
        openingBalance: 0,
        balanceType: 'Dr',
        type: 'OTHER LEGERS',
        group: 'INDIRECT EXPENSES',
        mode: 'Ledger'
    };

    const [formData, setFormData] = useState(initialFormState);

    const accountGroups = [
        'INDIRECT EXPENSES',
        'BANK ACCOUNTS',
        'CAPITAL ACCOUNT',
        'INDIRECT INCOMES',
        'SUNDRY CREDITORS',
        'CASH AND BANK BALANCES',
        'BANK BOOK'
    ];

    useEffect(() => { fetchAccounts(); }, []);

    const fetchAccounts = async () => {
        try {
            const res = await ledgerAPI.getAll();
            setAccounts(res.data.data || []);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch accounts');
            setLoading(false);
        }
    };

    const fetchTransactions = async (accountId) => {
        try {
            const res = await ledgerAPI.getTransactions(accountId);
            setTransactions(res.data.data || []);
        } catch (err) {
            setError('Failed to fetch transactions');
        }
    };

    const handleSelectAccount = (account) => {
        setSelectedAccount(account);
        fetchTransactions(account._id);
        setViewMode('transactions');
        setShowTransactionForm(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTransactionChange = (e) => {
        const { name, value } = e.target;
        setTransactionData(prev => ({ ...prev, [name]: value }));
    };

    const handleTransactionSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await ledgerAPI.createEntry({
                partyType: 'ledger_account',
                partyId: selectedAccount._id,
                credit: transactionData.entryType === 'Receipt' ? transactionData.amount : 0,
                debit: transactionData.entryType === 'Payment' ? transactionData.amount : 0,
                description: transactionData.description,
                transactionDate: transactionData.date
            });
            setShowTransactionForm(false);
            setTransactionData({ amount: 0, description: '', entryType: 'Payment', date: new Date().toISOString().split('T')[0] });
            fetchTransactions(selectedAccount._id);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to record transaction');
        }
    };

    const handleDeleteAccount = async (id, name) => {
        if (!window.confirm(`"${name}" permanently delete hoga?\nSaare related records bhi remove ho jayenge.`)) return;
        try {
            await ledgerAPI.delete(id);
            setSuccess('Account deleted successfully');
            fetchAccounts();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete account');
        }
    };

    const handleDeleteEntry = async (id) => {
        if (!window.confirm('Is entry ko remove karna chahte hain?')) return;
        try {
            await ledgerAPI.deleteEntry(id);
            setSuccess('Entry removed');
            fetchTransactions(selectedAccount._id);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to remove entry');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            await ledgerAPI.create(formData);
            setSuccess('Account created successfully');
            setFormData(initialFormState);
            fetchAccounts();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create account');
        }
    };

    // ── Edit / Modify ──────────────────────────────────
    const handleOpenEdit = (account) => {
        setEditingAccount(account);
        setEditForm({
            accountName: account.accountName || '',
            accountNumber: account.accountNumber || '',
            group: account.group || 'INDIRECT EXPENSES',
            openingBalance: account.openingBalance || 0,
            balanceType: account.balanceType || 'Dr',
            branch: account.branch || 'MAIN BRANCH',
            address: account.address || '',
        });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveEdit = async () => {
        setError('');
        try {
            await ledgerAPI.update(editingAccount._id, editForm);
            setSuccess('Account updated successfully!');
            setShowEditModal(false);
            setEditingAccount(null);
            fetchAccounts();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update account');
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-sm font-semibold text-gray-500">Loading...</div>;

    return (
        <div className="p-4 max-w-7xl mx-auto font-sans">

            {/* ── Header ── */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-xl font-black text-blue-900 uppercase tracking-tight">Ledger Creation</h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Manage Financial Books & Records</p>
                </div>
                {viewMode === 'transactions' && (
                    <button
                        onClick={() => setViewMode('list')}
                        className="text-xs font-black text-blue-600 bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg hover:bg-blue-100 transition-all flex items-center gap-1.5"
                    >
                        ← Back to Accounts
                    </button>
                )}
            </div>

            {/* ── Alerts ── */}
            {error && <div className="mb-3 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
            {success && <div className="mb-3 text-[11px] font-bold text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</div>}

            {viewMode === 'list' ? (
                <div className="flex flex-col xl:flex-row gap-4">

                    {/* ── Creation Form ── */}
                    <div className="xl:w-[320px] shrink-0">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-4">
                            <div className="bg-blue-600 px-5 py-3">
                                <h2 className="text-white text-sm font-black uppercase tracking-wide">New Ledger Account</h2>
                                <p className="text-blue-200 text-[10px] mt-0.5">Create a new financial book</p>
                            </div>
                            <form onSubmit={handleSubmit} className="p-4 space-y-3">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Account Name *</label>
                                    <input
                                        type="text"
                                        name="accountName"
                                        value={formData.accountName}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Office Rent, Petrol Exp"
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Account Number</label>
                                    <input
                                        type="text"
                                        name="accountNumber"
                                        value={formData.accountNumber}
                                        onChange={handleChange}
                                        placeholder="Enter Bank A/c No (optional)"
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white outline-none transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Opening Bal</label>
                                        <input
                                            type="number"
                                            name="openingBalance"
                                            value={formData.openingBalance}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Dr / Cr</label>
                                        <select
                                            name="balanceType"
                                            value={formData.balanceType}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white outline-none transition-all"
                                        >
                                            <option value="Dr">Debit (Dr)</option>
                                            <option value="Cr">Credit (Cr)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Account Group</label>
                                    <select
                                        name="group"
                                        value={formData.group}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white outline-none transition-all"
                                    >
                                        {accountGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Branch</label>
                                    <select
                                        name="branch"
                                        value={formData.branch}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white outline-none transition-all"
                                    >
                                        <option value="MAIN BRANCH">MAIN BRANCH</option>
                                        <option value="BRANCH 1">BRANCH 1</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Address / Remark</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        rows="2"
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:bg-white outline-none transition-all resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-lg shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] text-sm uppercase tracking-wide"
                                >
                                    + Create Ledger
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* ── Account List Table ── */}
                    <div className="flex-1">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="text-sm font-black text-gray-700 uppercase tracking-wide">Available Ledger Books</h3>
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-full">{accounts.length} ACCOUNTS</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <th className="px-5 py-3">Account Name</th>
                                            <th className="px-4 py-3">Group</th>
                                            <th className="px-4 py-3">Opening Bal</th>
                                            <th className="px-4 py-3 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {accounts.map((account) => (
                                            <tr key={account._id} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-5 py-3">
                                                    <div className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">{account.accountName}</div>
                                                    <div className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">{account.branch}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded uppercase tracking-wider">{account.group}</span>
                                                    {account.accountNumber && (
                                                        <div className="text-[9px] font-black text-emerald-600 mt-1">A/c: {account.accountNumber}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700">
                                                    ₹{account.openingBalance.toLocaleString('en-IN')}
                                                    <span className={`ml-1 text-[9px] font-black ${account.balanceType === 'Dr' ? 'text-blue-500' : 'text-red-500'}`}>{account.balanceType}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {/* View Ledger */}
                                                        <button
                                                            onClick={() => handleSelectAccount(account)}
                                                            className="text-[10px] font-black text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all"
                                                        >
                                                            VIEW
                                                        </button>
                                                        {/* Modify / Edit */}
                                                        <button
                                                            onClick={() => handleOpenEdit(account)}
                                                            className="text-[10px] font-black text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-all"
                                                        >
                                                            MODIFY
                                                        </button>
                                                        {/* Delete */}
                                                        <button
                                                            onClick={() => handleDeleteAccount(account._id, account.accountName)}
                                                            className="w-7 h-7 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all text-xs"
                                                            title="Delete Account"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {accounts.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-5 py-12 text-center text-gray-400 italic text-sm">
                                                    No ledger accounts found. Create one to get started.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

            ) : (
                /* ── Ledger Book / Transactions View ── */
                <div className="space-y-4">
                    {/* Account Header Card */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Statement</span>
                            <h3 className="text-xl font-black text-blue-900 mt-1">{selectedAccount.accountName}</h3>
                            <div className="flex gap-3 mt-1 text-[11px] text-gray-500 font-medium">
                                <span>Group: {selectedAccount.group}</span>
                                <span>•</span>
                                <span>Opening: ₹{selectedAccount.openingBalance} ({selectedAccount.balanceType})</span>
                            </div>
                        </div>
                        <div className="bg-blue-600 px-6 py-3 rounded-xl text-white shadow-md shadow-blue-600/20 text-right">
                            <div className="text-blue-200 text-[9px] font-black uppercase tracking-wider">Current Balance</div>
                            <div className="text-lg font-black mt-0.5">
                                ₹{transactions.length > 0 ? transactions[transactions.length - 1].balance.toLocaleString('en-IN') : '0'}
                            </div>
                        </div>
                    </div>

                    {/* Transaction Entry Form (Collapsible) */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div
                            className="px-5 py-3 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setShowTransactionForm(!showTransactionForm)}
                        >
                            <h4 className="text-sm font-black text-gray-700 flex items-center gap-2">
                                <span>💰</span> Record Transaction
                            </h4>
                            <span className="text-gray-400 font-black text-lg leading-none">{showTransactionForm ? '−' : '+'}</span>
                        </div>

                        {showTransactionForm && (
                            <form onSubmit={handleTransactionSubmit} className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end bg-gray-50/30">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Entry Type</label>
                                    <select name="entryType" value={transactionData.entryType} onChange={handleTransactionChange} className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-blue-500 outline-none font-bold">
                                        <option value="Payment">Payment (Spend)</option>
                                        <option value="Receipt">Receipt (Income)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Amount (₹)</label>
                                    <input type="number" name="amount" value={transactionData.amount} onChange={handleTransactionChange} required className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-blue-500 outline-none font-mono font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Date</label>
                                    <input type="date" name="date" value={transactionData.date} onChange={handleTransactionChange} className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Description</label>
                                    <input type="text" name="description" value={transactionData.description} onChange={handleTransactionChange} placeholder="Reason..." className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-blue-500 outline-none" />
                                </div>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-lg shadow-md shadow-blue-500/20 transition-all text-sm uppercase">
                                    Save Entry
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3">Reference</th>
                                        <th className="px-4 py-3 text-right">Debit</th>
                                        <th className="px-4 py-3 text-right">Credit</th>
                                        <th className="px-5 py-3 text-right">Balance</th>
                                        <th className="px-3 py-3 text-center">Del</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                                    {transactions.map((t) => (
                                        <tr key={t._id} className="hover:bg-blue-50/20 transition-colors">
                                            <td className="px-5 py-2.5 text-xs font-bold whitespace-nowrap">
                                                {new Date(t.transactionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-2.5 text-sm">{t.description}</td>
                                            <td className="px-4 py-2.5 text-[10px] text-gray-400 uppercase tracking-wider font-bold">{t.referenceType}</td>
                                            <td className="px-4 py-2.5 text-right font-mono text-sm text-blue-600 font-bold">
                                                {t.debit > 0 ? `₹${t.debit.toLocaleString('en-IN')}` : '-'}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono text-sm text-red-500 font-bold">
                                                {t.credit > 0 ? `₹${t.credit.toLocaleString('en-IN')}` : '-'}
                                            </td>
                                            <td className="px-5 py-2.5 text-right font-mono text-sm font-black text-gray-900 bg-gray-50/30">
                                                ₹{t.balance.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <button
                                                    onClick={() => handleDeleteEntry(t._id)}
                                                    className="w-7 h-7 flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all text-xs mx-auto"
                                                    title="Remove Entry"
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="px-5 py-12 text-center text-gray-400 italic text-sm">
                                                No transactions recorded for this account
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit / Modify Modal ─────────────────────────── */}
            {showEditModal && editingAccount && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-amber-500 px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-white font-black text-sm uppercase tracking-wider">Modify Account</h3>
                                <p className="text-amber-100 text-[10px] mt-0.5 font-bold">{editingAccount.accountName}</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="text-white hover:bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center font-black transition-all">✕</button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-3">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Account Name *</label>
                                <input
                                    type="text"
                                    name="accountName"
                                    value={editForm.accountName}
                                    onChange={handleEditChange}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-amber-400 focus:bg-white outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Account Number</label>
                                <input
                                    type="text"
                                    name="accountNumber"
                                    value={editForm.accountNumber}
                                    onChange={handleEditChange}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-amber-400 focus:bg-white outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Account Group</label>
                                <select
                                    name="group"
                                    value={editForm.group}
                                    onChange={handleEditChange}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-amber-400 focus:bg-white outline-none transition-all"
                                >
                                    {accountGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Opening Balance</label>
                                    <input
                                        type="number"
                                        name="openingBalance"
                                        value={editForm.openingBalance}
                                        onChange={handleEditChange}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-amber-400 focus:bg-white outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Type</label>
                                    <select
                                        name="balanceType"
                                        value={editForm.balanceType}
                                        onChange={handleEditChange}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-amber-400 focus:bg-white outline-none transition-all"
                                    >
                                        <option value="Dr">Debit (Dr)</option>
                                        <option value="Cr">Credit (Cr)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Branch</label>
                                <select
                                    name="branch"
                                    value={editForm.branch}
                                    onChange={handleEditChange}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-amber-400 focus:bg-white outline-none transition-all"
                                >
                                    <option value="MAIN BRANCH">MAIN BRANCH</option>
                                    <option value="BRANCH 1">BRANCH 1</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Address / Remark</label>
                                <textarea
                                    name="address"
                                    value={editForm.address}
                                    onChange={handleEditChange}
                                    rows="2"
                                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-amber-400 focus:bg-white outline-none transition-all resize-none"
                                />
                            </div>

                            {error && <div className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-600 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LedgerAccounts;
