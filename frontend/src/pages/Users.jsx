import React, { useState, useEffect } from 'react';
import { userAPI } from '../api/services';
import Layout from '../components/Layout';
import './Customers.css';

const PERMISSIONS = {
  'DATA ENTRY': [
    { id: 'cust_creation', title: 'Customer Creation', type: 'Data Entry' },
    { id: 'proj_entry', title: 'Project Entry', type: 'Data Entry' },
    { id: 'cust_modify', title: 'Customer Entry Modify', type: 'Data Entry' },
    { id: 'laser_creation', title: 'Laser Creation', type: 'Data Entry' },
    { id: 'exec_detail', title: 'Executive Detail', type: 'Data Entry' },
    { id: 'jv_entry', title: 'JV Entry', type: 'Report' },
    { id: 'proj_details', title: 'Project Details', type: 'Data Entry' },
    { id: 'acc_trans', title: 'Account Transaction', type: 'Data Entry' },
    { id: 'party_ledger', title: 'Party Ledger', type: 'Data Entry' },
    { id: 'trail_balance', title: 'Trail Balance', type: 'Data Entry' },
    { id: 'user_creation_perm', title: 'User Creation', type: 'Report' },
    { id: 'login_details', title: 'Login Details', type: 'Report' },
    { id: 'curr_detail', title: 'Currency Detail', type: 'Data Entry' },
  ],
  'REPORT': [
    { id: 'cust_stmt', title: 'Customer Statement', type: 'Report' },
    { id: 'user_coll', title: 'User Daily Collection', type: 'Report' },
    { id: 'unit_calc', title: 'Unit Calculation', type: 'Report' },
    { id: 'sales_rpt', title: 'Sales Report', type: 'Report' },
    { id: 'dir_cust_rpt', title: 'Direct Customer Report', type: 'Report' },
    { id: 'cust_out', title: 'Customer Outstanding', type: 'Report' },
    { id: 'cust_emi', title: 'Customer EMI Dues', type: 'Report' },
    { id: 'cust_dues_sum', title: 'Customer Dues Summary', type: 'Report' },
    { id: 'cash_book', title: 'Cash Book', type: 'Report' },
    { id: 'dash_board', title: 'Dash Board', type: 'Report' },
    { id: 'coll_reg', title: 'Daily Collection Register', type: 'Report' },
    { id: 'emi_rem', title: 'Monthly EMI Reminder', type: 'Report' },
    { id: 'token_exe', title: 'Customers Token by Exe', type: 'Report' },
    { id: 'exec_rem', title: 'Executive/Customer Reminder', type: 'Report' },
  ],
  'CRM': [
    { id: 'new_crm', title: 'New CRM Client', type: 'Data Entry' },
    { id: 'imp_excel', title: 'Import Excel Data', type: 'Data Entry' },
    { id: 'follow_up', title: 'Follow-up(Leads)', type: 'Data Entry' },
  ],
  'COMMISSION': [
    { id: 'agent_comm', title: 'Sales Agent Commission', type: 'Report' },
    { id: 'new_agent_comm', title: 'New Sales Agent Commission', type: 'Report' },
    { id: 'agent_comm2', title: 'Sale Agent Commission 2', type: 'Report' },
    { id: 'exec_login', title: 'Executive Login', type: 'Report' },
    { id: 'agent_sum', title: 'Agent Summary', type: 'Report' },
    { id: 'exec_biz', title: 'Executive Business', type: 'Report' },
  ]
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState('add'); // 'add' or 'edit'
  const [selectedUserId, setSelectedUserId] = useState(null);

  const initialFormState = {
    firstName: '',
    middleName: '',
    surname: '',
    type: 'User',
    userId: '',
    password: '',
    confirmPassword: '',
    branch: 'All',
    permissions: []
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(response.data.data || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch users');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (id) => {
    setFormData(prev => {
      const isSelected = prev.permissions.includes(id);
      if (isSelected) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== id) };
      } else {
        return { ...prev, permissions: [...prev.permissions, id] };
      }
    });
  };

  const handleSelectAllCategory = (category, select) => {
    const categoryIds = PERMISSIONS[category].map(p => p.id);
    setFormData(prev => {
      if (select) {
        const others = prev.permissions.filter(id => !categoryIds.includes(id));
        return { ...prev, permissions: [...others, ...categoryIds] };
      } else {
        return { ...prev, permissions: prev.permissions.filter(id => !categoryIds.includes(id)) };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      if (mode === 'add') {
        await userAPI.create(formData);
        setSuccess('User created successfully');
      } else {
        await userAPI.update(selectedUserId, formData);
        setSuccess('User updated successfully');
      }
      setFormData(initialFormState);
      setMode('add');
      setSelectedUserId(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (user) => {
    setMode('edit');
    setSelectedUserId(user._id);
    setFormData({
      firstName: user.firstName || '',
      middleName: user.middleName || '',
      surname: user.surname || '',
      type: user.type || 'User',
      userId: user.userId || '',
      password: '', // Don't show password
      confirmPassword: '',
      branch: user.branch || 'All',
      permissions: user.permissions || []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await userAPI.update(id, { active: !currentStatus });
      fetchUsers();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  if (loading) return <div className="p-8 text-center font-bold">Loading Users...</div>;

  return (
      <div className="p-4 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 uppercase tracking-wider">User Creation</h1>
        
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="grid grid-cols-2 gap-4 items-center">
                <label className="text-xs font-bold text-gray-600 uppercase">First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="form-input border-orange-200" required />
                
                <label className="text-xs font-bold text-gray-600 uppercase">Middle Name</label>
                <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className="form-input border-orange-200" />
                
                <label className="text-xs font-bold text-gray-600 uppercase">Surname</label>
                <input type="text" name="surname" value={formData.surname} onChange={handleChange} className="form-input border-orange-200" required />
                
                <div className="col-span-2 flex justify-center gap-8 py-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input type="radio" name="type" value="Head" checked={formData.type === 'Head'} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                    Head
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input type="radio" name="type" value="User" checked={formData.type === 'User'} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                    User
                  </label>
                </div>

                <label className="text-xs font-bold text-gray-600 uppercase">Username</label>
                <input type="text" name="userId" value={formData.userId} onChange={handleChange} className="form-input border-orange-200" required />
                
                <label className="text-xs font-bold text-gray-600 uppercase">Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-input border-orange-200" required={mode === 'add'} />
                
                <label className="text-xs font-bold text-gray-600 uppercase">Confirm Password</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="form-input border-orange-200" required={mode === 'add'} />
                
                <label className="text-xs font-bold text-gray-600 uppercase">Select Branch</label>
                <select name="branch" value={formData.branch} onChange={handleChange} className="form-select border-blue-200 font-bold">
                  <option value="All">All</option>
                  <option value="Main Branch">Main Branch</option>
                  <option value="Sub Branch">Sub Branch</option>
                </select>
              </div>
            </div>
          </div>

          {/* Permissions Table */}
          <div className="bg-white rounded-lg shadow-md border border-orange-400 overflow-hidden">
            <table className="w-full text-center text-xs">
              <thead className="bg-orange-500 text-white font-bold uppercase py-2">
                <tr>
                  <th className="p-2 border border-orange-400 w-10">
                    <input type="checkbox" className="w-3 h-3" />
                  </th>
                  <th className="p-2 border border-orange-400">Title</th>
                  <th className="p-2 border border-orange-400">Type</th>
                  <th className="p-2 border border-orange-400">Client View</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(PERMISSIONS).map(([category, perms]) => (
                  <React.Fragment key={category}>
                    <tr className="bg-green-400 text-gray-900 font-black text-left">
                      <td className="p-1 border border-orange-400 text-center">
                        <input 
                          type="checkbox" 
                          checked={perms.every(p => formData.permissions.includes(p.id))}
                          onChange={(e) => handleSelectAllCategory(category, e.target.checked)}
                          className="w-3 h-3"
                        />
                      </td>
                      <td colSpan="3" className="p-1 border border-orange-400 pl-4">{category}</td>
                    </tr>
                    {perms.map((p) => (
                      <tr key={p.id} className="hover:bg-blue-50 transition-colors bg-white">
                        <td className="p-1 border border-gray-200 text-center">
                          <input 
                            type="checkbox" 
                            checked={formData.permissions.includes(p.id)} 
                            onChange={() => handlePermissionChange(p.id)}
                            className="w-3 h-3" 
                          />
                        </td>
                        <td className="p-1 border border-gray-200 text-left pl-4 font-medium text-gray-700">{p.title}</td>
                        <td className="p-1 border border-gray-200 text-gray-600">{p.type}</td>
                        <td className="p-1 border border-gray-200 font-bold text-blue-600">Yes</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {error && <div className="p-3 bg-red-100 text-red-700 text-xs rounded border border-red-200 font-bold text-center">{error}</div>}
          {success && <div className="p-3 bg-green-100 text-green-700 text-xs rounded border border-green-200 font-bold text-center">{success}</div>}

          <div className="flex justify-center gap-4 pb-12">
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded font-black uppercase text-xs shadow-md transition-all active:scale-95">
              {mode === 'add' ? 'Submit' : 'Update'}
            </button>
            <button type="button" onClick={() => { setFormData(initialFormState); setMode('add'); setSelectedUserId(null); }} className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded font-black uppercase text-xs shadow-md transition-all active:scale-95">
              Cancel
            </button>
            <button type="button" className="bg-red-500 hover:bg-red-600 text-white px-8 py-2 rounded font-black uppercase text-xs shadow-md transition-all active:scale-95">
              Modify
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-12 border border-gray-200">
            <div className="bg-blue-600 text-white p-3 font-bold uppercase text-sm tracking-widest text-center">Registered Users</div>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-[10px]">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 font-bold uppercase border-b border-gray-200">
                    <th className="p-2">Name</th>
                    <th className="p-2">User ID</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-2 font-bold text-gray-800 uppercase">{user.firstName} {user.middleName} {user.surname}</td>
                      <td className="p-2 text-blue-600 font-bold">{user.userId}</td>
                      <td className="p-2"><span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${user.type === 'Head' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{user.type}</span></td>
                      <td className="p-2">
                        <div className="flex justify-center">
                          <button 
                            type="button"
                            onClick={() => handleToggleStatus(user._id, user.active)} 
                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-200 focus:outline-none shadow-inner ${
                              user.active ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                                user.active ? 'translate-x-5.5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="p-2 flex justify-center gap-2">
                        <button onClick={() => handleEdit(user)} className="text-blue-500 hover:text-blue-700 font-bold">✏️</button>
                        {/* {user.userId !== 'theboss' && <button className="text-red-500 hover:text-red-700 font-bold">✕</button>} */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      </div>
    );
};

export default Users;
