import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI, projectAPI, plotAPI, userAPI } from '../api/services';
import Layout from '../components/Layout';
import './Customers.css';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [plots, setPlots] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [filterProject, setFilterProject] = useState('ALL');

  const initialFormState = {
    title: 'Mr.',
    firstName: '',
    middleName: '',
    lastName: '',
    occupation: 'Business',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    age: '',
    birthDate: '',
    marriageDate: '',
    phone: '',
    alternatePhone: '',
    email: '',
    branch: 'MAIN BRANCH',
    panNo: '',
    aadharNo: '',
    panCardImage: '',
    aadharCardImage: '',
    nomineeName: '',
    nomineeAge: '',
    nomineeRelation: '',
    nomineeBirthDate: '',
    nomineeAadharNo: '',
    nomineePanNo: '',
    nomineePanCardImage: '',
    nomineeAadharCardImage: '',
    projectId: '',
    plotId: '',
    measurement: '',
    sqMtr: '',
    sqFt: '',
    rate: '',
    dealValue: '0',
    paidAmount: '0',
    balanceAmount: '0',
    tenure: '',
    emiAmount: '0',
    bookingDate: new Date().toISOString().split('T')[0],
    agreementDate: '',
    emiStartDate: '',
    transactionStatus: 'Token',
    remarks: '',
    aRate: '',
    assignedExecutive: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const occupations = [
    'Business', 'Service', 'Professional', 'Housewife', 'Student', 
    'Retired', 'Agriculture', 'Self Employed', 'Doctor', 'Engineer', 
    'Advocate', 'Architect', 'Chartered Accountant', 'Govt. Employee', 
    'Private Sector', 'Industrialist', 'Other'
  ];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('add') === 'true') {
      setShowForm(true);
    }
  }, [location]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.projectId) {
      fetchPlots(formData.projectId);
      const project = projects.find(p => p._id === formData.projectId);
      setSelectedProject(project);
    } else {
      setPlots([]);
      setSelectedProject(null);
    }
  }, [formData.projectId, projects]);

  useEffect(() => {
    if (formData.plotId) {
      const plot = plots.find(p => p._id === formData.plotId);
      setSelectedPlot(plot);
      if (plot) {
        const dealVal = (plot.size * plot.rate) || 0;
        const paid = parseFloat(formData.paidAmount) || 0;
        const balance = dealVal - paid;
        const tenure = parseFloat(formData.tenure) || 0;
        setFormData(prev => ({
          ...prev,
          measurement: plot.measurement || '',
          sqMtr: plot.sqMtr || '',
          sqFt: plot.size || '',
          rate: plot.rate || '',
          dealValue: dealVal,
          balanceAmount: balance,
          emiAmount: tenure > 0 ? (balance / tenure).toFixed(2) : '0'
        }));
      }
    } else {
      setSelectedPlot(null);
    }
  }, [formData.plotId, plots]);

  useEffect(() => {
    const sqFt = parseFloat(formData.sqFt) || 0;
    const rate = parseFloat(formData.rate) || 0;
    const total = sqFt * rate;
    const paid = parseFloat(formData.paidAmount) || 0;
    const balance = total - paid;
    const tenure = parseFloat(formData.tenure) || 0;
    
    setFormData(prev => ({
      ...prev,
      dealValue: total,
      balanceAmount: balance,
      emiAmount: tenure > 0 ? (balance / tenure).toFixed(2) : prev.emiAmount
    }));
  }, [formData.sqFt, formData.rate, formData.paidAmount]);

  // Recalculate EMI when tenure changes
  useEffect(() => {
    const tenure = parseFloat(formData.tenure) || 0;
    const balance = parseFloat(formData.balanceAmount) || 0;
    setFormData(prev => ({
      ...prev,
      emiAmount: tenure > 0 ? (balance / tenure).toFixed(2) : '0'
    }));
  }, [formData.tenure]);

  const fetchInitialData = async () => {
    try {
      const [customersRes, projectsRes, usersRes] = await Promise.all([
        customerAPI.getAll(),
        projectAPI.getAll({ active: true }),
        userAPI.getList(),
      ]);
      
      setCustomers(customersRes.data.data || []);
      setProjects(projectsRes.data.data || []);
      const execRoles = ['Executive', 'Head Executive', 'Admin', 'Boss'];
      setExecutives((usersRes.data.data || []).filter(u => execRoles.includes(u.role)));
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlots = async (projectId) => {
    try {
      const response = await plotAPI.getAll({ projectId, status: 'vacant' });
      setPlots(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch plots');
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

    try {
      const payload = { ...formData };
      
      // Clean up empty ObjectIDs to prevent CastError
      if (!payload.assignedExecutive) delete payload.assignedExecutive;
      if (!payload.plotId) delete payload.plotId;
      if (!payload.projectId) delete payload.projectId;

      await customerAPI.create(payload);
      setSuccess('Customer created successfully!');
      setShowForm(false);
      setFormData(initialFormState);
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create customer');
    }
  };

  const PhotoUpload = ({ id }) => (
    <div className="image-upload-container">
      <label htmlFor={id} className="file-input-label">Choose File</label>
      <input type="file" id={id} className="hidden" />
      <span className="max-size-hint">Select Photo : Max. Size:50KB</span>
    </div>
  );

  if (loading) {
    return (
        <div className="text-center py-10">Loading...</div>
    );
  }

  return (
      <div className="p-1">
        <div className="flex justify-between items-center mb-10 bg-gradient-to-r from-white to-slate-50/50 p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -ml-32 -mt-32"></div>
          <div className="flex items-center gap-8 relative z-10">
            <button 
                onClick={() => navigate('/dashboard')}
                className="w-14 h-14 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center text-xl hover:bg-blue-600 transition-all active:scale-90 shadow-2xl group/home"
                title="Return Home"
            >
                <span className="group-hover/home:-translate-y-1 transition-transform">🏠</span>
            </button>
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-[#1B315A] tracking-tighter uppercase italic leading-none">
                Customer <span className="text-blue-600">Hub</span>
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Strategic Inventory & Asset Allocation
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setError('');
              setSuccess('');
            }}
            className="flex items-center gap-4 px-10 py-5 bg-[#1B315A] text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-[#F38C32] hover:scale-105 transition-all shadow-2xl shadow-blue-900/20 active:scale-95 z-10"
          >
            {showForm ? (
              <><span>📄</span> View Audit Trail</>
            ) : (
              <><span>✨</span> Add New Asset</>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-0.5 rounded mb-1 text-xs text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-2 py-0.5 rounded mb-1 text-xs text-center">
            {success}
          </div>
        )}

        {showForm ? (
          <form onSubmit={handleSubmit} className="customer-form-container pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Column 1: Client/Customer Detail */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full group">
                <div className="bg-[#1B315A] px-6 py-3 text-white font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3">
                  <span>👤</span> Client / Customer Detail
                </div>
                
                <div className="p-6 space-y-6 flex-1">
                  <div className="space-y-4">
                    <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-4 border-[#F38C32]">
                      Personal Information
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Title</label>
                        <select name="title" value={formData.title} onChange={handleChange} className="modern-input !py-2.5 uppercase text-[11px] font-black">
                          <option value="Mr.">Mr.</option>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Ms.">Ms.</option>
                          <option value="Dr.">Dr.</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Occupation</label>
                        <select name="occupation" value={formData.occupation} onChange={handleChange} className="modern-input !py-2.5 uppercase text-[11px] font-black">
                          <option value="">Select Occupation</option>
                          {occupations.map(occ => <option key={occ} value={occ}>{occ}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">First Name</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="modern-input !py-2.5 uppercase text-[11px] font-black" required />
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Middle Name</label>
                        <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className="modern-input !py-2.5 uppercase text-[11px] font-black" />
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Last Name</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="modern-input !py-2.5 uppercase text-[11px] font-black" required />
                      </div>
                    </div>

                    <div className="grid grid-cols-[1fr_2fr] items-start gap-4">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right mt-3">Address</label>
                      <textarea name="address" value={formData.address} onChange={handleChange} className="modern-input !py-2.5 h-24 uppercase text-[11px] font-black resize-none" required></textarea>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">City</label>
                        <input type="text" name="city" value={formData.city} onChange={handleChange} className="modern-input !py-4 uppercase text-[12px] font-black" />
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">State</label>
                        <input type="text" name="state" value={formData.state} onChange={handleChange} className="modern-input !py-4 uppercase text-[12px] font-black" />
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">PIN No.</label>
                        <input type="text" name="pinCode" value={formData.pinCode} onChange={handleChange} className="modern-input !py-4 font-black text-[12px]" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Age</label>
                        <input type="number" name="age" value={formData.age} onChange={handleChange} className="modern-input !py-2.5 font-black text-[11px]" />
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Birth Date</label>
                        <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="modern-input !py-2.5 text-[11px] font-black" />
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Marriage Dt.</label>
                        <input type="date" name="marriageDate" value={formData.marriageDate} onChange={handleChange} className="modern-input !py-2.5 text-[11px] font-black" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Contact No.</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="modern-input !py-4 font-black text-[12px] !border-orange-200 bg-orange-50/20" required />
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Branch</label>
                        <select name="branch" value={formData.branch} onChange={handleChange} className="modern-input !py-4 uppercase text-[12px] font-black">
                          <option value="MAIN BRANCH">MAIN BRANCH</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Email</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className="modern-input !py-2.5 font-black text-[11px]" />
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                         <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">PAN No.</label>
                         <input type="text" name="panNo" value={formData.panNo} onChange={handleChange} className="modern-input !py-4 uppercase font-black text-[12px]" placeholder="AAIPD0000X" />
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-start gap-4">
                         <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right mt-2">PAN Card</label>
                         <PhotoUpload id="panCardImage" />
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                         <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">AADHAR No.</label>
                         <input type="text" name="aadharNo" value={formData.aadharNo} onChange={handleChange} className="modern-input !py-4 font-black text-[12px]" placeholder="0000-0000-0000" />
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-start gap-4">
                         <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right mt-2">AADHAR Card</label>
                         <PhotoUpload id="aadharCardImage" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Plot/Unit Transaction & Nominee Detail */}
              <div className="flex flex-col gap-6">
                
                {/* Nominee Detail Section */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group">
                  <div className="bg-[#1B315A] px-6 py-3 text-white font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3">
                    <span>🧬</span> Nominee Detail
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Nominee Name</label>
                        <input type="text" name="nomineeName" value={formData.nomineeName} onChange={handleChange} className="modern-input !py-2.5 uppercase text-[11px] font-black" />
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Nominee Age</label>
                        <input type="number" name="nomineeAge" value={formData.nomineeAge} onChange={handleChange} className="modern-input !py-2.5 font-black text-[11px]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-[1fr_2fr] items-center gap-4 mb-4">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Relation</label>
                      <input type="text" name="nomineeRelation" value={formData.nomineeRelation} onChange={handleChange} className="modern-input !py-2.5 uppercase text-[11px] font-black" />
                    </div>
                    <div className="grid grid-cols-[1fr_2fr] items-center gap-4 mb-4">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Nominee Birth</label>
                      <input type="date" name="nomineeBirthDate" value={formData.nomineeBirthDate} onChange={handleChange} className="modern-input !py-2.5 text-[11px] font-black" />
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Adhar No.</label>
                        <input type="text" name="nomineeAadharNo" value={formData.nomineeAadharNo} onChange={handleChange} className="modern-input !py-2.5 font-black text-[11px]" />
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">PAN No.</label>
                        <input type="text" name="nomineePanNo" value={formData.nomineePanNo} onChange={handleChange} className="modern-input !py-2.5 uppercase font-black text-[11px]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Detail Section */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group">
                  <div className="bg-[#1B315A] px-6 py-3 text-white font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3">
                    <span>🎯</span> Project Detail
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Project</label>
                        <select name="projectId" value={formData.projectId} onChange={handleChange} className="modern-input !py-4 text-[12px] font-black border-blue-200 bg-blue-50/20" required>
                          <option value="">-- SELECT VENTURE --</option>
                          {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Plot No.</label>
                        <select name="plotId" value={formData.plotId} onChange={handleChange} className="modern-input !py-4 text-[12px] font-black border-emerald-200 bg-emerald-50/20" required disabled={!formData.projectId}>
                          <option value="">-- SELECT UNIT --</option>
                          {plots.map(p => <option key={p._id} value={p._id}>{p.plotNumber}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Measurement</label>
                        <input type="text" name="measurement" value={formData.measurement} onChange={handleChange} className="modern-input !py-4 text-[12px] font-black" />
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Sq.Mtr.</label>
                        <input type="number" name="sqMtr" value={formData.sqMtr} onChange={handleChange} className="modern-input !py-4 text-[12px] font-black" />
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                         <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Sq.Ft.</label>
                         <input type="number" name="sqFt" value={formData.sqFt} onChange={handleChange} className="modern-input !py-4 font-black text-[12px] !bg-slate-50 border-slate-200" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Rate</label>
                        <input type="number" name="rate" value={formData.rate} onChange={handleChange} className="modern-input !py-2.5 font-black text-[11px] !text-blue-600" />
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Total Cost</label>
                        <div className="modern-input !py-2.5 bg-slate-50 font-black text-slate-800 text-[11px]">₹{(parseFloat(formData.dealValue) || 0).toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                         <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Down Payment</label>
                         <input type="number" name="paidAmount" value={formData.paidAmount} onChange={handleChange} className="modern-input !py-2.5 font-black text-[11px] !text-emerald-600 border-emerald-200" />
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Balance</label>
                        <div className="modern-input !py-2.5 bg-slate-50 font-black text-rose-600 border-rose-200 text-[11px]">₹{(parseFloat(formData.balanceAmount) || 0).toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Tenure</label>
                        <input type="number" name="tenure" value={formData.tenure} onChange={handleChange} className="modern-input !py-2.5 font-black text-[11px]" />
                      </div>
                       <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                         <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">EMI Amount</label>
                         <div className="modern-input !py-2.5 bg-amber-50 border-amber-200 font-black text-amber-700 italic text-[11px]">
                           ₹{parseFloat(formData.emiAmount) > 0 ? parseFloat(formData.emiAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}
                           {parseFloat(formData.tenure) > 0 && parseFloat(formData.balanceAmount) > 0 && (
                             <span className="text-[8px] text-amber-500 ml-1">/month</span>
                           )}
                         </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Booking Dt.</label>
                          <input type="date" name="bookingDate" value={formData.bookingDate} onChange={handleChange} className="modern-input !py-4 text-[12px] font-black" />
                       </div>
                       <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Agreement Dt.</label>
                          <input type="date" name="agreementDate" value={formData.agreementDate} onChange={handleChange} className="modern-input !py-4 text-[12px] font-black" />
                       </div>
                       <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">EMI Start Dt.</label>
                          <input type="date" name="emiStartDate" value={formData.emiStartDate} onChange={handleChange} className="modern-input !py-4 text-[12px] font-black" />
                       </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Status</label>
                        <select name="transactionStatus" value={formData.transactionStatus} onChange={handleChange} className="modern-input !py-2.5 uppercase text-[11px] font-black text-blue-600">
                          <option value="Token">Token</option>
                          <option value="Booked">Booked</option>
                          <option value="Agreement">Agreement</option>
                          <option value="Registered">Registered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">A.Rate</label>
                        <input type="number" name="aRate" value={formData.aRate} onChange={handleChange} className="modern-input !py-2.5 font-black text-[11px]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-[1fr_2fr] items-start gap-4 mt-4">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-right mt-3">Remark</label>
                      <input type="text" name="remarks" value={formData.remarks} onChange={handleChange} className="modern-input !py-2.5 uppercase text-[11px] font-black" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Plot/Unit Information & Direction */}
              <div className="flex flex-col gap-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group">
                  <div className="bg-[#1B315A] px-6 py-3 text-white font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3">
                    <span>🏢</span> Project Information
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Mauza</span>
                        <span className="text-[11px] font-black text-slate-900 uppercase italic">{selectedProject?.mauza || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Khasara</span>
                        <span className="text-[11px] font-black text-slate-900 uppercase italic">{selectedProject?.khasara || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">P.H.N.</span>
                        <span className="text-[11px] font-black text-slate-900 uppercase italic">{selectedProject?.phn || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Taluka</span>
                        <span className="text-[11px] font-black text-slate-900 uppercase italic">{selectedProject?.taluka || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">District</span>
                        <span className="text-[11px] font-black text-slate-900 uppercase italic">{selectedProject?.district || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1B315A] px-6 py-3 text-white font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3">
                    <span>🧭</span> Direction Info
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">East</p>
                        <p className="text-[11px] font-black text-slate-900 uppercase italic truncate">{selectedPlot?.east || '-'}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">West</p>
                        <p className="text-[11px] font-black text-slate-900 uppercase italic truncate">{selectedPlot?.west || '-'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">North</p>
                        <p className="text-[11px] font-black text-slate-900 uppercase italic truncate">{selectedPlot?.north || '-'}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">South</p>
                        <p className="text-[11px] font-black text-slate-900 uppercase italic truncate">{selectedPlot?.south || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Operational Controls */}
                  <div className="p-6 pt-0 space-y-4">
                    <button type="submit" className="w-full bg-[#1B315A] text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:bg-[#F38C32] transition-all active:scale-95">Commit Registry</button>
                    <div className="grid grid-cols-2 gap-4">
                      <button type="button" onClick={() => setShowForm(false)} className="bg-slate-100 text-slate-600 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-slate-200 transition-all">Cancel</button>
                      <button type="button" className="bg-white border border-slate-200 text-blue-600 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-blue-50 transition-all">Modify</button>
                    </div>
                  </div>
                </div>

                {/* Sales Force Assignment Overlay */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-blue-900/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full blur-[50px] -mr-16 -mt-16"></div>
                  <div className="relative z-10 space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 flex items-center gap-2"><span>👥</span> Executive Deployment</h3>
                    <select name="assignedExecutive" value={formData.assignedExecutive} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-3 font-black text-[10px] uppercase">
                      <option value="" className="text-slate-800">-- ASSIGN PERSONNEL --</option>
                      {executives.map(e => <option key={e._id} value={e._id} className="text-slate-800">{e.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

            </div>
          </form>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Project Selection Filter */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-xl">🎯</div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Project Matrix</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Filter Directory by Venture</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 min-w-[300px]">
                <span className="pl-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Venture:</span>
                <select 
                  value={filterProject} 
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="bg-transparent border-none outline-none font-black text-[12px] uppercase text-[#1B315A] flex-1 cursor-pointer"
                >
                  <option value="ALL">ALL VENTURES / PROJECTS</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.projectName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="bg-[#1B315A] px-10 py-5 flex justify-between items-center text-white">
                <h3 className="font-black text-[11px] uppercase tracking-[0.3em]">Strategic Client Inventory</h3>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-[8px] font-black text-blue-300 uppercase tracking-[0.2em] mb-1">Total Assets</p>
                    <p className="text-sm font-black tracking-tighter italic">
                      ₹{customers
                        .filter(c => filterProject === 'ALL' || c.projectId?._id === filterProject)
                        .reduce((sum, c) => sum + (c.dealValue || 0), 0)
                        .toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-white/10 mx-2"></div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-emerald-300 uppercase tracking-[0.2em] mb-1">Recovered Capital</p>
                    <p className="text-sm font-black tracking-tighter italic text-emerald-400">
                      ₹{customers
                        .filter(c => filterProject === 'ALL' || c.projectId?._id === filterProject)
                        .reduce((sum, c) => sum + (c.paidAmount || 0), 0)
                        .toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="modern-table w-full">
                  <thead>
                    <tr>
                      <th className="!py-6">Asset Holder Name</th>
                      <th>Project / Venture</th>
                      <th>Strategic Unit</th>
                      <th className="text-right">Total Deal</th>
                      <th className="text-right">Recovered</th>
                      <th className="text-right">Net Balance</th>
                      <th className="text-center">Lifecycle</th>
                      <th className="text-center">Command</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {customers
                      .filter(c => filterProject === 'ALL' || c.projectId?._id === filterProject)
                      .map((customer) => (
                        <tr key={customer._id} className="group hover:bg-slate-50 transition-colors">
                          <td className="!py-5">
                            <p className="font-black text-[12px] text-[#1B315A] uppercase tracking-tighter group-hover:text-blue-700 transition-colors">
                              {customer.name || `${customer.firstName} ${customer.lastName}`}
                            </p>
                          </td>
                          <td>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight italic">
                              {customer.projectId?.projectName || 'NO ASSET'}
                            </span>
                          </td>
                          <td>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">PLOT</span>
                              <span className="text-[11px] font-black text-slate-900 tracking-tighter">{customer.plotId?.plotNumber || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="text-right font-black text-[11px] text-slate-700">₹{(customer.dealValue || 0).toLocaleString('en-IN')}</td>
                          <td className="text-right">
                             <span className="font-black text-[11px] text-emerald-600 tracking-tighter">₹{(customer.paidAmount || 0).toLocaleString('en-IN')}</span>
                          </td>
                          <td className="text-right">
                             <span className="font-black text-[11px] text-rose-600 tracking-tighter">₹{(customer.balanceAmount || 0).toLocaleString('en-IN')}</span>
                          </td>
                          <td className="text-center">
                            <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm ${
                              customer.transactionStatus === 'Registered' ? 'bg-emerald-500 text-white' : 
                              customer.transactionStatus === 'Cancelled' ? 'bg-rose-500 text-white' : 
                              customer.transactionStatus === 'Booked' ? 'bg-blue-400 text-white' :
                              customer.transactionStatus === 'Agreement' ? 'bg-indigo-500 text-white' :
                              'bg-[#F38C32] text-white'
                            }`}>
                              {customer.transactionStatus || 'Token'}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="flex justify-center gap-2">
                              <button 
                                onClick={() => navigate(`/customers/${customer._id}`)}
                                className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm" 
                                title="View Customer Profile"
                              >
                                👁️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {customers.filter(c => filterProject === 'ALL' || c.projectId?._id === filterProject).length === 0 && (
                  <div className="py-32 text-center bg-slate-50/50">
                    <div className="text-5xl mb-6 grayscale opacity-20">📂</div>
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em]">No Asset Data Found for this Specific Venture Selection</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default Customers;
