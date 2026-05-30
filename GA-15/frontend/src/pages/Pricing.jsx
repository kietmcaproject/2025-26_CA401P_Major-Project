import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Zap, Star, Crown, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl } from '../lib/api';
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

const packs = [
    {
        id: 'starter',
        name: 'Starter',
        icon: Zap,
        credits: 5,
        price: 99,
        priceLabel: '₹99',
        color: 'from-blue-500 to-cyan-500',
        border: 'border-blue-500/40',
        glow: 'shadow-blue-500/20',
        features: ['5 Mock Interviews', 'AI Question Generation', 'Detailed Feedback', 'Score Analysis'],
        popular: false,
    },
    {
        id: 'pro',
        name: 'Pro',
        icon: Star,
        credits: 15,
        price: 249,
        priceLabel: '₹249',
        color: 'from-primary to-purple-500',
        border: 'border-primary/50',
        glow: 'shadow-primary/30',
        features: ['15 Mock Interviews', 'AI Question Generation', 'Detailed Feedback', 'Score Analysis', 'Improvement Roadmap', 'Priority Support'],
        popular: true,
    },
    {
        id: 'elite',
        name: 'Elite',
        icon: Crown,
        credits: 30,
        price: 449,
        priceLabel: '₹449',
        color: 'from-amber-500 to-orange-500',
        border: 'border-amber-500/40',
        glow: 'shadow-amber-500/20',
        features: ['30 Mock Interviews', 'AI Question Generation', 'Detailed Feedback', 'Score Analysis', 'Improvement Roadmap', 'Priority Support', 'Best Value'],
        popular: false,
    },
];

const Pricing = () => {
    const { user, refreshCredits } = useAuthContext();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [processingPack, setProcessingPack] = useState(null);
    const [success, setSuccess] = useState('');

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleBuy = async (pack) => {
        if (!user) {
            navigate('/login');
            return;
        }

        setProcessingPack(pack.id);
        const token = localStorage.getItem('token');

        try {
            // Ensure Razorpay SDK is loaded
            const sdkLoaded = await loadRazorpayScript();
            if (!sdkLoaded || !window.Razorpay) {
                addToast('Failed to load payment gateway. Please check your internet connection and try again.', 'error');
                setProcessingPack(null);
                return;
            }

            // Create Razorpay order
            const orderRes = await axios.post(
                buildApiUrl('/api/payment/create-order'),
                { pack: pack.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { orderId, amount, currency } = orderRes.data;

            const options = {
                key: RAZORPAY_KEY_ID,
                amount,
                currency,
                name: 'Prepvox',
                description: `${pack.name} Pack - ${pack.credits} Credits`,
                order_id: orderId,
                handler: async (response) => {
                    try {
                        const verifyRes = await axios.post(
                            buildApiUrl('/api/payment/verify'),
                            {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                pack: pack.id,
                            },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        await refreshCredits();
                        setSuccess(`🎉 ${verifyRes.data.message} You now have ${verifyRes.data.credits} credits.`);
                    } catch {
                        addToast('Payment was received but verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id, 'error');
                    } finally {
                        setProcessingPack(null);
                    }
                },
                prefill: { email: user.email, name: user.name },
                theme: { color: '#6366f1' },
                modal: { ondismiss: () => setProcessingPack(null) },
                // ✅ Enable all UPI flows: UPI ID (VPA), QR Code, and Intent (app-based)
                config: {
                    display: {
                        blocks: {
                            upi_block: {
                                name: 'Pay via UPI',
                                instruments: [
                                    { method: 'upi', flows: ['vpa', 'qr', 'intent'] }
                                ]
                            }
                        },
                        preferences: {
                            show_default_blocks: true
                        }
                    }
                }
            };

            const razorpayInstance = new window.Razorpay(options);

            // Handle payment failures with clear message
            razorpayInstance.on('payment.failed', (response) => {
                console.error('Payment failed:', response.error);
                addToast(`Payment failed: ${response.error.description || 'Unknown error'}.`, 'error');
                setProcessingPack(null);
            });

            razorpayInstance.open();
        } catch (err) {
            console.error('Payment error:', err);
            addToast(err.response?.data?.message || 'Failed to initiate payment. Make sure the backend server is running.', 'error');
            setProcessingPack(null);
        }
    };


    return (
        <div className="max-w-6xl mx-auto w-full px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
            >
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 px-4 py-1.5 rounded-full text-primary text-sm font-medium mb-6">
                    <Coins className="w-4 h-4" /> Credit Packs
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                    Power Up Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Interview Prep</span>
                </h1>
                <p className="text-textMuted text-lg max-w-xl mx-auto">
                    Each credit unlocks one full AI-powered mock interview session with detailed feedback and scoring.
                </p>
                {user && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-sm"
                    >
                        <Coins className="w-4 h-4 text-primary" />
                        Current balance: <span className="font-bold text-primary">{user.credits ?? 0} credits</span>
                    </motion.div>
                )}
            </motion.div>

            {success && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-center font-medium"
                >
                    {success}
                </motion.div>
            )}

            {/* Test Mode Notice — remove before going live */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm"
            >
                <p className="font-bold mb-2">⚠️ Test Mode — Use these test card details:</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
                    <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-amber-300 mb-1 font-semibold">Card Number</p>
                        <p>4111 1111 1111 1111</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-amber-300 mb-1 font-semibold">Expiry</p>
                        <p>Any future date (e.g. 12/26)</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-amber-300 mb-1 font-semibold">CVV</p>
                        <p>Any 3 digits (e.g. 123)</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-amber-300 mb-1 font-semibold">OTP</p>
                        <p>Enter <strong>1234</strong> when prompted</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-amber-300 mb-1 font-semibold">UPI ID</p>
                        <p>success@razorpay</p>
                    </div>
                </div>
            </motion.div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {packs.map((pack, idx) => {
                    const Icon = pack.icon;
                    const isProcessing = processingPack === pack.id;
                    return (
                        <motion.div
                            key={pack.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ y: -6, scale: 1.02 }}
                            className={`relative glass-panel p-8 flex flex-col border ${pack.border} shadow-xl ${pack.glow} ${pack.popular ? 'ring-2 ring-primary/50' : ''}`}
                        >
                            {pack.popular && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full tracking-wide">
                                    MOST POPULAR
                                </div>
                            )}

                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pack.color} flex items-center justify-center mb-6 shadow-lg`}>
                                <Icon className="w-7 h-7 text-white" />
                            </div>

                            <h3 className="text-2xl font-bold mb-1">{pack.name}</h3>
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-4xl font-black">{pack.priceLabel}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-6">
                                <span className={`text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r ${pack.color}`}>
                                    {pack.credits} Credits
                                </span>
                                <span className="text-textMuted text-sm">= {pack.credits} interviews</span>
                            </div>

                            <ul className="space-y-3 mb-8 flex-grow">
                                {pack.features.map((f) => (
                                    <li key={f} className="flex items-center gap-2 text-sm text-textMuted">
                                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleBuy(pack)}
                                disabled={isProcessing}
                                className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r ${pack.color} hover:opacity-90 active:scale-95 shadow-lg disabled:opacity-60`}
                            >
                                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : `Buy ${pack.name} Pack`}
                            </button>
                        </motion.div>
                    );
                })}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 flex flex-col items-center gap-3 text-textMuted text-sm"
            >
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Secured by Razorpay — 100% safe & encrypted payments</span>
                </div>
                <p>Credits never expire. Use them at your own pace.</p>
            </motion.div>
        </div>
    );
};

export default Pricing;
