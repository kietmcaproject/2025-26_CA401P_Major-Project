import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, TrendingUp, ArrowLeft, Loader2, Bot, Map, Star,
  CheckCircle, XCircle, AlertCircle, Brain, Lightbulb,
  BookOpen, ThumbsUp, ThumbsDown, Code2, Users, Briefcase,
  Zap, Award, ChevronDown, ChevronUp
} from 'lucide-react';
import { buildApiUrl } from '../lib/api';

// ── Score Ring ─────────────────────────────────────────────────────────────
const ScoreRing = ({ score, size = 144 }) => {
  const r = size * 0.36;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / 10, 1);
  const color = score >= 7 ? '#10B981' : score >= 4 ? '#FBBF24' : '#EF4444';
  const glow = `drop-shadow(0 0 14px ${color}70)`;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`} style={{ filter: glow }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 2, ease: 'easeOut', delay: 0.3 }} />
      </svg>
      <div className="text-center z-10">
        <motion.div className="font-black" style={{ color, fontSize: size * 0.28 }}
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: 'spring', damping: 10 }}>
          {score}
        </motion.div>
        <div className="text-textMuted text-xs font-medium">/ 10</div>
      </div>
    </div>
  );
};

// ── Mini Dimension Bar ─────────────────────────────────────────────────────
const DimBar = ({ label, score, color, delay = 0 }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-textMuted">{label}</span>
      <span className="font-bold" style={{ color }}>{score}/10</span>
    </div>
    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
      <motion.div className="h-full rounded-full" style={{ background: color }}
        initial={{ width: 0 }}
        whileInView={{ width: `${(score / 10) * 100}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: 'easeOut', delay }} />
    </div>
  </div>
);

// ── Score Bar ──────────────────────────────────────────────────────────────
const ScoreBar = ({ score, index }) => {
  const color = score >= 7 ? 'from-emerald-500 to-green-400' : score >= 4 ? 'from-yellow-500 to-amber-400' : 'from-red-500 to-rose-400';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-grow h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${(score / 10) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: index * 0.05 }} />
      </div>
      <span className="text-sm font-bold w-8 text-right">{score}</span>
    </div>
  );
};

const TABS = [
  { id: 'overview',  label: 'Overview',     icon: Target  },
  { id: 'coaching',  label: 'AI Coaching',  icon: Brain   },
  { id: 'feedback',  label: 'Q&A Feedback', icon: Bot     },
  { id: 'roadmap',   label: 'Roadmap',      icon: Map     },
];

