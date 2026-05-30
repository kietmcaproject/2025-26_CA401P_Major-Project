import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, FileText, Target, Zap, Star, CheckCircle, ArrowRight, Brain, Mic, BarChart3, Shield, Users, TrendingUp } from 'lucide-react';

const AnimatedCounter = ({ end, suffix = '' }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = end / 60;
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 25);
        return () => clearInterval(timer);
    }, [end]);
    return <span>{count.toLocaleString()}{suffix}</span>;
};

const FeatureCard = ({ icon: Icon, title, desc, delay, gradient }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
        viewport={{ once: true }}
        whileHover={{ y: -6, scale: 1.02 }}
        className="glass-panel p-8 flex flex-col items-start text-left group hover:border-primary/40 transition-all duration-300 relative overflow-hidden"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${gradient}`} />
        <div className="p-3 bg-primary/10 rounded-2xl mb-5 group-hover:bg-primary/20 transition-colors border border-primary/20">
            <Icon className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-textMuted leading-relaxed">{desc}</p>
    </motion.div>
);

const StepCard = ({ step, title, desc, delay }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay }}
        viewport={{ once: true }}
        className="flex gap-6 items-start"
    >
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/30">
            {step}
        </div>
        <div>
            <h4 className="text-lg font-bold mb-1">{title}</h4>
            <p className="text-textMuted leading-relaxed">{desc}</p>
        </div>
    </motion.div>
);

const TestimonialCard = ({ name, role, text, score, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        viewport={{ once: true }}
        className="glass-panel p-6 flex flex-col gap-4 hover:border-primary/30 transition-colors"
    >
        <div className="flex gap-1">
            {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
        </div>
        <p className="text-textMuted italic leading-relaxed">"{text}"</p>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
            <div>
                <p className="font-semibold text-sm">{name}</p>
                <p className="text-textMuted text-xs">{role}</p>
            </div>
            <div className="bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-400 text-sm font-bold">
                Score: {score}/10
            </div>
        </div>
    </motion.div>
);

const Home = () => {
    return (
        <div className="flex-grow flex flex-col">
            {/* Hero Section */}
            <section className="relative flex flex-col items-center text-center px-4 py-28 overflow-hidden">
                {/* Background Orbs */}
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/25 blur-[120px] rounded-full pointer-events-none animate-pulse" />
                <div className="absolute top-40 right-1/4 w-80 h-80 bg-secondary/20 blur-[100px] rounded-full pointer-events-none" style={{ animationDelay: '1s', animation: 'pulse 4s ease-in-out infinite' }} />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-primary/10 blur-3xl pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-medium inline-flex items-center gap-2"
                >
                    <Zap className="w-4 h-4" /> Powered by Google Gemini AI
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="z-10 text-5xl md:text-7xl font-extrabold mb-6 leading-tight max-w-5xl"
                >
                    Ace Every Interview with{' '}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-secondary">
                        AI-Powered
                    </span>{' '}
                    Precision
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.25 }}
                    className="z-10 text-lg md:text-xl text-textMuted mb-10 max-w-2xl mx-auto leading-relaxed"
                >
                    Upload your resume, simulate realistic mock interviews tailored to your skills, 
                    and receive instant AI feedback with a personalized growth roadmap.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="z-10 flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link to="/register" className="btn-primary flex items-center justify-center gap-2 text-lg px-10 py-4 rounded-xl">
                        <Zap className="w-5 h-5" /> Start Free — 3 Interviews
                    </Link>
                    <Link to="/login" className="px-10 py-4 rounded-xl border border-white/20 hover:bg-white/5 hover:border-white/40 transition-all duration-300 text-lg flex items-center gap-2">
                        Sign In <ArrowRight className="w-5 h-5" />
                    </Link>
                </motion.div>

                {/* Stats Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.6 }}
                    className="z-10 mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-3xl"
                >
                    {[
                        { label: 'Mock Interviews Done', value: 12000, suffix: '+' },
                        { label: 'Avg Score Improvement', value: 43, suffix: '%' },
                        { label: 'Interview Questions', value: 500, suffix: '+' },
                        { label: 'Users Hired', value: 2800, suffix: '+' },
                    ].map(({ label, value, suffix }) => (
                        <div key={label} className="glass-panel p-5 text-center">
                            <div className="text-3xl font-black text-primary"><AnimatedCounter end={value} suffix={suffix} /></div>
                            <div className="text-textMuted text-sm mt-1">{label}</div>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-primary font-semibold uppercase tracking-widest text-sm"
                        >
                            Why Prepvox?
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-5xl font-bold mt-3 mb-4"
                        >
                            Everything You Need to Succeed
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-textMuted max-w-xl mx-auto text-lg"
                        >
                            Our AI system adapts to your exact resume, role, and experience level.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard icon={Brain} title="Resume-Tailored Questions" desc="Our AI reads your actual resume and crafts questions specifically for your skills, technologies, and projects — no generic Q&As." delay={0.05} gradient="bg-primary/20" />
                        <FeatureCard icon={Mic} title="Voice + Text Input" desc="Answer questions by typing or speaking using real-time voice recognition. Practice like it's the real thing." delay={0.1} gradient="bg-secondary/20" />
                        <FeatureCard icon={BarChart3} title="Instant AI Scoring" desc="Every answer is scored 0–10 with detailed feedback from Gemini. Know exactly where you stand after each response." delay={0.15} gradient="bg-purple-500/20" />
                        <FeatureCard icon={Target} title="Personalized Roadmap" desc="Get a custom improvement plan generated from your weakest answers — specific topics, resources, and steps to level up." delay={0.2} gradient="bg-primary/20" />
                        <FeatureCard icon={Shield} title="Interview History" desc="All your past mock interviews are stored securely. Review, compare, and track your improvement over time." delay={0.25} gradient="bg-secondary/20" />
                        <FeatureCard icon={Bot} title="Animated AI Avatar" desc="A live AI interviewer avatar reacts to your voice input — making practice feel like a real video interview." delay={0.3} gradient="bg-purple-400/20" />
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 px-4 bg-black/40 border-y border-white/5">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div>
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-secondary font-semibold uppercase tracking-widest text-sm"
                        >
                            Simple Process
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-4xl font-bold mt-3 mb-12"
                        >
                            From Resume to Report in Minutes
                        </motion.h2>
                        <div className="flex flex-col gap-10">
                            <StepCard step="1" title="Upload Your Resume" desc="Drag & drop your PDF. Our AI instantly extracts all your skills, technologies, and experience." delay={0.1} />
                            <StepCard step="2" title="Start the Mock Interview" desc="The AI generates 5–10 personalized questions. Use voice or text to answer at your own pace." delay={0.2} />
                            <StepCard step="3" title="Get Your Report" desc="Receive detailed per-question feedback, an overall score, and a custom learning roadmap." delay={0.3} />
                        </div>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="glass-panel p-8 border border-primary/20 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 blur-3xl" />
                        <div className="space-y-4 relative z-10">
                            {['React.js', 'Node.js', 'Python', 'Machine Learning', 'System Design', 'REST APIs'].map((skill, i) => (
                                <motion.div
                                    key={skill}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
                                >
                                    <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                                    <span className="font-medium">{skill}</span>
                                    <span className="ml-auto text-xs text-textMuted">Detected ✓</span>
                                </motion.div>
                            ))}
                        </div>
                        <div className="mt-6 p-4 bg-primary/10 rounded-xl border border-primary/20 relative z-10">
                            <p className="text-sm text-primary font-semibold">✨ 8 questions generated for your profile</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-4xl font-bold mb-3"
                        >
                            Loved by Job Seekers
                        </motion.h2>
                        <p className="text-textMuted text-lg">Real results from real candidates</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <TestimonialCard name="Priya S." role="Junior Developer → Google" text="I practiced 5 times before my Google interview. The AI feedback was incredibly specific. Got the offer!" score="9.2" delay={0.1} />
                        <TestimonialCard name="Rahul M." role="CS Grad → Startup CTO" text="The resume-tailored questions were spot on. It asked me about projects listed on my actual CV — exactly like the real interview!" score="8.7" delay={0.15} />
                        <TestimonialCard name="Aisha K." role="Career Switcher → Data Engineer" text="I was transitioning from finance. The AI detected my Python and SQL skills and focused right on them. Incredible tool." score="8.1" delay={0.2} />
                    </div>
                </div>
            </section>

            {/* CTA Banner */}
            <section className="py-20 px-4 mb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto glass-panel p-12 text-center border border-primary/30 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-primary/20 blur-3xl" />
                    <div className="relative z-10">
                        <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Ready to Land Your Dream Job?</h2>
                        <p className="text-textMuted text-lg mb-8 max-w-xl mx-auto">
                            Start with 3 free mock interviews. No credit card required.
                        </p>
                        <Link to="/register" className="btn-primary text-lg px-12 py-4 inline-flex items-center gap-2 rounded-xl">
                            Get Started Free <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-8 px-4 text-center text-textMuted text-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Bot className="w-5 h-5 text-primary" />
                    <span className="font-bold text-textMain">Prepvox</span>
                </div>
                <p>© {new Date().getFullYear()} Prepvox. Powered by Google Gemini. Built for candidates, by builders.</p>
            </footer>
        </div>
    );
};

export default Home;
