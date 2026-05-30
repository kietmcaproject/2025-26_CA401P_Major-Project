import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Bot, Loader2, Coins, ShoppingCart, AlertTriangle, CheckCircle2, Zap, History, TrendingUp, Clock, BarChart2, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { buildApiUrl } from '../lib/api';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="glass-panel p-4 flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${color} border border-white/10`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-textMuted text-xs">{label}</p>
        </div>
    </div>
);

const Dashboard = () => {
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const { user, refreshCredits } = useAuthContext();
    const { addToast } = useToast();

    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [resumeData, setResumeData] = useState(null);
    const [starting, setStarting] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get(buildApiUrl('/api/interview/history'), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setHistory(res.data);
            } catch (err) {
                console.error('Error fetching history', err);
                addToast('Failed to load interview history', 'error');
            } finally {
                setLoadingHistory(false);
            }
        };
        fetchHistory();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadSuccess(false);
            setResumeData(null);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError('');
        const formData = new FormData();
        formData.append('resume', file);
        const token = localStorage.getItem('token');
        try {
            const res = await axios.post(buildApiUrl('/api/resume/upload'), formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            setResumeData(res.data);
            setFile(null);
            setUploadSuccess(true);
        } catch (err) {
            const msg = err.response?.data?.message || 'Error uploading resume';
            setError(msg);
            addToast(msg, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleStartInterview = async () => {
        if (!resumeData) return;
        if ((user?.credits ?? 0) <= 0) {
            setError('You have no credits left. Please purchase more credits.');
            return;
        }
        setStarting(true);
        setError('');
        const token = localStorage.getItem('token');
        try {
            const res = await axios.post(buildApiUrl('/api/interview/start'), { resumeId: resumeData._id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await refreshCredits();
            navigate(`/setup/${res.data.interviewId}`, { state: { interviewId: res.data.interviewId } });
        } catch (err) {
            if (err.response?.data?.code === 'NO_CREDITS') {
                const msg = 'No credits remaining. Please purchase a credit pack to continue.';
                setError(msg);
                addToast(msg, 'error');
            } else {
                const msg = err.response?.data?.message || 'Error starting interview';
                setError(msg);
                addToast(msg, 'error');
            }
        } finally {
            setStarting(false);
        }
    };

    const credits = user?.credits ?? 0;
    const avgScore = history.length > 0
        ? (history.reduce((acc, i) => acc + parseFloat(i.totalScore || 0), 0) / history.length).toFixed(1)
        : '—';
    const bestScore = history.length > 0
        ? Math.max(...history.map(i => parseFloat(i.totalScore || 0))).toFixed(1)
        : '—';

    const chartData = [...history].reverse().map((h, i) => ({
        name: `Int ${i + 1}`,
        score: parseFloat(h.totalScore || 0)
    }));

    return (
        <div className="max-w-6xl mx-auto w-full px-4 py-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-3xl font-extrabold">
                    Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">{user?.name?.split(' ')[0]}</span> 👋
                </h1>
                <p className="text-textMuted mt-1">Ready to crush your next interview? Let's practice.</p>
            </motion.div>

            {/* Stats Row */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
                <StatCard icon={Coins} label="Credits Left" value={credits} color={credits <= 0 ? 'bg-red-500/20 text-red-400' : credits <= 2 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-primary/20 text-primary'} />
                <StatCard icon={History} label="Interviews Done" value={history.length} color="bg-purple-500/20 text-purple-400" />
                <StatCard icon={BarChart2} label="Avg Score" value={avgScore !== '—' ? `${avgScore}/10` : '—'} color="bg-secondary/20 text-secondary" />
                <StatCard icon={TrendingUp} label="Best Score" value={bestScore !== '—' ? `${bestScore}/10` : '—'} color="bg-amber-500/20 text-amber-400" />
            </motion.div>

            {/* Credits Banner */}
            {credits <= 2 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className={`mb-6 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        credits <= 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-5 h-5 ${credits <= 0 ? 'text-red-400' : 'text-yellow-400'}`} />
                        <p className="text-sm font-medium">
                            {credits <= 0 ? 'Out of credits — buy more to start a new interview.' : `Only ${credits} credit${credits !== 1 ? 's' : ''} remaining — consider topping up!`}
                        </p>
                    </div>
                    <Link to="/pricing" className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
                        <ShoppingCart className="w-4 h-4" /> Buy Credits
                    </Link>
                </motion.div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Upload */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="glass-panel p-6 flex flex-col items-center justify-center text-center min-h-[300px] relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <AnimatePresence mode="wait">
                        {uploadSuccess ? (
                            <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center relative z-10">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-emerald-400">Resume Analyzed!</h3>
                                <p className="text-textMuted text-sm mb-4">Your skills have been extracted. Ready to start!</p>
                                <button onClick={() => { setUploadSuccess(false); setResumeData(null); }} className="text-textMuted hover:text-white text-xs underline transition-colors">
                                    Upload a different resume
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div key="upload" className="flex flex-col items-center w-full relative z-10">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
                                    <Upload className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Upload Resume</h3>
                                <p className="text-textMuted mb-6 text-sm max-w-xs">Upload your PDF resume so our AI can tailor interview questions to your exact experience.</p>
                                <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                {!file ? (
                                    <button onClick={() => fileInputRef.current?.click()} className="btn-primary flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Select PDF Resume
                                    </button>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 w-full">
                                        <div className="text-emerald-400 flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 text-sm">
                                            <FileText className="w-4 h-4" /> {file.name}
                                        </div>
                                        <button onClick={handleUpload} disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-2">
                                            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : 'Upload & Analyze'}
                                        </button>
                                        <button onClick={() => setFile(null)} className="text-xs text-textMuted hover:text-white transition-colors">Cancel</button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-400 mt-4 text-sm bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                        </motion.div>
                    )}
                </motion.div>

                {/* Resume Insights */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-panel p-6 flex flex-col min-h-[300px] relative overflow-hidden"
                >
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 blur-3xl rounded-full" />
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 relative z-10">
                        <Bot className="w-6 h-6 text-secondary" /> AI Resume Insights
                    </h3>
                    {resumeData ? (
                        <div className="flex-grow flex flex-col relative z-10">
                            <p className="text-textMuted text-sm mb-4">Skills detected from your resume:</p>
                            <div className="flex flex-wrap gap-2 mb-6 flex-grow max-h-44 overflow-y-auto pr-1">
                                {resumeData.detectedSkills.map((skill, i) => (
                                    <motion.span
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary font-medium"
                                    >
                                        {skill}
                                    </motion.span>
                                ))}
                            </div>
                            <button
                                onClick={handleStartInterview}
                                disabled={starting || credits <= 0}
                                className={`w-full font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-auto ${
                                    credits <= 0
                                        ? 'bg-gray-600/50 cursor-not-allowed text-gray-400 border border-white/10'
                                        : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg shadow-primary/30'
                                }`}
                            >
                                {starting ? <><Loader2 className="w-5 h-5 animate-spin" /> Preparing Interview...</>
                                    : credits <= 0 ? 'No Credits — Buy More'
                                    : <><Zap className="w-5 h-5" /> Start Mock Interview (1 Credit)</>
                                }
                            </button>
                            {credits > 0 && <p className="text-center text-xs text-textMuted mt-2">{credits} credit{credits !== 1 ? 's' : ''} remaining after this</p>}
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-textMuted border-2 border-dashed border-white/10 rounded-2xl gap-3 relative z-10">
                            <Bot className="w-14 h-14 opacity-10" />
                            <p className="text-center text-sm">Upload a resume to see<br />AI-detected skills here</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Growth Tracking Chart */}
            {history.length >= 2 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                    className="glass-panel p-6 mb-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 blur-3xl rounded-full" />
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                        <TrendingUp className="w-5 h-5 text-secondary" /> Performance Growth
                    </h3>
                    <div className="h-64 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#10B981' }}
                                />
                                <Area type="monotone" dataKey="score" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}

            {/* Interview History */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-panel p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <History className="w-5 h-5 text-secondary" /> Interview History
                    </h3>
                    {history.length > 0 && <span className="text-xs text-textMuted">{history.length} session{history.length !== 1 ? 's' : ''} completed</span>}
                </div>

                {loadingHistory ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : history.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {history.map((interview, index) => {
                            const score = parseFloat(interview.totalScore || 0);
                            const scoreColor = score >= 7 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                : score >= 4 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
                                : 'text-red-400 bg-red-500/10 border-red-500/30';
                            const label = score >= 7 ? 'Excellent' : score >= 4 ? 'Good' : 'Needs Work';
                            return (
                                <motion.div
                                    key={interview._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-primary/30 hover:bg-white/[0.06] transition-all duration-200 group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-1.5 text-xs text-textMuted">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(interview.interviewDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${scoreColor}`}>{label}</span>
                                    </div>
                                    <div className="text-3xl font-black mb-1" style={{ color: score >= 7 ? '#10B981' : score >= 4 ? '#FBBF24' : '#EF4444' }}>
                                        {interview.totalScore}<span className="text-sm text-textMuted font-normal">/10</span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-1.5 mb-4">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${(score / 10) * 100}%`,
                                                background: score >= 7 ? '#10B981' : score >= 4 ? '#FBBF24' : '#EF4444'
                                            }}
                                        />
                                    </div>
                                    <Link
                                        to={`/report/${interview._id}`}
                                        className="w-full flex items-center justify-center gap-2 text-sm py-2 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                                    >
                                        View Report <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl">
                        <History className="w-12 h-12 text-textMuted/30 mx-auto mb-3" />
                        <p className="text-textMuted font-medium">No interviews yet</p>
                        <p className="text-textMuted text-sm mt-1">Upload a resume above and start your first mock interview!</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Dashboard;
