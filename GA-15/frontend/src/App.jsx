import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Interview from './pages/Interview';
import Report from './pages/Report';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import PreInterviewSetup from './pages/PreInterviewSetup';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuthContext();
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );
    return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
    return (
        <Router>
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow flex flex-col pt-16">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                        <Route path="/interview/:id" element={<PrivateRoute><Interview /></PrivateRoute>} />
                        <Route path="/setup/:id" element={<PrivateRoute><PreInterviewSetup /></PrivateRoute>} />
                        <Route path="/report/:id" element={<PrivateRoute><Report /></PrivateRoute>} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <AppRoutes />
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;
