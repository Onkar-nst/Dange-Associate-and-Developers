import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const Sidebar = () => {
    const { user } = useAuth();
    const location = useLocation();
    
    const menuGroups = [
        {
            title: 'Inventory & CRM',
            items: [
                { title: 'Customer Hub', link: '/customers', icon: '👤' },
                { title: 'Venture Gallery', link: '/projects', icon: '🏢' },
                { title: 'Asset Plots', link: '/plots', icon: '⛳' },
                { title: 'Client Status', link: '/customer-status', icon: '📉' },
                { title: 'CRM Leads', link: '#', icon: '📡' },
            ]
        },
        {
            title: 'Financial Core',
            items: [
                { title: 'Party Ledger', link: '/party-ledger', icon: '📔' },
                { title: 'Account Vault', link: '/ledger-accounts', icon: '💎' },
                { title: 'Post Transaction', link: '/transactions', icon: '💸' },
                { title: 'Journal (JV)', link: '/jv-entry', icon: '📓' },
                { title: 'Daily Cash Flow', link: '/report/daily-collection', icon: '💵' },
            ]
        },
        {
            title: 'Enterprise Audit',
            items: [
                { title: 'Sales Analytics', link: '/report/sales', icon: '📈' },
                { title: 'Master Statement', link: '/report/customer-statement', icon: '📜' },
                { title: 'Outstanding Dues', link: '/report/outstanding', icon: '⚠️' },
                { title: 'EMI Schedule', link: '/report/dues', icon: '📅' },
                { title: 'Global Cash Book', link: '/report/cash-book', icon: '📖' },
            ]
        },
        {
            title: 'Administration',
            items: [
                { title: 'AI Assistant', link: '/ai-assistant', icon: '🤖' },
                { title: 'Personnel Board', link: '/executives', icon: '👔' },
                { title: 'Commission HQ', link: '/commissions', icon: '💰' },
                { title: 'System Access', link: '/users', icon: '🛡️' },
            ]
        }
    ];

    return (
        <div className="w-72 bg-slate-900 h-full flex flex-col border-r border-slate-800 shadow-2xl shadow-slate-900/20 z-50">
            {/* Branding Header */}
            <div className="p-8 border-b border-white/5 flex justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="bg-white p-4 rounded-xl shadow-lg shadow-white/5">
                        <img src={logo} alt="Logo" className="h-16 w-auto" />
                    </div>
                    <div className="text-center mt-2">
                        <h1 className="text-[10px] font-black text-white tracking-tighter uppercase leading-none">Dange Associates</h1>
                        <p className="text-[8px] font-bold text-[#F38C32] uppercase tracking-[0.3em] mt-1 italic">Connecting Your Dreams</p>
                    </div>
                </div>
            </div>
            
            {/* Navigation Scroll Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8 scrollbar-hide">
                {menuGroups.map((group, gIdx) => (
                    <div key={gIdx}>
                        <div className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                            <span className="h-px bg-white/5 flex-1"></span>
                            {group.title}
                            <span className="h-px bg-white/5 flex-1"></span>
                        </div>
                        <ul className="space-y-1">
                            {group.items.map((item, iIdx) => {
                                const isActive = location.pathname === item.link;
                                return (
                                    <li key={iIdx}>
                                        <Link 
                                            to={item.link}
                                            className={`group flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-tight transition-all duration-300 ${
                                                isActive 
                                                ? 'bg-[#F38C32] text-white shadow-lg shadow-orange-500/20 translate-x-1' 
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                                            }`}
                                        >
                                            <span className={`text-base transition-transform group-hover:scale-125 ${isActive ? 'scale-110' : ''}`}>
                                                {item.icon}
                                            </span>
                                            <span className="flex-1">{item.title}</span>
                                            {isActive && (
                                                <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>

            {/* User Footer Context */}
            <div className="p-6 border-t border-white/5 mt-auto bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-[#F38C32] text-white flex items-center justify-center font-black text-xs uppercase">
                        {user?.userId?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-white uppercase tracking-tight truncate">{user?.userId || 'User'}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Secure Console</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
