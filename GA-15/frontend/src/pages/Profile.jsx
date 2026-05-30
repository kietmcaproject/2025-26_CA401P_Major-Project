import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuthContext } from '../context/AuthContext';
import { buildApiUrl } from '../lib/api';
import { User, Briefcase, Code, Loader2, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

const Profile = () => {
    const { user, setUser } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: user?.name || '',
        role: user?.role || 'Software Engineer',
        skills: user?.skills?.join(', ') || '',
        experience: user?.experience || 'Fresher',
        bio: user?.bio || ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                role: user.role || 'Software Engineer',
                skills: user.skills?.join(', ') || '',
                experience: user.experience || 'Fresher',
                bio: user.bio || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');

        const token = localStorage.getItem('token');
        try {
            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
            const payload = { ...formData, skills: skillsArray };

            const res = await axios.put(buildApiUrl('/api/auth/profile'), payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUser({ ...user, ...res.data });
            setMessage('Profile updated successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Error updating profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

    return (
        <div className="max-w-4xl mx-auto w-full px-4 py-8">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center text-md-left">
                <h1 className="text-3xl font-bold flex items-center justify-center md:justify-start gap-3">
                    <User className="w-8 h-8 text-primary" /> Your Profile
                </h1>
                <p className="text-textMuted mt-2">Establish your complete profile and let employers know more about you.</p>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8"
            >
                {message && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-emerald-400 mb-6 bg-emerald-500/10 px-4 py-3 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> {message}
                    </motion.div>
                )}
                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-400 mb-6 bg-red-500/10 px-4 py-3 rounded-lg border border-red-500/20">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {error}
                    </motion.div>
                )}

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-textMuted mb-2 flex items-center gap-2">
                                <User className="w-4 h-4" /> Full Name
                            </label>
                            <input 
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-textMuted mb-2 flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Current Role / Title
                            </label>
                            <input 
                                type="text"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                placeholder="e.g. Frontend Developer"
                                className="input-field"
                            />
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-textMuted mb-2 flex items-center gap-2">
                                <Code className="w-4 h-4" /> Skills (comma separated)
                            </label>
                            <input 
                                type="text"
                                name="skills"
                                value={formData.skills}
                                onChange={handleChange}
                                placeholder="e.g. React, Node.js, Python, CSS"
                                className="input-field"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-textMuted mb-2 flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Experience Level
                            </label>
                            <select 
                                name="experience"
                                value={formData.experience}
                                onChange={handleChange}
                                className="input-field bg-dark"
                            >
                                <option value="Fresher">Fresher (0-1 yrs)</option>
                                <option value="Junior">Junior (1-3 yrs)</option>
                                <option value="Mid-Level">Mid-Level (3-5 yrs)</option>
                                <option value="Senior">Senior (5+ yrs)</option>
                                <option value="Expert">Expert (8+ yrs)</option>
                            </select>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-textMuted mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Bio / About Me
                            </label>
                            <textarea 
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Tell us a little bit about yourself, your career goals, etc."
                                className="input-field min-h-[120px] resize-y"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-white/10">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="btn-primary flex items-center gap-2 px-8 py-3"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Profile;
