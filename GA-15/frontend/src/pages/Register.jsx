import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, ArrowRight, Bot, CheckCircle } from 'lucide-react';
import { API_BASE_URL, buildApiUrl } from '../lib/api';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuthContext();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post(buildApiUrl('/api/auth/register'), { name, email, password });
            login(res.data.token, res.data.user);
            navigate('/dashboard');
        } catch (err) {
            if (err.response) {
                setError(err.response.data.message || 'Registration failed. Try again.');
            } else if (err.request) {
                const target = API_BASE_URL || `${window.location.origin}/api`;
                setError(`Cannot reach server at ${target}. Make sure the backend is running.`);
            } else {
                setError('Registration failed: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const perks = ['3 Free mock interviews', 'AI-scored answers', 'Personalized roadmap', 'Interview history storage'];

    return (
        <div className="grow flex items-center justify-center px-4 py-12 relative overflow-hidden">
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-secondary/15 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="w-full max-w-4xl relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Left — Benefits */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="hidden md:flex flex-col"
                >
                    <div className="flex items-center gap-2 mb-8">
                        <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                            <Bot className="w-7 h-7 text-primary" />
                        </div>
                        <span className="text-xl font-bold">Prepvox</span>
                    </div>
                    <h2 className="text-4xl font-extrabold mb-4 leading-tight">
                        Your AI Interview<br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            Coach is Ready
                        </span>
                    </h2>
                    <p className="text-textMuted mb-8 leading-relaxed">
                        Join thousands of candidates who've already improved their interview skills using AI-powered mock sessions.
                    </p>
                    <div className="space-y-3">
                        {perks.map((perk, i) => (
                            <motion.div
                                key={perk}
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="flex items-center gap-3"
                            >
                                <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                                <span className="text-textMuted">{perk}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Right — Form */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="glass-panel p-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-40 h-40 bg-secondary/10 blur-3xl rounded-full" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1 md:hidden">
                            <Bot className="w-6 h-6 text-primary" />
                            <span className="text-lg font-bold">Prepvox</span>
                        </div>
                        <h2 className="text-2xl font-extrabold mb-1">Create Free Account</h2>
                        <p className="text-textMuted mb-6 text-sm">Start crushing interviews today — no credit card needed</p>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 border border-red-500/40 text-red-400 p-4 rounded-xl mb-5 text-sm"
                            >{error}</motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm text-textMuted mb-1.5 block">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                                    <input type="text" className="input-field pl-11" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-textMuted mb-1.5 block">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                                    <input type="email" className="input-field pl-11" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-textMuted mb-1.5 block">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                                    <input type="password" className="input-field pl-11" placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-secondary flex items-center justify-center gap-2 py-3.5 font-semibold text-base mt-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>

                        <p className="mt-5 text-center text-textMuted text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-secondary hover:text-emerald-400 font-semibold transition-colors">
                                Sign in →
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Register;
