import React, { useState, useEffect } from 'react';
import { transactionAPI, customerAPI, projectAPI } from '../api/services';
import Layout from '../components/Layout';
import { numberToWords } from '../utils/numberToWords';
import './Customers.css';

const Transactions = () => {
    const [customers, setCustomers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [customerTransactions, setCustomerTransactions] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [mode, setMode] = useState('add');
    const [selectedId, setSelectedId] = useState(null);

    const initialFormState = {
        entryType: 'Receipt',
        transactionType: 'Select Type',
        transactionDate: new Date().toISOString().split('T')[0],
        customerId: '',
        projectId: '',
        amount: 0,
        paymentMode: 'Cash',
        referenceNumber: '',
        bankName: '',
        narration: '',
        receiptNumber: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [custRes, projRes] = await Promise.all([
                customerAPI.getAll(),
                projectAPI.getAll()
            ]);
            setCustomers(custRes.data.data || []);
            setProjects(projRes.data.data || []);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch initial data');
            setLoading(false);
        }
    };

    const handleCustomerChange = async (e) => {
        const customerId = e.target.value;
        setFormData(prev => ({ ...prev, customerId }));
        
        if (customerId) {
            const customer = customers.find(c => c._id === customerId);
            setSelectedCustomer(customer);
            // Auto-select project if customer has one
            if (customer?.projectId) {
                setFormData(prev => ({ ...prev, projectId: customer.projectId._id || customer.projectId }));
            }
            fetchCustomerHistory(customerId);
        } else {
            setSelectedCustomer(null);
            setCustomerTransactions([]);
        }
    };

    const fetchCustomerHistory = async (customerId) => {
        try {
            const res = await transactionAPI.getByCustomer(customerId);
            setCustomerTransactions(res.data.data || []);
        } catch (err) {
            setError('Failed to fetch transaction history');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.customerId || formData.transactionType === 'Select Type') {
            setError('Please select customer and transaction type');
            return;
        }

        try {
            if (mode === 'add') {
                await transactionAPI.create(formData);
                setSuccess('Transaction recorded successfully');
            } else {
                // await transactionAPI.update(selectedId, formData);
                // setSuccess('Transaction updated successfully');
            }
            setFormData(initialFormState);
            setSelectedCustomer(null);
            setCustomerTransactions([]);
            fetchInitialData();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed');
        }
    };

    if (loading) return <div className="p-8 text-center font-bold">Loading Transactions...</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4 bg-gray-50 min-h-screen font-sans">
                {/* Left Side: Entry Form */}
                <div className="lg:w-1/3">
                    <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-400 rounded p-4 shadow-md space-y-4">
                        <div className="bg-yellow-400 text-blue-900 font-bold px-4 py-1 text-sm text-center">
                            Customer Transaction Entry
                        </div>

                        <div className="flex justify-center gap-6">
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="entryType" 
                                    value="Receipt" 
                                    checked={formData.entryType === 'Receipt'} 
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600" 
                                />
                                Receipt
                            </label>
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="entryType" 
                                    value="Payment" 
                                    checked={formData.entryType === 'Payment'} 
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600" 
                                />
                                Payment
                            </label>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 items-center text-[11px]">
                                <label className="font-bold text-gray-700">Transaction Type :</label>
                                <select 
                                    name="transactionType" 
                                    value={formData.transactionType} 
                                    onChange={handleChange}
                                    className="border border-red-300 p-1 rounded focus:ring-1 focus:ring-red-400 outline-none"
                                >
                                    <option value="Select Type">Select Type</option>
                                    <option value="down payment">down payment</option>
                                    <option value="EMI">EMI</option>
                                    <option value="Token">Token</option>
                                    <option value="Cash to bank">Cash to bank</option>
                                    <option value="other transaction">other transaction</option>
                                </select>

                                <label className="font-bold text-gray-700">Date :</label>
                                <input 
                                    type="date" 
                                    name="transactionDate" 
                                    value={formData.transactionDate} 
                                    onChange={handleChange}
                                    className="border border-gray-400 p-1 rounded"
                                />

                                <label className="font-bold text-gray-700">Select Account :</label>
                                <select 
                                    name="customerId" 
                                    value={formData.customerId} 
                                    onChange={handleCustomerChange}
                                    className="border border-sky-400 p-1 rounded outline-none"
                                >
                                    <option value="">Select Account</option>
                                    {customers.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>

                                <label className="font-bold text-gray-700">Project :</label>
                                <select 
                                    name="projectId" 
                                    value={formData.projectId} 
                                    onChange={handleChange}
                                    className="border border-gray-400 p-1 rounded"
                                >
                                    <option value="">Select Project</option>
                                    {projects.map(p => (
                                        <option key={p._id} value={p._id}>{p.projectName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-gray-50 p-2 rounded border border-gray-200 text-[10px] font-bold text-gray-600">
                                <div>Unit No: <span className="text-gray-900">{selectedCustomer?.plotId?.plotNumber || '-'}</span></div>
                                <div>Project Name: <span className="text-gray-900">{selectedCustomer?.projectId?.projectName || '-'}</span></div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 items-center text-[11px]">
                                <label className="font-bold text-gray-700">Amount :</label>
                                <input 
                                    type="number" 
                                    name="amount" 
                                    value={formData.amount} 
                                    onChange={handleChange}
                                    className="border border-orange-400 p-1 rounded font-bold"
                                />

                                <label className="font-bold text-gray-700">In Words: Rs.</label>
                                <div className="text-[9px] font-bold text-blue-600 italic leading-tight">
                                    {numberToWords(formData.amount)}
                                </div>

                                <label className="font-bold text-gray-700">Transaction Type:</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" name="paymentMode" value="Bank" checked={formData.paymentMode === 'Bank'} onChange={handleChange} /> Bank
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" name="paymentMode" value="Cash" checked={formData.paymentMode === 'Cash'} onChange={handleChange} /> Cash
                                    </label>
                                </div>

                                <label className="font-bold text-gray-700">Narration :</label>
                                <input 
                                    type="text" 
                                    name="narration" 
                                    value={formData.narration} 
                                    onChange={handleChange}
                                    className="border border-orange-400 p-1 rounded"
                                />
                                
                                <label className="font-bold text-gray-700">Rec. No. :</label>
                                <input 
                                    type="text" 
                                    name="receiptNumber" 
                                    value={formData.receiptNumber} 
                                    onChange={handleChange}
                                    className="border border-gray-400 p-1 rounded"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-[10px] font-bold flex-1">Submit</button>
                            <button type="button" onClick={() => { setFormData(initialFormState); setSelectedCustomer(null); setCustomerTransactions([]); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-[10px] font-bold flex-1">Reset</button>
                            <button type="button" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded text-[10px] font-bold flex-1">Modify</button>
                        </div>
                        {error && <div className="text-red-500 text-[10px] font-bold text-center">{error}</div>}
                        {success && <div className="text-green-500 text-[10px] font-bold text-center">{success}</div>}
                    </form>
                </div>

                {/* Right Side: Summary and History */}
                <div className="lg:w-2/3 space-y-4">
                    {/* Summary Table */}
                    <div className="bg-white border border-gray-400 shadow-sm overflow-hidden">
                        <table className="w-full text-[10px] text-center">
                            <thead>
                                <tr className="bg-yellow-100 border-b border-gray-300">
                                    <th className="p-2 border-r border-gray-300">EMI Amt</th>
                                    <th className="p-2 border-r border-gray-300">Cost</th>
                                    <th className="p-2 border-r border-gray-300">Paid Amt</th>
                                    <th className="p-2 border-r border-gray-300">DP/Paid</th>
                                    <th className="p-2 border-r border-gray-300">No.EMI</th>
                                    <th className="p-2 border-r border-gray-300">BE Amt</th>
                                    <th className="p-2">EMI Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="font-bold">
                                    <td className="p-2 border-r border-gray-300">₹{selectedCustomer?.emiAmount?.toLocaleString('en-IN') || '0'}</td>
                                    <td className="p-2 border-r border-gray-300">₹{selectedCustomer?.dealValue?.toLocaleString('en-IN') || '0'}</td>
                                    <td className="p-2 border-r border-gray-300">₹{selectedCustomer?.paidAmount?.toLocaleString('en-IN') || '0'}</td>
                                    <td className="p-2 border-r border-gray-300">₹{selectedCustomer?.paidAmount?.toLocaleString('en-IN') || '0'}</td>
                                    <td className="p-2 border-r border-gray-300">{selectedCustomer?.tenure || '0'}</td>
                                    <td className="p-2 border-r border-gray-300 text-red-600">₹{selectedCustomer?.balanceAmount?.toLocaleString('en-IN') || '0'}</td>
                                    <td className="p-2">{selectedCustomer?.emiStartDate ? new Date(selectedCustomer.emiStartDate).toLocaleDateString() : '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* History Table */}
                    <div className="bg-white border border-gray-400 shadow-sm overflow-hidden">
                        <table className="w-full text-[10px] text-center">
                            <thead>
                                <tr className="bg-green-100 border-b border-gray-300">
                                    <th className="p-1 border-r border-gray-300 w-10">Sr.No.</th>
                                    <th className="p-1 border-r border-gray-300">Date</th>
                                    <th className="p-1 border-r border-gray-300">Particular</th>
                                    <th className="p-1 border-r border-gray-300">Rec.No.</th>
                                    <th className="p-1 border-r border-gray-300">Remark</th>
                                    <th className="p-1 border-r border-gray-300">Debit</th>
                                    <th className="p-1 border-r border-gray-300">Credit</th>
                                    <th className="p-1">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customerTransactions.map((t, index) => (
                                    <tr key={t._id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="p-1 border-r border-gray-200">{index + 1}</td>
                                        <td className="p-1 border-r border-gray-200">{new Date(t.transactionDate).toLocaleDateString()}</td>
                                        <td className="p-1 border-r border-gray-200 uppercase">{t.transactionType}</td>
                                        <td className="p-1 border-r border-gray-200">{t.receiptNumber || '-'}</td>
                                        <td className="p-1 border-r border-gray-200">{t.narration || '-'}</td>
                                        <td className="p-1 border-r border-gray-200 font-bold text-red-600">{t.entryType === 'Payment' ? `₹${t.amount.toLocaleString('en-IN')}` : '-'}</td>
                                        <td className="p-1 border-r border-gray-200 font-bold text-green-600">{t.entryType === 'Receipt' ? `₹${t.amount.toLocaleString('en-IN')}` : '-'}</td>
                                        <td className="p-1 font-bold">₹{t.balanceAtTime?.toLocaleString('en-IN') || '-'}</td>
                                    </tr>
                                ))}
                                {customerTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-gray-500 italic">No transaction history for this account</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
    );
};

export default Transactions;
