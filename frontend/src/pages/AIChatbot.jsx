import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { chatbotAPI } from '../api/services';
import logo from '../assets/logo.png';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';


// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const AIChatbot = () => {
    const location = useLocation();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [context, setContext] = useState(null);
    const [contextLoading, setContextLoading] = useState(false);
    const [contextTimestamp, setContextTimestamp] = useState(null);
    const [isListening, setIsListening] = useState(false);
    // Use ref to track listening state inside event handlers to avoid stale closures
    const isListeningRef = useRef(false);
    const messagesEndRef = useRef(null);
    const hasAutoQueried = useRef(false);
    const messagesContainerRef = useRef(null);
    const recognitionRef = useRef(null);

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-IN';

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                
                if (finalTranscript) {
                   setInput(prev => {
                       const newInput = (prev + ' ' + finalTranscript).trim();
                       return newInput.replace(/\s+/g, ' ');
                   });
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    alert('Please allow microphone access to use voice commands.');
                    isListeningRef.current = false;
                    setIsListening(false);
                }
            };
            
            recognitionRef.current.onend = () => {
                // Only restart if the REF says we should still be listening
                if (isListeningRef.current) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        // ignore
                    }
                } else {
                    setIsListening(false);
                }
            };
        }
        
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleVoiceInput = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in your browser');
            return;
        }

        if (isListening) {
            // STOP
            isListeningRef.current = false;
            setIsListening(false);
            recognitionRef.current.stop();
        } else {
            // START
            isListeningRef.current = true;
            setIsListening(true);
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Failed to start speech recognition:", e);
            }
        }
    };

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            scrollToBottom();
        }, 100);
        return () => clearTimeout(timer);
    }, [messages, loading]);

    useEffect(() => {
        fetchContext();
    }, []);

    // Auto-query effect
    useEffect(() => {
        if (context && location.state?.autoQuery && !hasAutoQueried.current) {
            hasAutoQueried.current = true;
            processQuery(location.state.autoQuery);
            // Clear location state logic if needed, but react-router state persists until replaced.
            // rely on ref to fire once per mount.
        }
    }, [context, location.state]);

    const fetchContext = async () => {
        setContextLoading(true);
        try {
            const response = await chatbotAPI.getContext();
            setContext(response.data.data);
            setContextTimestamp(new Date().toLocaleTimeString());
        } catch (err) {
            console.error('Context fetch error:', err);
        } finally {
            setContextLoading(false);
        }
    };

    const processQuery = async (queryText) => {
        if (!queryText.trim() || loading) return;

        const userMessage = { role: 'user', content: queryText };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        setTimeout(scrollToBottom, 50);

        try {
            const response = await chatbotAPI.query({ question: queryText, context });
            const aiMessage = { role: 'assistant', content: response.data.data.answer };
            setMessages(prev => [...prev, aiMessage]);
        } catch (err) {
            const errorMessage = { role: 'assistant', content: `Error: ${err.response?.data?.error || 'Failed to get response'}`, isError: true };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        processQuery(input);
    };

    // Parse chart data and markdown tables from message content
    const parseContent = (content) => {
        const parts = [];
        let remaining = content;
        
        // Helper to check if a string looks like a markdown table
        const isMarkdownTable = (text) => {
            const lines = text.trim().split('\n');
            if (lines.length < 3) return false;
            // Check for separator line like |---|---|
            return lines[1].trim().match(/^\|?[-:\s|]+\|?$/); 
        };

        // Convert markdown table to structured object
        const parseMarkdownTable = (markdown) => {
            const lines = markdown.trim().split('\n').filter(l => l.trim());
            if (lines.length < 3) return null;

            // Remove leading/trailing pipes
            const cleanLine = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
            
            const headers = cleanLine(lines[0]);
            const rows = lines.slice(2).map(cleanLine);

            return {
                type: 'table',
                title: 'Data Summary',
                headers,
                rows
            };
        };
        
        // 1. First extract explicit JSON charts
        // We'll use a placeholder to swap them back in later to avoid messing up markdown parsing
        const extractedCharts = [];
        
        while (remaining.includes('|||CHART|||')) {
            const startIdx = remaining.indexOf('|||CHART|||');
            const endIdx = remaining.indexOf('|||END_CHART|||');
            
            if (startIdx === -1 || endIdx === -1) break;
            
            const chartJson = remaining.substring(startIdx + 11, endIdx).trim();
            try {
                const chartData = JSON.parse(chartJson);
                extractedCharts.push(chartData);
                // Replace with placeholder
                const placeholder = `__CHART_PLACEHOLDER_${extractedCharts.length - 1}__`;
                remaining = remaining.substring(0, startIdx) + placeholder + remaining.substring(endIdx + 15);
            } catch (e) {
                console.error('Failed to parse chart JSON:', e);
                // remove specific broken chart block
                remaining = remaining.substring(0, startIdx) + remaining.substring(endIdx + 15);
            }
        }

        // 2. Now split by placeholders and handle text/tables in between
        const splitByPlaceholder = remaining.split(/(__CHART_PLACEHOLDER_\d+__)/);

        splitByPlaceholder.forEach(segment => {
            const match = segment.match(/__CHART_PLACEHOLDER_(\d+)__/);
            if (match) {
                const chartIndex = parseInt(match[1]);
                parts.push({ type: 'chart', data: extractedCharts[chartIndex] });
            } else if (segment.trim()) {
                // Check for markdown tables in this text segment
                // Simple regex to find markdown table blocks
                const tableRegex = /(\|.*\|.*\n\|[-:| ]+\|\n(?:\|.*\|.*\n?)+)/g;
                const textParts = segment.split(tableRegex);
                
                textParts.forEach(textPart => {
                    if (isMarkdownTable(textPart)) {
                        const tableData = parseMarkdownTable(textPart);
                        if (tableData) {
                            parts.push({ type: 'chart', data: tableData });
                        } else {
                            parts.push({ type: 'text', content: textPart });
                        }
                    } else if (textPart.trim()) {
                        parts.push({ type: 'text', content: textPart });
                    }
                });
            }
        });
        
        return parts.length > 0 ? parts : [{ type: 'text', content }];
    };

    // Render a chart based on data
    const renderChart = (chartData, idx) => {
        const colors = [
            'rgba(34, 211, 238, 0.7)', // Cyan
            'rgba(52, 211, 153, 0.7)', // Emerald
            'rgba(251, 191, 36, 0.7)', // Amber
            'rgba(248, 113, 113, 0.7)', // Red
            'rgba(129, 140, 248, 0.7)', // Indigo
            'rgba(244, 114, 182, 0.7)', // Pink
        ];

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: chartData.type === 'pie',
                    labels: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10, weight: 'bold' } }
                }
            },
            scales: chartData.type === 'bar' ? {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: 'rgba(255, 255, 255, 0.3)' } },
                x: { grid: { display: false }, ticks: { color: 'rgba(255, 255, 255, 0.3)' } }
            } : {}
        };

        if (chartData.type === 'bar') {
            const data = {
                labels: chartData.labels,
                datasets: [{
                    label: chartData.label || 'Value',
                    data: chartData.data,
                    backgroundColor: colors,
                    borderRadius: 12,
                }]
            };
            return (
                <div key={idx} className="my-8 p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-sm">
                    <p className="text-[10px] font-black text-cyan-500/60 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1 h-3 bg-cyan-500 rounded-full"></span>
                        {chartData.title}
                    </p>
                    <div style={{ height: '250px' }}>
                        <Bar data={data} options={commonOptions} />
                    </div>
                </div>
            );
        }

        if (chartData.type === 'pie') {
            const data = {
                labels: chartData.labels,
                datasets: [{
                    data: chartData.data,
                    backgroundColor: colors,
                    borderColor: 'rgba(15, 23, 42, 0.5)',
                    borderWidth: 2
                }]
            };
            return (
                <div key={idx} className="my-8 p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-sm">
                    <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1 h-3 bg-emerald-500 rounded-full"></span>
                        {chartData.title}
                    </p>
                    <div style={{ height: '250px' }} className="flex justify-center">
                        <Pie data={data} options={commonOptions} />
                    </div>
                </div>
            );
        }

        if (chartData.type === 'table') {
            return (
                <div key={idx} className="my-8 w-full overflow-hidden bg-white/[0.02] border border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-sm">
                    <div className="p-5 bg-white/5 border-b border-white/5">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{String(chartData.title || 'Data Set Analysis')}</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="text-[10px] text-slate-500 uppercase bg-white/5 font-black">
                                <tr>
                                    {(chartData.headers || []).map((h, i) => (
                                        <th key={i} className="px-6 py-4 whitespace-nowrap tracking-wider">{String(h)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-slate-300">
                                {(Array.isArray(chartData.rows) ? chartData.rows : []).map((row, ri) => {
                                    const cells = Array.isArray(row) ? row : [row];
                                    return (
                                        <tr key={ri} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                            {cells.map((cell, ci) => (
                                                <td key={ci} className="px-6 py-4 font-medium whitespace-nowrap">
                                                    {typeof cell === 'object' && cell !== null 
                                                        ? JSON.stringify(cell) 
                                                        : String(cell ?? '')}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        return null;
    };

    const formatMessage = (content) => {
        const parts = parseContent(content);
        
        return parts.map((part, partIdx) => {
            if (part.type === 'chart') {
                return renderChart(part.data, partIdx);
            }
            
            // Render text with basic formatting
            return part.content.split('\n').map((line, i) => {
                const key = `${partIdx}-${i}`;
                if (line.trim() === '') return <br key={key} />;
                if (line.startsWith('• ') || line.startsWith('- ')) {
                    return <li key={key} className="ml-4 text-slate-300">{line.substring(2)}</li>;
                }
                if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={key} className="font-black text-white mt-4 first:mt-0">{line.slice(2, -2)}</p>;
                }
                return <p key={key} className="text-slate-300">{line}</p>;
            });
        });
    };

    return (
        <Layout hideFooter>
            <div className="min-h-screen -m-10 p-10 bg-[#0f172a] text-slate-200">
                <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
                    {/* Header - Sophisticated Dark */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
                        <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                        <div className="relative z-10">
                            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                                <span className="text-cyan-400">AI</span> Intelligence 
                            </h1>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                Neural Engine active • synchronized
                            </p>
                        </div>
                        <button
                            onClick={fetchContext}
                            disabled={contextLoading}
                            className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 border shadow-2xl ${
                                contextLoading 
                                    ? 'bg-slate-900 border-slate-800 text-slate-600'
                                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 active:scale-95'
                            }`}
                        >
                            {contextLoading ? (
                                <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
                            ) : (
                                <span className="text-lg">🔄</span>
                            )}
                            Sync Matrix
                        </button>
                    </div>

                    {/* Context Status Glass Card */}
                    {context && (
                        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 flex flex-wrap items-center gap-12 shadow-2xl">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <span className="block w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                                    <span className="absolute inset-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-75"></span>
                                </div>
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Connected</span>
                            </div>
                            <div className="flex gap-10 text-[11px] font-black text-slate-400 uppercase">
                                <span className="flex items-center gap-2"><b className="text-white">{context.businessSummary?.totalProjects}</b> Ventures</span>
                                <span className="flex items-center gap-2"><b className="text-white">{context.businessSummary?.totalCustomers}</b> Entities</span>
                                <span className="flex items-center gap-2"><b className="text-white">₹{(context.businessSummary?.totalCollected / 100000).toFixed(1)}L</b> Revenue</span>
                            </div>
                        </div>
                    )}

                    {/* Chat Container */}
                    <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative" style={{ height: 'calc(100vh - 300px)', minHeight: '650px' }}>
                        
                        {/* Messages Area */}
                        <div 
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto p-12 space-y-10 scroll-smooth"
                        >
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-10 opacity-50">
                                    <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center text-5xl border border-white/10 shadow-2xl">🤖</div>
                                    <div className="space-y-3">
                                        <p className="text-[16px] font-black text-white uppercase tracking-[0.5em]">Ready for Analysis</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Query established business patterns for insights</p>
                                    </div>
                                    <div className="flex flex-wrap gap-4 justify-center max-w-2xl">
                                        {[
                                            'Analyze payment status',
                                            'Sync outstanding balances',
                                            'Top performing projects',
                                            'Summarize revenue'
                                        ].map((suggestion, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setInput(suggestion)}
                                                className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 hover:bg-cyan-500/10 hover:border-cyan-500/40 hover:text-cyan-400 transition-all uppercase tracking-widest"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((message, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-[2.5rem] px-10 py-6 relative ${
                                            message.role === 'user'
                                                ? 'bg-cyan-600 text-white shadow-[0_20px_40px_-10px_rgba(8,145,178,0.4)]'
                                                : message.isError
                                                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                                                    : 'bg-white/5 border border-white/10 text-slate-200 shadow-2xl'
                                        }`}
                                    >
                                        {message.role === 'assistant' && (
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-6 h-6 bg-cyan-500/20 rounded-lg flex items-center justify-center text-[10px] border border-cyan-500/30">🤖</div>
                                                <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest">Neural Response</span>
                                            </div>
                                        )}
                                        <div className="text-[15px] font-medium leading-[1.8] space-y-3">
                                            {formatMessage(message.content)}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 border border-white/10 rounded-[2rem] px-10 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="flex gap-2">
                                                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                            <span className="text-[11px] font-black text-cyan-500 uppercase tracking-[0.4em] font-mono">Synthesizing...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSubmit} className="border-t border-white/5 p-8 bg-black/40 backdrop-blur-md">
                            <div className="flex gap-5">
                                <button
                                    type="button"
                                    onClick={toggleVoiceInput}
                                    disabled={loading || !context}
                                    className={`w-18 h-18 px-6 rounded-2xl font-black text-2xl transition-all disabled:opacity-20 shadow-2xl flex items-center justify-center border ${
                                        isListening 
                                            ? 'bg-rose-500 border-rose-400 text-white animate-pulse' 
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {isListening ? '🛑' : '🎤'}
                                </button>
                                
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={isListening ? 'Listening for input...' : 'Ask about your business intelligence...'}
                                    disabled={loading || !context}
                                    className={`flex-1 px-8 h-18 bg-white/5 border rounded-2xl outline-none font-bold text-sm text-white placeholder:text-slate-600 disabled:opacity-30 transition-all ${
                                        isListening 
                                            ? 'border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.1)]' 
                                            : 'border-white/10 focus:border-cyan-500 focus:bg-white/[0.08]'
                                    }`}
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim() || !context}
                                    className="px-12 h-18 bg-white text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#F38C32] hover:text-white transition-all disabled:opacity-20 active:scale-95 shadow-2xl flex items-center gap-4 group"
                                >
                                    <span>Execute</span>
                                    <span className="text-xl group-hover:translate-x-1 transition-transform">➔</span>
                                </button>
                            </div>
                            {isListening && (
                                <p className="text-[11px] font-black text-rose-500 uppercase tracking-[0.5em] mt-5 text-center animate-pulse flex items-center justify-center gap-4">
                                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                                    Vocal Core Listening
                                </p>
                            )}
                        </form>
                    </div>

                    {/* Footer - Tech Identity */}
                    <footer className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 pb-10">
                        <div className="flex items-center gap-6 group">
                            <div className="bg-white/10 p-2 rounded-xl border border-white/10 group-hover:border-cyan-500/50 transition-all">
                                <img src={logo} alt="Logo" className="w-10 h-auto" />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-[10px] font-black text-white hover:text-cyan-400 transition-colors uppercase tracking-[0.4em]">Integrated Real Estate Intelligence System © 2026</p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Tactical Business Command Unit</p>
                            </div>
                        </div>
                        <div className="flex gap-10">
                            <div className="flex items-center gap-3">
                                <span className="text-blue-500 text-lg">🛡️</span>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">SSL ENCRYPTED</span>
                                    <span className="text-[7px] font-bold text-slate-500 uppercase">Secure Link Active</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-emerald-500 text-lg">⚡</span>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">LATENCY: 14MS</span>
                                    <span className="text-[7px] font-bold text-slate-500 uppercase">Neural Response Optimized</span>
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </Layout>
    );
};

export default AIChatbot;
