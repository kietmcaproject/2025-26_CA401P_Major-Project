import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight, Bot, Zap } from 'lucide-react';
import { API_BASE_URL, buildApiUrl } from '../lib/api';

const Login = () => {
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
            const res = await axios.post(buildApiUrl('/api/auth/login'), { email, password });
            login(res.data.token, res.data.user);
            navigate('/dashboard');
        } catch (err) {
            if (err.response) {
                setError(err.response.data.message || 'Login failed. Please try again.');
            } else if (err.request) {
                const target = API_BASE_URL || `${window.location.origin}/api`;
                setError(`Cannot reach server at ${target}. Make sure the backend is running.`);
            } else {
                setError('Login failed: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grow flex items-center justify-center px-4 py-16 relative overflow-hidden">
            {/* Background orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo Mark */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 mb-8"
                >
                    <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                        <Bot className="w-7 h-7 text-primary" />
                    </div>
                    <span className="text-xl font-bold">Prepvox</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="glass-panel p-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-3xl rounded-full" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 blur-3xl rounded-full" />

                    <div className="relative z-10">
                        <h2 className="text-3xl font-extrabold mb-1">Welcome back</h2>
                        <p className="text-textMuted mb-8">Sign in to continue your interview prep</p>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 border border-red-500/40 text-red-400 p-4 rounded-xl mb-6 text-sm"
                            >{error}</motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm text-textMuted mb-1.5 block">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                                    <input
                                        type="email"
                                        className="input-field pl-11"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-textMuted mb-1.5 block">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                                    <input
                                        type="password"
                                        className="input-field pl-11"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 font-semibold text-base mt-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>

                        <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-xl text-center">
                            <p className="text-xs text-textMuted">
                                <Zap className="inline w-3.5 h-3.5 text-primary mr-1" />
                                New users get <strong className="text-primary">3 free mock interviews</strong> on signup
                            </p>
                        </div>

                        <p className="mt-6 text-center text-textMuted text-sm">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary hover:text-primaryHover font-semibold transition-colors">
                                Create one free →
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
