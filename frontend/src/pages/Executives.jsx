import React, { useState, useEffect } from 'react';
import { executiveAPI } from '../api/services';
import Layout from '../components/Layout';
import './Customers.css';

const Executives = () => {
    const [executives, setExecutives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [mode, setMode] = useState('add');
    const [selectedId, setSelectedId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('All');

    const initialFormState = {
        senior: '',
        code: '',
        role: 'Executive',
        rexPerSqFt: 0,
        name: '',
        branch: 'MAIN BRANCH',
        address: '',
        phone: '',
        percentage: 0,
        rsPerSqFt: 0,
        joiningDate: '',
        birthDate: '',
        panCard: '',
        designation: '',
        password: '',
        bankDetails: {
            accountHolderName: '',
            bankName: '',
            accountNo: '',
            ifscCode: '',
            status: 'YES'
        }
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchExecutives();
    }, []);

    const fetchExecutives = async () => {
        try {
            const response = await executiveAPI.getAll();
            setExecutives(response.data.data || []);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch executives');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (mode === 'add') {
                await executiveAPI.create(formData);
                setSuccess('Executive created successfully');
            } else {
                await executiveAPI.update(selectedId, formData);
                setSuccess('Executive updated successfully');
            }
            setFormData(initialFormState);
            setMode('add');
            setSelectedId(null);
            fetchExecutives();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed');
        }
    };

    const handleEdit = (exec) => {
        setMode('edit');
        setSelectedId(exec._id);
        setFormData({
            ...exec,
            senior: exec.senior?._id || '',
            joiningDate: exec.joiningDate ? exec.joiningDate.split('T')[0] : '',
            birthDate: exec.birthDate ? exec.birthDate.split('T')[0] : '',
            bankDetails: exec.bankDetails || initialFormState.bankDetails
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to deactivate this executive?')) {
            try {
                await executiveAPI.delete(id);
                fetchExecutives();
            } catch (err) {
                setError('Failed to deactivate executive');
            }
        }
    };

    const filteredExecutives = searchTerm === 'All' 
        ? executives 
        : executives.filter(e => e._id === searchTerm || e.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div className="p-8 text-center font-bold">Loading Executives...</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4 bg-gray-50 min-h-screen font-sans">
                {/* Left Side: Forms */}
                <div className="lg:w-1/3 space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Executive/Advisor Entry Section */}
                        <div className="bg-white border border-blue-300 rounded shadow-sm overflow-hidden">
                            <div className="bg-sky-500 text-white px-4 py-1 text-xs font-bold">
                                Executive/Advisor Entry
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-2 items-center text-[11px]">
                                    <label className="font-bold text-gray-700">Senior</label>
                                    <select 
                                        name="senior" 
                                        value={formData.senior} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="">Select Senior</option>
                                        {executives
                                            .filter(e => e.role === 'Head Executive' || e.role === 'The Boss')
                                            .map(e => (
                                                <option key={e._id} value={e._id}>{e.name} - {e.code}</option>
                                            ))
                                        }
                                    </select>

                                    <label className="font-bold text-gray-700">Code</label>
                                    <input 
                                        type="text" 
                                        name="code" 
                                        value={formData.code} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded text-red-600 font-bold"
                                        required
                                    />

                                    <label className="font-bold text-gray-700">Role</label>
                                    <select 
                                        name="role" 
                                        value={formData.role || 'Executive'} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded focus:outline-none focus:border-blue-500 font-bold text-blue-600"
                                    >
                                        <option value="Executive">Executive</option>
                                        <option value="Head Executive">Head Executive</option>
                                        <option value="The Boss">The Boss</option>
                                    </select>

                                    <label className="font-bold text-gray-700">Rex (Per Sq. Ft)</label>
                                    <input 
                                        type="number" 
                                        name="rexPerSqFt" 
                                        value={formData.rexPerSqFt} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded text-red-600 font-bold"
                                    />

                                    <label className="font-bold text-gray-700">Executive Name</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        value={formData.name} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded"
                                        required
                                    />

                                    <label className="font-bold text-gray-700">Branch</label>
                                    <select 
                                        name="branch" 
                                        value={formData.branch} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded"
                                    >
                                        <option value="MAIN BRANCH">MAIN BRANCH</option>
                                        <option value="SUB BRANCH">SUB BRANCH</option>
                                    </select>

                                    <label className="font-bold text-gray-700">Address</label>
                                    <textarea 
                                        name="address" 
                                        value={formData.address} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded h-16 resize-none"
                                    />

                                    <label className="font-bold text-gray-700">Contact No.</label>
                                    <input 
                                        type="text" 
                                        name="phone" 
                                        value={formData.phone} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded"
                                        required
                                    />

                                    <label className="font-bold text-gray-700">Percentage</label>
                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="number" 
                                            name="percentage" 
                                            value={formData.percentage} 
                                            onChange={handleChange}
                                            className="border border-blue-200 p-1 rounded w-full"
                                        />
                                        <span className="text-red-600 font-bold">%</span>
                                    </div>

                                    <label className="font-bold text-gray-700">Rs.(Sq. Ft)</label>
                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="number" 
                                            name="rsPerSqFt" 
                                            value={formData.rsPerSqFt} 
                                            onChange={handleChange}
                                            className="border border-blue-200 p-1 rounded w-full"
                                        />
                                        <span className="text-red-600 font-bold">(Sq.ft)</span>
                                    </div>

                                    <label className="font-bold text-gray-700">Joining Date</label>
                                    <input 
                                        type="date" 
                                        name="joiningDate" 
                                        value={formData.joiningDate} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded"
                                    />

                                    <label className="font-bold text-gray-700">Birth Date</label>
                                    <input 
                                        type="date" 
                                        name="birthDate" 
                                        value={formData.birthDate} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded"
                                    />

                                    <label className="font-bold text-gray-700">PAN Card</label>
                                    <input 
                                        type="text" 
                                        name="panCard" 
                                        value={formData.panCard} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded"
                                    />

                                    <label className="font-bold text-gray-700">Designation</label>
                                    <input 
                                        type="text" 
                                        name="designation" 
                                        value={formData.designation} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded"
                                    />

                                    <label className="font-bold text-gray-700">Password</label>
                                    <input 
                                        type="password" 
                                        name="password" 
                                        value={formData.password} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bank Detail Section */}
                        <div className="bg-white border border-blue-300 rounded shadow-sm overflow-hidden">
                            <div className="bg-sky-500 text-white px-4 py-1 text-xs font-bold">
                                Bank Detail
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-2 items-center text-[11px]">
                                    <label className="font-bold text-gray-700">A/c Holder Name</label>
                                    <input 
                                        type="text" 
                                        name="bankDetails.accountHolderName" 
                                        value={formData.bankDetails.accountHolderName} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded"
                                    />

                                    <label className="font-bold text-gray-700">Bank Name</label>
                                    <input 
                                        type="text" 
                                        name="bankDetails.bankName" 
                                        value={formData.bankDetails.bankName} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded"
                                    />

                                    <label className="font-bold text-gray-700">A/c No.</label>
                                    <input 
                                        type="text" 
                                        name="bankDetails.accountNo" 
                                        value={formData.bankDetails.accountNo} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded"
                                    />

                                    <label className="font-bold text-gray-700">IFSC Code</label>
                                    <input 
                                        type="text" 
                                        name="bankDetails.ifscCode" 
                                        value={formData.bankDetails.ifscCode} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded"
                                    />

                                    <label className="font-bold text-gray-700">Status</label>
                                    <select 
                                        name="bankDetails.status" 
                                        value={formData.bankDetails.status} 
                                        onChange={handleChange}
                                        className="border border-blue-200 p-1 rounded"
                                    >
                                        <option value="YES">YES</option>
                                        <option value="NO">NO</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button 
                                type="submit" 
                                className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-1.5 rounded text-xs font-bold shadow-sm flex-1 transition-colors"
                            >
                                {mode === 'add' ? 'Save' : 'Update'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => { setFormData(initialFormState); setMode('add'); setSelectedId(null); }}
                                className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-1.5 rounded text-xs font-bold shadow-sm flex-1 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>

                        {error && <div className="text-red-500 text-[10px] font-bold text-center">{error}</div>}
                        {success && <div className="text-green-500 text-[10px] font-bold text-center">{success}</div>}
                    </form>
                </div>

                {/* Right Side: Table */}
                <div className="lg:w-2/3 space-y-4">
                    <div className="flex justify-between bg-white p-2 border border-blue-200 rounded shadow-sm">
                        <select 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-blue-200 p-1 rounded text-xs focus:outline-none w-64"
                        >
                            <option value="All">All</option>
                            {executives.map(e => (
                                <option key={e._id} value={e._id}>{e.name} ({e.code})</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white border border-blue-200 rounded shadow-sm overflow-hidden overflow-x-auto">
                        <table className="w-full text-[10px]">
                            <thead>
                                <tr className="bg-sky-100 text-gray-700 border-b border-blue-200">
                                    <th className="p-1 border-r border-blue-200">E-Code</th>
                                    <th className="p-1 border-r border-blue-200">E-Name</th>
                                    <th className="p-1 border-r border-blue-200">PAN No.</th>
                                    <th className="p-1 border-r border-blue-200">Senior</th>
                                    <th className="p-1 border-r border-blue-200">Per</th>
                                    <th className="p-1 border-r border-blue-200">Branch</th>
                                    <th className="p-1 border-r border-blue-200">Send Msg</th>
                                    <th className="p-1 border-r border-blue-200">Show PWD</th>
                                    <th className="p-1 border-r border-blue-200">Edit</th>
                                    <th className="p-1">Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExecutives.map((exec) => (
                                    <tr key={exec._id} className="border-b border-blue-50 hover:bg-sky-50 transition-colors">
                                        <td className="p-1 border-r border-blue-100 font-bold">{exec.code}</td>
                                        <td className="p-1 border-r border-blue-100 uppercase">{exec.name}</td>
                                        <td className="p-1 border-r border-blue-100 uppercase">{exec.panCard || '-'}</td>
                                        <td className="p-1 border-r border-blue-100 uppercase">{exec.senior?.code || '-'}</td>
                                        <td className="p-1 border-r border-blue-100 text-center">{exec.percentage}%</td>
                                        <td className="p-1 border-r border-blue-100 text-[8px]">{exec.branch}</td>
                                        <td className="p-1 border-r border-blue-100 text-center">
                                            <span className="bg-orange-400 text-white px-1 rounded cursor-pointer text-[8px]">Msg</span>
                                        </td>
                                        <td className="p-1 border-r border-blue-100 text-center">
                                            <button 
                                                onClick={() => alert(`Password: ${exec.password || 'Not Set'}`)}
                                                className="bg-orange-400 text-white px-2 py-0.5 rounded text-[8px] font-bold"
                                            >
                                                Password
                                            </button>
                                        </td>
                                        <td className="p-1 border-r border-blue-100 text-center">
                                            <button 
                                                onClick={() => handleEdit(exec)}
                                                className="bg-sky-400 text-white px-2 py-0.5 rounded text-[8px] font-bold"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                        <td className="p-1 text-center">
                                            <button 
                                                onClick={() => handleDelete(exec._id)}
                                                className="bg-red-500 text-white px-2 py-0.5 rounded text-[8px] font-bold"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
    );
};

export default Executives;
