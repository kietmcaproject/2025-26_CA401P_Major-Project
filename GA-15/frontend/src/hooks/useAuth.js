import { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../lib/api';

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await axios.get(buildApiUrl('/api/auth/me'), {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(res.data);
                } catch (err) {
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const refreshCredits = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await axios.get(buildApiUrl('/api/auth/credits'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(prev => prev ? { ...prev, credits: res.data.credits } : prev);
        } catch (err) {
            console.error('Failed to refresh credits');
        }
    };

    return { user, loading, login, logout, refreshCredits, setUser };
};

export default useAuth;
