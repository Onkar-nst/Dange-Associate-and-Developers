import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { chatbotAPI } from '../api/services';
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
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
        ];

        if (chartData.type === 'bar') {
            const data = {
                labels: chartData.labels,
                datasets: [{
                    label: chartData.label || 'Value',
                    data: chartData.data,
                    backgroundColor: colors,
                    borderRadius: 8,
                }]
            };
            return (
                <div key={idx} className="my-4 p-4 bg-white rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{chartData.title}</p>
                    <div style={{ height: '200px' }}>
                        <Bar data={data} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
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
                }]
            };
            return (
                <div key={idx} className="my-4 p-4 bg-white rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{chartData.title}</p>
                    <div style={{ height: '200px' }} className="flex justify-center">
                        <Pie data={data} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
            );
        }

        if (chartData.type === 'table') {
            return (
                <div key={idx} className="my-4 w-full overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="p-3 bg-slate-50 border-b border-slate-200">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{String(chartData.title || 'Summary List')}</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 font-black">
                                <tr>
                                    {(chartData.headers || []).map((h, i) => (
                                        <th key={i} className="px-4 py-3 whitespace-nowrap">{String(h)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(Array.isArray(chartData.rows) ? chartData.rows : []).map((row, ri) => {
                                    // Ensure row is an array, if not, wrap it or handle it
                                    const cells = Array.isArray(row) ? row : [row];
                                    return (
                                        <tr key={ri} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                            {cells.map((cell, ci) => (
                                                <td key={ci} className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
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
                    return <li key={key} className="ml-4">{line.substring(2)}</li>;
                }
                if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={key} className="font-black">{line.slice(2, -2)}</p>;
                }
                return <p key={key}>{line}</p>;
            });
        });
    };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight">
                            AI Business Assistant
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">
                            Powered by Google Gemini • Real-Time Data Intelligence
                        </p>
                    </div>
                    <button
                        onClick={fetchContext}
                        disabled={contextLoading}
                        className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg ${
                            contextLoading 
                                ? 'bg-slate-100 text-slate-400'
                                : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95'
                        }`}
                    >
                        {contextLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                Syncing Data...
                            </>
                        ) : (
                            <>
                                <span>🔄</span> Refresh Data Context
                            </>
                        )}
                    </button>
                </div>

                {/* Context Status */}
                {context && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Context Active</span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Last sync: {contextTimestamp}
                        </div>
                        <div className="flex gap-4 text-[10px] font-black text-slate-600 uppercase">
                            <span>📊 {context.businessSummary?.totalProjects} Projects</span>
                            <span>👥 {context.businessSummary?.totalCustomers} Customers</span>
                            <span>💰 ₹{(context.businessSummary?.totalCollected / 100000).toFixed(1)}L Collected</span>
                        </div>
                    </div>
                )}

                {/* Chat Container */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}>
                    {/* Messages Area */}
                    <div 
                        ref={messagesContainerRef}
                        className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-50">
                                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-4xl">🤖</div>
                                <div>
                                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Ready to Analyze</p>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Ask me about your business data</p>
                                </div>
                                <div className="flex flex-wrap gap-3 justify-center max-w-lg">
                                    {[
                                        'Show payment status breakdown',
                                        'What is the total outstanding?',
                                        'List top customers by amount',
                                        'Compare project revenues'
                                    ].map((suggestion, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(suggestion)}
                                            className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all"
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
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-3xl px-6 py-4 ${
                                        message.role === 'user'
                                            ? 'bg-slate-900 text-white'
                                            : message.isError
                                                ? 'bg-rose-50 border border-rose-100 text-rose-700'
                                                : 'bg-slate-50 border border-slate-100 text-slate-700'
                                    }`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-5 h-5 bg-slate-200 rounded-lg flex items-center justify-center text-[10px]">🤖</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AI Response</span>
                                        </div>
                                    )}
                                    <div className="text-[13px] font-medium leading-relaxed space-y-1">
                                        {formatMessage(message.content)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyzing...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="border-t border-slate-100 p-6 bg-slate-50/50">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={toggleVoiceInput}
                                disabled={loading || !context}
                                className={`px-4 py-4 rounded-2xl font-black text-lg transition-all disabled:opacity-50 shadow-lg ${
                                    isListening 
                                        ? 'bg-rose-500 text-white animate-pulse' 
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
                                }`}
                                title={isListening ? 'Stop listening' : 'Voice input'}
                            >
                                {isListening ? '🎙️' : '🎤'}
                            </button>
                            
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={isListening ? 'Listening...' : 'Ask about your business data...'}
                                disabled={loading || !context}
                                className={`flex-1 px-6 py-4 bg-white border rounded-2xl outline-none font-bold text-sm text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 disabled:opacity-50 transition-all ${
                                    isListening ? 'border-rose-300 ring-4 ring-rose-500/20' : 'border-slate-200'
                                }`}
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim() || !context}
                                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#F38C32] transition-all disabled:opacity-50 disabled:hover:bg-slate-900 active:scale-95 shadow-lg flex items-center gap-2"
                            >
                                <span>Send</span>
                                <span>➔</span>
                            </button>
                        </div>
                        {isListening && (
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-3 text-center animate-pulse">
                                🎙️ Listening... Speak now
                            </p>
                        )}
                        {!context && !isListening && (
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-3 text-center">
                                ⚠️ Waiting for data context to load...
                            </p>
                        )}
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default AIChatbot;
