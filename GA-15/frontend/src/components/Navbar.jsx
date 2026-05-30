import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { LogOut, BrainCircuit, Coins, ShoppingCart, LayoutDashboard, User as UserIcon, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const { user, logout } = useAuthContext();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsMobileMenuOpen(false);
    };

    const navLink = (to, label, Icon) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 md:py-1.5 rounded-lg transition-all duration-200 ${
                    isActive
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-textMuted hover:text-white hover:bg-white/5'
                }`}
            >
                <Icon className="w-4 h-4 md:w-4 md:h-4" />
                {label}
            </Link>
        );
    };

    return (
        <nav className="fixed w-full z-50 top-0 bg-background/80 backdrop-blur-xl border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2.5 group">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            className="p-1.5 bg-primary/10 rounded-lg border border-primary/20 group-hover:bg-primary/20 transition-colors"
                        >
                            <BrainCircuit className="w-6 h-6 text-primary" />
                        </motion.div>
                        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            Prepvox
                        </span>
                    </Link>

                    {/* Desktop Right side */}
                    <div className="hidden md:flex items-center gap-2">
                        {user ? (
                            <>
                                {/* Credit Badge */}
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                                        user.credits <= 0
                                            ? 'bg-red-500/20 border-red-500/40 text-red-300'
                                            : user.credits <= 2
                                            ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                                            : 'bg-primary/20 border-primary/40 text-primary'
                                    }`}
                                >
                                    <Coins className="w-3.5 h-3.5" />
                                    {user.credits ?? 0} Credits
                                </motion.div>

                                <Link
                                    to="/pricing"
                                    className="flex items-center gap-1.5 text-sm text-textMuted hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5"
                                >
                                    <ShoppingCart className="w-4 h-4" /> Buy
                                </Link>

                                {navLink('/dashboard', 'Dashboard', LayoutDashboard)}
                                {navLink('/profile', 'Profile', UserIcon)}

                                {/* User Info + Logout */}
                                <div className="flex items-center gap-2 pl-2 border-l border-white/10 ml-1">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-white text-xs font-bold flex-shrink-0">
                                        {user.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-500/10"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm text-textMuted hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                                    Sign In
                                </Link>
                                <Link to="/register" className="btn-primary text-sm py-2 px-4">
                                    Get Started Free
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Hamburger Button */}
                    <div className="md:hidden flex items-center">
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-textMuted hover:text-white bg-white/5 rounded-lg"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-white/10 bg-background overflow-hidden"
                    >
                        <div className="px-4 py-4 flex flex-col gap-3">
                            {user ? (
                                <>
                                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white text-sm font-bold">
                                                {user.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{user.name}</p>
                                                <p className="text-xs text-textMuted">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                                            user.credits <= 0
                                                ? 'bg-red-500/20 border-red-500/40 text-red-300'
                                                : user.credits <= 2
                                                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                                                : 'bg-primary/20 border-primary/40 text-primary'
                                        }`}>
                                            <Coins className="w-3.5 h-3.5" />
                                            {user.credits ?? 0}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 py-2">
                                        {navLink('/dashboard', 'Dashboard', LayoutDashboard)}
                                        {navLink('/profile', 'Profile', UserIcon)}
                                        <Link
                                            to="/pricing"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 text-textMuted hover:text-white hover:bg-white/5"
                                        >
                                            <ShoppingCart className="w-4 h-4" /> Buy Credits
                                        </Link>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center justify-center gap-2 text-sm text-red-400 font-semibold bg-red-500/10 hover:bg-red-500/20 transition-colors w-full py-2.5 rounded-lg border border-red-500/20 mt-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col gap-3 py-2">
                                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-center text-sm font-medium text-textMuted hover:text-white transition-colors py-2 rounded-lg hover:bg-white/5">
                                        Sign In
                                    </Link>
                                    <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary text-sm py-3 text-center">
                                        Get Started Free
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
