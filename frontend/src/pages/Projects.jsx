import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../api/services';
import Layout from '../components/Layout';
import './Customers.css';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const initialFormState = {
    branch: 'MAIN BRANCH',
    projectCode: '',
    projectName: '',
    mauza: '',
    khasara: '',
    phn: '',
    taluka: '',
    district: '',
    totalPlots: '',
    status: 'Open',
    area: '',
    saleType: 'Current',
    projectDetails: '',
    location: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll({ active: true });
      setProjects(response.data.data || []);
    } catch (err) {
      setError('Operational Error: Project List Inaccessible');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (project) => {
    setFormData({
      branch: project.branch || 'MAIN BRANCH',
      projectCode: project.projectCode || '',
      projectName: project.projectName || '',
      mauza: project.mauza || '',
      khasara: project.khasara || '',
      phn: project.phn || '',
      taluka: project.taluka || '',
      district: project.district || '',
      totalPlots: project.totalPlots || '',
      status: project.status || 'Open',
      area: project.area || '',
      saleType: project.saleType || 'Current',
      projectDetails: project.projectDetails || '',
      location: project.location || '',
    });
    setEditId(project._id);
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const submissionData = {
      ...formData,
      totalPlots: parseInt(formData.totalPlots) || 0,
      location: formData.location || formData.district || 'N/A'
    };

    try {
      if (isEditing) {
        await projectAPI.update(editId, submissionData);
        setSuccess('Registry Update: Venture Profile Modified');
      } else {
        await projectAPI.create(submissionData);
        setSuccess('Registry Success: Venture Profile Created');
      }
      setShowForm(false);
      setIsEditing(false);
      setEditId(null);
      setFormData(initialFormState);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'System Error: Registry Protocol Failed');
    }
  };

  const Label = ({ children, icon }) => (
    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-2">
      <span>{icon}</span> {children}
    </label>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="font-black text-slate-300 uppercase tracking-[0.5em] animate-pulse">Syncing Venture Matrix...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-12 animate-fade-in px-4 pb-20">
        
        {/* Protocol Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-4">
              <span>🏗️</span> Venture Portfolio
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real Estate Assets & Strategic Land Developments</p>
          </div>
          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setIsEditing(false);
                setEditId(null);
                setFormData(initialFormState);
              } else {
                setShowForm(true);
              }
              setError('');
              setSuccess('');
            }}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all shadow-xl active:scale-95 ${
              showForm ? 'bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-500 hover:text-white' : 'bg-slate-900 text-white hover:bg-blue-600 shadow-blue-500/10'
            }`}
          >
            {showForm ? 'Terminate Entry' : '+ Register New Venture'}
          </button>
        </div>

        {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-shake leading-relaxed">{error}</div>}
        {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-fade-in">{success}</div>}

        {showForm ? (
          <div className="max-w-5xl mx-auto">
            <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl shadow-blue-900/10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
              
              <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                  <h2 className="text-xl font-black uppercase tracking-tighter italic">
                    {isEditing ? '🚀 Update Venture Matrix' : '🎯 New Venture Entry'}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label icon="📍">Select Branch</Label>
                    <select name="branch" value={formData.branch} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-3.5 uppercase font-black text-[11px]">
                      <option value="MAIN BRANCH" className="text-slate-800">MAIN BRANCH</option>
                    </select>
                  </div>
                  <div>
                    <Label icon="🆔">Project Code</Label>
                    <input type="text" name="projectCode" value={formData.projectCode} onChange={handleChange} maxLength="4" className="modern-input !bg-white/5 !border-white/10 !text-white !py-3.5 font-mono text-[11px]" placeholder="ONLY 4 CHARS" required />
                    <p className="text-[7px] text-rose-400 font-bold uppercase tracking-widest mt-1">(*Do not Enter Space or Special Character *Only 4 character)</p>
                  </div>
                  <div>
                    <Label icon="🏢">Project Name</Label>
                    <input type="text" name="projectName" value={formData.projectName} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-3.5 uppercase text-[11px]" placeholder="VENTURE NAME" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <Label icon="🛰️">Mauja</Label>
                    <input type="text" name="mauza" value={formData.mauza} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-3 text-[11px] uppercase italic" placeholder="MAUJA" />
                  </div>
                  <div>
                    <Label icon="🛰️">Khasara</Label>
                    <input type="text" name="khasara" value={formData.khasara} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-3 text-[11px] uppercase italic" placeholder="KHASARA" />
                  </div>
                  <div>
                    <Label icon="🛰️">Phn</Label>
                    <input type="text" name="phn" value={formData.phn} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-3 text-[11px] uppercase italic" placeholder="PHN" />
                  </div>
                  <div>
                    <Label icon="🛰️">Taluka</Label>
                    <input type="text" name="taluka" value={formData.taluka} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-3 text-[11px] uppercase italic" placeholder="TALUKA" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <Label icon="📍">District</Label>
                    <input type="text" name="district" value={formData.district} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-3 text-[11px] uppercase font-black" placeholder="DISTRICT" />
                  </div>
                  <div>
                    <Label icon="🏘️">No.of Plots</Label>
                    <input type="number" name="totalPlots" value={formData.totalPlots} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-3 font-black text-[11px]" placeholder="0" required />
                  </div>
                  <div>
                    <Label icon="⚡">Status</Label>
                    <select name="status" value={formData.status} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-3 font-black text-[11px]">
                      <option value="Open" className="text-slate-800">OPEN</option>
                      <option value="Close" className="text-slate-800">CLOSE</option>
                    </select>
                  </div>
                  <div>
                    <Label icon="📐">Area</Label>
                    <input type="text" name="area" value={formData.area} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-3 font-black text-[11px]" placeholder="SQFT" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label icon="💹">Sale</Label>
                    <select name="saleType" value={formData.saleType} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-3 font-black text-[11px]">
                      <option value="Current" className="text-slate-800">CURRENT</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label icon="📝">Details Of Project</Label>
                    <textarea name="projectDetails" value={formData.projectDetails} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-3 h-[42px] text-[11px] resize-none uppercase" placeholder="ADDITIONAL PROJECT NOTES..."></textarea>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button type="submit" className="flex-1 bg-white text-slate-900 py-4 rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-95">
                    {isEditing ? 'COMMIT MATRIX UPDATE' : 'Commit Venture Registry'}
                  </button>
                  <button type="button" onClick={() => {
                    setShowForm(false);
                    setIsEditing(false);
                    setEditId(null);
                    setFormData(initialFormState);
                  }} className="px-10 bg-white/5 border border-white/10 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">Abort</button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {projects.map((project) => (
              <div key={project._id} className="group relative bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-700 overflow-hidden flex flex-col h-full">
                
                {/* Visual Accent - Top Right Badge */}
                <div className="absolute top-0 right-0 w-28 h-28 bg-slate-900 group-hover:bg-[#1B315A] transition-all duration-500 rounded-bl-[3rem] -mr-8 -mt-8 flex items-end justify-start p-8 shadow-2xl">
                   <span className="text-white text-[12px] font-black tracking-tighter italic">{project.projectCode}</span>
                </div>

                {/* Status & Identity */}
                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                      project.status === 'Open' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {project.status === 'Open' ? 'ACTIVE' : 'ARCHIVED'}
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase leading-tight group-hover:text-blue-700 transition-colors italic">
                    {project.projectName}
                  </h3>
                </div>

                {/* Strategic Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100 flex flex-col justify-center transition-all group-hover:bg-white group-hover:border-blue-100">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Units</p>
                    <p className="text-base font-black text-slate-800 tracking-tight italic">{project.totalPlots} <span className="text-[8px] text-slate-400 uppercase">Plots</span></p>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100 flex flex-col justify-center transition-all group-hover:bg-white group-hover:border-blue-100">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Area</p>
                    <p className="text-base font-black text-slate-800 tracking-tight italic truncate">{project.area || 'N/A'}</p>
                  </div>
                </div>

                {/* Geospatial Registry */}
                <div className="flex-1 space-y-4">
                   <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-sm shadow-sm">📍</div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-700 uppercase italic tracking-tight leading-none">{project.mauza}, {project.taluka}</p>
                        <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">{project.district}</p>
                      </div>
                   </div>

                   <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-sm shadow-sm">⚡</div>
                      <div className="flex-1">
                        <p className={`text-[10px] font-black uppercase italic tracking-tight leading-none ${
                          project.saleType === 'Hot Property' ? 'text-rose-600' : 'text-amber-600'
                        }`}>{project.saleType || 'CURRENT'}</p>
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 italic">KHASARA: {project.khasara || 'N/A'}</p>
                      </div>
                   </div>
                </div>

                {/* Command Bar */}
                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center bg-white">
                   <button 
                     onClick={() => navigate(`/projects/${project._id}/status`)}
                     className="flex items-center gap-2 bg-[#1B315A] text-white px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[#F38C32] transition-all shadow-xl shadow-blue-900/10 active:scale-95"
                     title="View Inventory Status"
                   >
                     <span>📦</span> EXPLORE
                   </button>
                   <button 
                     onClick={() => handleEdit(project)}
                     className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                     title="Modify Venture Details"
                   >
                     ⚙️
                   </button>
                </div>

                {/* Background Pattern */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"></div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="col-span-full py-40 border-2 border-dashed border-slate-100 rounded-[4rem] text-center bg-white/50 animate-fade-in grayscale">
                <div className="text-7xl mb-8">🏛️</div>
                <p className="text-[11px] font-black text-slate-200 uppercase tracking-[0.5em]">No Ventures Commissioned / System Idle</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Projects;