const PERSONA_INFO = {
  Technical:  { icon: Code2,     color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30' },
  HR:         { icon: Users,     color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  Managerial: { icon: Briefcase, color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30' },
};

// ─────────────────────────────────────────────────────────────────────────────
const Report = () => {
  const { id } = useParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [activeTab, setActiveTab]   = useState('overview');
  const [expandedQ, setExpandedQ]   = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get(buildApiUrl(`/api/interview/report/${id}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReportData(res.data);
      } catch { setError('Failed to fetch report'); }
      finally { setLoading(false); }
    };
    fetchReport();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center h-[80vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-textMuted animate-pulse">Generating your coaching report...</p>
      </div>
    </div>
  );
  if (error || !reportData) return <div className="text-center text-red-500 mt-20">{error || 'Report not found'}</div>;

  const { interview, questions } = reportData;
  const score      = parseFloat(interview.totalScore || 0);
  const techScore  = parseFloat(interview.technicalScore || 0);
  const clarScore  = parseFloat(interview.clarityScore || 0);
  const psScore    = parseFloat(interview.problemSolvingScore || 0);
  const passed     = score >= 7;
  const scoreLabel = score >= 8 ? 'Excellent 🏆' : score >= 6 ? 'Good 👍' : score >= 4 ? 'Average 📈' : 'Needs Work 💪';
  const ScoreIcon  = score >= 7 ? CheckCircle : score >= 4 ? AlertCircle : XCircle;
  const scoreIconColor = score >= 7 ? 'text-emerald-400' : score >= 4 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg    = score >= 7 ? 'from-emerald-500/10 to-transparent border-emerald-500/20' : score >= 4 ? 'from-yellow-500/10 to-transparent border-yellow-500/20' : 'from-red-500/10 to-transparent border-red-500/20';
  const persona    = interview.persona || 'Technical';
  const pmeta      = PERSONA_INFO[persona] || PERSONA_INFO.Technical;
  const PIcon      = pmeta.icon;
  const hasCoaching = !!(interview.coachingReport || interview.strongPoints?.length || interview.improvementAreas?.length);

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8">
      {/* Back */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-textMuted hover:text-white transition-colors text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>
      </motion.div>

      {/* Header Score Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className={`glass-panel p-8 mb-6 bg-gradient-to-br ${scoreBg} relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/2 blur-3xl" />
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <ScoreRing score={score} />
          <div className="flex-grow text-center md:text-left">
            <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
              <span className={`text-xs px-3 py-1 rounded-full border font-semibold flex items-center gap-1.5 ${pmeta.bg} ${pmeta.color}`}>
                <PIcon className="w-3.5 h-3.5" /> {persona} Interview
              </span>
            </div>
            <p className="text-textMuted text-sm uppercase tracking-wider font-medium mb-1">Overall Performance</p>
            <h1 className="text-4xl font-extrabold mb-2">{scoreLabel}</h1>
            <p className="text-textMuted leading-relaxed max-w-lg">
              {questions.length} questions · {passed ? "Strong performance! Check the coaching tab for refinement tips." : "Stay consistent — your AI coaching plan is ready below."}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
              <ScoreIcon className={`w-5 h-5 ${scoreIconColor}`} />
              <span className={`font-semibold ${scoreIconColor}`}>{passed ? 'Interview Ready' : 'Keep Practicing'}</span>
            </div>
          </div>

          {/* Dimension scores summary */}
          <div className="flex-shrink-0 w-full md:w-52 space-y-3">
            <DimBar label="Technical Accuracy"  score={techScore} color="#6366F1" delay={0.2} />
            <DimBar label="Communication"        score={clarScore} color="#10B981" delay={0.3} />
            <DimBar label="Problem Solving"      score={psScore}   color="#F59E0B" delay={0.4} />
          </div>
        </div>
      </motion.div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 p-1.5 bg-black/30 rounded-2xl border border-white/10 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hasIndicator = tab.id === 'coaching' && hasCoaching;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0 relative ${
                isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-textMuted hover:text-white hover:bg-white/5'
              }`}>
              <Icon className="w-4 h-4" />
              {tab.label}
              {hasIndicator && !isActive && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-background" />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Overview Tab ─────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {/* Score Breakdown */}
            <div className="glass-panel p-6 mb-6">
              <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-secondary" /> Score Breakdown
              </h3>
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={q._id} className="flex items-center gap-3">
                    <span className="text-xs text-textMuted w-20 flex-shrink-0">
                      Q{i+1} {q.isFollowUp ? <span className="text-orange-400">↩</span> : ''} — <span className={q.score>=7?'text-emerald-400':q.score>=4?'text-yellow-400':'text-red-400'}>{q.score}/10</span>
                    </span>
                    <ScoreBar score={q.score} index={i} />
                  </div>
                ))}
              </div>
            </div>

            {/* Sentiment summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Confident', 'Neutral', 'Hesitant'].map(label => {
                const count = questions.filter(q => q.sentiment?.label === label).length;
                const color = label==='Confident'?'text-emerald-400':label==='Hesitant'?'text-red-400':'text-yellow-400';
                const bg = label==='Confident'?'bg-emerald-500/10 border-emerald-500/20':label==='Hesitant'?'bg-red-500/10 border-red-500/20':'bg-yellow-500/10 border-yellow-500/20';
                return (
                  <div key={label} className={`glass-panel p-5 text-center border ${bg}`}>
                    <p className={`text-3xl font-black ${color}`}>{count}</p>
                    <p className="text-xs text-textMuted mt-1">{label} answers</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Coaching Tab ──────────────────────────────────────────────── */}
        {activeTab === 'coaching' && (
          <motion.div key="coaching" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {/* Strong Points */}
            {interview.strongPoints?.length > 0 && (
              <div className="glass-panel p-6 border border-emerald-500/20">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-400">
                  <ThumbsUp className="w-5 h-5" /> Your Strong Points
                </h3>
                <div className="space-y-2.5">
                  {interview.strongPoints.map((point, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-textMain/90">{point}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Areas */}
            {interview.improvementAreas?.length > 0 && (
              <div className="glass-panel p-6 border border-red-500/20">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-400">
                  <ThumbsDown className="w-5 h-5" /> Areas to Improve
                </h3>
                <div className="space-y-2.5">
                  {interview.improvementAreas.map((area, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
                      <Lightbulb className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-textMain/90">{area}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Coaching Narrative */}
            {interview.coachingReport && (
              <div className="glass-panel p-6 border border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-3xl rounded-full" />
                <div className="relative z-10">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">
                    <Brain className="w-5 h-5" /> AI Coaching Narrative
                  </h3>
                  <p className="text-sm text-textMain/85 leading-relaxed whitespace-pre-wrap bg-black/20 p-5 rounded-xl border border-white/5">
                    {interview.coachingReport}
                  </p>
                </div>
              </div>
            )}

            {/* Suggested Resources */}
            {interview.suggestedResources?.length > 0 && (
              <div className="glass-panel p-6 border border-secondary/20">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-secondary">
                  <BookOpen className="w-5 h-5" /> Suggested Resources
                </h3>
                <div className="space-y-3">
                  {interview.suggestedResources.map((resource, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-3 p-4 bg-secondary/5 border border-secondary/15 rounded-xl">
                      <Award className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-textMain/90">{resource}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {!hasCoaching && (
              <div className="glass-panel p-10 text-center">
                <Brain className="w-12 h-12 text-textMuted/30 mx-auto mb-3" />
                <p className="text-textMuted">Coaching report is being generated... check back in a moment.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Q&A Feedback Tab ─────────────────────────────────────────── */}
        {activeTab === 'feedback' && (
          <motion.div key="feedback" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {questions.map((q, idx) => {
              const qColor = q.score >= 7 ? '#10B981' : q.score >= 4 ? '#FBBF24' : '#EF4444';
              const isOpen = expandedQ === idx;
              return (
                <motion.div key={q._id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: idx * 0.04 }}
                  className="glass-panel overflow-hidden" style={{ borderLeft: `3px solid ${qColor}` }}>
                  {/* Question header — clickable to expand */}
                  <button className="w-full p-5 flex items-start gap-4 text-left hover:bg-white/[0.02] transition-all"
                    onClick={() => setExpandedQ(isOpen ? null : idx)}>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1.5">
                        {q.isFollowUp && <span className="text-[10px] px-2 py-0.5 bg-orange-500/20 border border-orange-500/30 text-orange-300 rounded-full">↩ Follow-up</span>}
                        {q.isCodeChallenge && <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-full flex items-center gap-1"><Code2 className="w-2.5 h-2.5" />Code</span>}
                        {q.questionType && <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${q.questionType==='Behavioral'?'bg-purple-500/20 text-purple-300 border-purple-500/20':'bg-blue-500/20 text-blue-300 border-blue-500/20'}`}>{q.questionType}</span>}
                        <span className="text-xs text-textMuted">Q{idx+1}</span>
                      </div>
                      <h4 className="text-sm font-semibold leading-snug">{q.questionText}</h4>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xl font-black" style={{ color: qColor }}>{q.score}<span className="text-xs text-textMuted font-normal">/10</span></div>
                        <div className="flex mt-0.5 justify-end">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s<=Math.round(q.score/2)?'text-amber-400 fill-amber-400':'text-white/10 fill-white/10'}`} />)}
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-textMuted" /> : <ChevronDown className="w-4 h-4 text-textMuted" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }} className="overflow-hidden">
                        {/* Dimension scores */}
                        {(q.technicalScore > 0 || q.clarityScore > 0) && (
                          <div className="px-5 pb-3 pt-2 bg-black/10 border-y border-white/5">
                            <div className="grid grid-cols-3 gap-4">
                              <DimBar label="Technical" score={q.technicalScore||0} color="#6366F1" />
                              <DimBar label="Clarity"   score={q.clarityScore||0}   color="#10B981" />
                              <DimBar label="Problem Solving" score={q.problemSolvingScore||0} color="#F59E0B" />
                            </div>
                          </div>
                        )}

                        {/* Sentiment */}
                        {q.sentiment?.label && (
                          <div className="px-5 py-2 bg-black/10 border-b border-white/5 flex items-center gap-2 text-xs">
                            <Zap className="w-3.5 h-3.5 text-primary" />
                            <span className="text-textMuted">Tone detected:</span>
                            <span className={`font-semibold ${q.sentiment.label==='Confident'?'text-emerald-400':q.sentiment.label==='Hesitant'?'text-red-400':'text-yellow-400'}`}>{q.sentiment.label}</span>
                            <span className="text-textMuted ml-2">Confidence: {q.sentiment.confidence}%</span>
                          </div>
                        )}

                        {/* Answer */}
                        <div className="p-5 border-b border-white/5 bg-black/20">
                          <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Your Answer</p>
                          <p className="text-sm text-textMain/80 leading-relaxed whitespace-pre-wrap">{q.userAnswer || 'No answer provided'}</p>
                          {q.userCode && q.userCode.length > 5 && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Code2 className="w-3 h-3" />Your Code</p>
                              <pre className="text-xs bg-black/40 border border-white/10 rounded-xl p-4 overflow-x-auto font-mono text-textMain/80">{q.userCode}</pre>
                            </div>
                          )}
                        </div>

                        {/* AI Feedback */}
                        <div className="p-5 bg-primary/5">
                          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Bot className="w-3.5 h-3.5" /> AI Feedback
                          </p>
                          <p className="text-sm text-textMain/90 leading-relaxed whitespace-pre-wrap">{q.aiFeedback}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ── Roadmap Tab ───────────────────────────────────────────────── */}
        {activeTab === 'roadmap' && (
          <motion.div key="roadmap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {interview.improvementRoadmap ? (
              <div className="glass-panel p-8 border border-secondary/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-secondary/5 blur-3xl rounded-full" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 blur-3xl rounded-full" />
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-secondary">
                    <Map className="w-6 h-6" /> Personalized Improvement Roadmap
                  </h2>
                  <div className="text-textMain/90 leading-relaxed whitespace-pre-wrap text-sm bg-black/20 rounded-xl p-6 border border-white/5">
                    {interview.improvementRoadmap}
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-10 text-center">
                <Map className="w-12 h-12 text-textMuted/30 mx-auto mb-3" />
                <p className="text-textMuted">Roadmap is being generated...</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom CTA */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="mt-10 glass-panel p-8 text-center border border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-2">Ready for Another Round?</h3>
          <p className="text-textMuted mb-6 text-sm">Practice makes perfect — head back and start another interview.</p>
          <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
            Back to Dashboard <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Report;
