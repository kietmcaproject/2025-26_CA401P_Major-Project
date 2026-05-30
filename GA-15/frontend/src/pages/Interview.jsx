import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Send, AlertCircle, Loader2, ChevronRight,
  Camera, CameraOff, Video, VideoOff, Lightbulb, StickyNote,
  X, Maximize2, Minimize2, Zap, Eye, Clock, Code2, MessageSquare,
  TrendingUp, Brain, RefreshCcw, Users, Briefcase
} from 'lucide-react';
import { buildApiUrl } from '../lib/api';
import aiAvatar from '../assets/ai-avatar.png';

// ── Constants ─────────────────────────────────────────────────────────────
const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually', 'right'];
const CONFIDENCE_WORDS = ['implemented', 'built', 'led', 'designed', 'achieved', 'optimized', 'successfully', 'expertly'];
const HESITATION_WORDS = ['maybe', 'perhaps', 'not sure', 'i think', 'i guess', 'kind of', 'sort of', 'possibly'];

const PERSONA_META = {
  Technical:  { icon: Code2,     label: 'Technical',    color: 'text-blue-400',   border: 'border-blue-500/30',   bg: 'bg-blue-500/10' },
  HR:         { icon: Users,     label: 'HR',           color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  Managerial: { icon: Briefcase, label: 'Managerial',   color: 'text-amber-400',  border: 'border-amber-500/30',  bg: 'bg-amber-500/10' },
};

const QUESTION_TIPS = {
  Technical:  ['Mention specific tools & frameworks', 'Walk through your thought process step-by-step', 'Use concrete examples from your work'],
  Behavioral: ['Use STAR: Situation, Task, Action, Result', 'Be specific — avoid vague generalities', 'Quantify impact where possible'],
};

// ── Helpers ────────────────────────────────────────────────────────────────
const getWordCount = t => t.trim().split(/\s+/).filter(Boolean).length;
const getQuality  = wc => wc >= 120 ? { label:'Excellent', color:'#10B981', pct:100 }
  : wc >= 70  ? { label:'Good',      color:'#FBBF24', pct:70  }
  : wc >= 30  ? { label:'Fair',      color:'#F97316', pct:40  }
  : { label:'Too Short', color:'#EF4444', pct:15 };
const analyzeText = text => {
  const lower = text.toLowerCase();
  const fillers  = FILLER_WORDS.filter(w => lower.includes(w));
  const confWords= CONFIDENCE_WORDS.filter(w => lower.includes(w));
  const hesWords = HESITATION_WORDS.filter(w => lower.includes(w));
  const conf = Math.min(100, Math.max(0, 40 + confWords.length*8 - hesWords.length*10 + Math.min(30, getWordCount(text)/5)));
  return { fillers, confidence: Math.round(conf), label: conf>=65?'Confident':conf<35?'Uncertain':'Neutral' };
};

const WaveBars = ({ active, color='#6366F1', count=10 }) => (
  <div className="flex items-end gap-0.5 h-5">
    {Array.from({length:count}).map((_,i) => {
      const h = [3,6,5,8,6,4,7,5,4,6][i%10];
      return (
        <motion.div key={i} className="w-0.5 rounded-full" style={{background:color}}
          animate={active ? {height:[`${h}px`,`${h*2.2}px`,`${h}px`]} : {height:'3px'}}
          transition={{duration:0.7, repeat:active?Infinity:0, delay:i*0.07, ease:'easeInOut'}} />
      );
    })}
  </div>
);

const SentimentBadge = ({ label }) => {
  const map = { Confident:{bg:'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',dot:'bg-emerald-400'}, Uncertain:{bg:'bg-red-500/20 border-red-500/30 text-red-300',dot:'bg-red-400'}, Neutral:{bg:'bg-white/10 border-white/20 text-textMuted',dot:'bg-white/40'} };
  const s = map[label] || map.Neutral;
  return <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border font-semibold ${s.bg}`}><span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{label}</span>;
};

// ─────────────────────────────────────────────────────────────────────────────
const Interview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const persona = location.state?.persona || 'Technical';

  // Core
  const [questions, setQuestions]       = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer]             = useState('');
  const [userCode, setUserCode]         = useState('// Write your solution here\n');
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');
  const [timeLeft, setTimeLeft]         = useState(120);
  const [isListening, setIsListening]   = useState(false);
  const [isCompleted, setIsCompleted]   = useState(false);
  const [tab, setTab]                   = useState('text'); // text | code
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);

  // Memory panel
  const [memory, setMemory]             = useState([]); // [{q, summary}]

  // Webcam
  const [camEnabled, setCamEnabled]     = useState(false);
  const [camError, setCamError]         = useState('');
  const [camStream, setCamStream]       = useState(null);
  const [camLoading, setCamLoading]     = useState(false);
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);
  const [expressions, setExpressions]   = useState(null);
  const trackingIntervalRef             = useRef(null);

  // Advanced
  const [hint, setHint]                 = useState('');
  const [hintLoading, setHintLoading]   = useState(false);
  const [showHint, setShowHint]         = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [notes, setNotes]               = useState('');
  const [fullscreen, setFullscreen]     = useState(false);
  const [codeOutput, setCodeOutput]     = useState('');
  const [isExecuting, setIsExecuting]   = useState(false);

  const recognitionRef = useRef(null);
  const webcamRef      = useRef(null);
  const streamRef      = useRef(null);
  const containerRef   = useRef(null);
  const timerRef       = useRef(null);
  const avatarVideoRef = useRef(null);
  const handleNextRef  = useRef(null);

  const personaMeta = PERSONA_META[persona] || PERSONA_META.Technical;
  const PersonaIcon = personaMeta.icon;

  // ── Derived ───────────────────────────────────────────────────────────────
  const timerPct    = (timeLeft / 120) * 100;
  const timerColor  = timeLeft > 60 ? '#10B981' : timeLeft > 30 ? '#FBBF24' : '#EF4444';
  const wordCount   = getWordCount(tab === 'code' ? userCode : answer);
  const quality     = getQuality(wordCount);
  const textAnalysis= analyzeText(answer);
  const progress    = (currentIndex / questions.length) * 100;
  const currentQ    = questions[currentIndex];
  const qTips       = QUESTION_TIPS[currentQ?.questionType] || QUESTION_TIPS.Technical;

  // ── Avatar Logic ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (questions.length > 0 && currentQ && !isCompleted && !loading) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(currentQ.questionText);
        msg.rate = 0.95;
        msg.pitch = 1.0;
        
        msg.onstart = () => setIsAvatarSpeaking(true);
        msg.onend = () => setIsAvatarSpeaking(false);
        msg.onerror = () => setIsAvatarSpeaking(false);
        
        setTimeout(() => window.speechSynthesis.speak(msg), 400);
      }
    }
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [currentIndex, currentQ, questions.length, isCompleted, loading]);

  useEffect(() => {
    if (avatarVideoRef.current) {
      if (isAvatarSpeaking) {
        avatarVideoRef.current.play().catch(()=>{});
      } else {
        avatarVideoRef.current.pause();
      }
    }
  }, [isAvatarSpeaking]);

  // ── Fetch questions ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get(buildApiUrl(`/api/interview/questions/${id}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuestions(res.data);
      } catch { setError('Failed to fetch questions'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && questions.length > 0 && !isCompleted) {
      setTimeLeft(120);
      setShowHint(false); setHint('');
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => { 
          if (prev <= 1) { 
            clearInterval(timerRef.current); 
            if (handleNextRef.current) handleNextRef.current(); 
            return 0; 
          } 
          return prev - 1; 
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [currentIndex, loading, questions, isCompleted]);

  // ── Speech recognition ───────────────────────────────────────────────────
  useEffect(() => {
    let sr = null;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      sr = new SR();
      recognitionRef.current = sr;
      sr.continuous = true;
      sr.interimResults = true;
      sr.onresult = e => {
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; ++i)
          if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        setAnswer(prev => prev + final);
      };
      sr.onerror = () => setIsListening(false);
    }
    return () => { 
      if (sr) {
        sr.stop();
        sr.onresult = null;
        sr.onerror = null;
      }
    };
  }, []);

  useEffect(() => { if (webcamRef.current && camStream) webcamRef.current.srcObject = camStream; }, [camStream]);
  useEffect(() => () => { stopWebcam(); recognitionRef.current?.stop(); }, []);

  // Auto-set tab to code if it's a code challenge
  useEffect(() => {
    const q = questions[currentIndex];
    if (q?.isCodeChallenge) setTab('code');
    else setTab('text');
  }, [currentIndex, questions]);

  // ── Camera & Face API ────────────────────────────────────────────────────
  const loadFaceModels = async () => {
    if (faceModelsLoaded) return;
    try {
      const url = 'https://vladmandic.github.io/face-api/model/';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(url),
        faceapi.nets.faceExpressionNet.loadFromUri(url)
      ]);
      setFaceModelsLoaded(true);
    } catch (err) {
      console.error('Error loading face-api models', err);
    }
  };

  const startWebcam = async () => {
    setCamLoading(true); setCamError('');
    try {
      await loadFaceModels();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      setCamStream(stream); setCamEnabled(true);
    } catch (err) {
      setCamError(err.name === 'NotAllowedError' ? 'Camera denied. Allow it in browser settings.' : 'Camera error: ' + err.message);
    } finally { setCamLoading(false); }
  };

  const stopWebcam = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null; setCamStream(null); setCamEnabled(false);
    if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
    }
    setExpressions(null);
  }, []);

  const toggleWebcam = () => camEnabled ? stopWebcam() : startWebcam();
  
  // ── Face Tracking Loop ───────────────────────────────────────────────────
  useEffect(() => {
    if (camEnabled && faceModelsLoaded && webcamRef.current) {
      trackingIntervalRef.current = setInterval(async () => {
        if (!webcamRef.current) return;
        const detections = await faceapi.detectSingleFace(
          webcamRef.current, 
          new faceapi.TinyFaceDetectorOptions({ inputSize: 160 })
        ).withFaceExpressions();
        if (detections && detections.expressions) {
          const exps = Object.entries(detections.expressions);
          const topExp = exps.reduce((a, b) => a[1] > b[1] ? a : b);
          setExpressions(topExp); // [expressionName, probability]
        }
      }, 800);
    }
    return () => clearInterval(trackingIntervalRef.current);
  }, [camEnabled, faceModelsLoaded]);

  const toggleListening = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    else { recognitionRef.current?.start(); setIsListening(true); }
  };

  // ── AI Hint ──────────────────────────────────────────────────────────────
  const fetchHint = useCallback(async () => {
    if (hint) { setShowHint(true); return; }
    setHintLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(buildApiUrl(`/api/interview/hint/${questions[currentIndex]._id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHint(res.data.hint); setShowHint(true);
    } catch { setHint('Structure your answer with a clear intro, examples, and conclusion.'); setShowHint(true); }
    finally { setHintLoading(false); }
  }, [hint, questions, currentIndex]);

  // ── Adaptive "Panic" Detection ──────────────────────────────────────────
  useEffect(() => {
    if (tab === 'text' && isListening && answer.length > 30) {
      const lower = answer.toLowerCase();
      const panicWords = ['i don\'t know', "i'm not sure", 'i forget', "i'm stuck", 'can you help'];
      const hasPanic = panicWords.some(w => lower.includes(w));
      const stats = analyzeText(answer);
      
      if ((hasPanic || stats.fillers.length > 6) && !showHint && !hintLoading) {
        fetchHint();
      }
    }
  }, [answer, isListening, showHint, hintLoading, tab, fetchHint]);

  // ── Adaptive Follow-up ────────────────────────────────────────────────────
  const requestFollowUp = async () => {
    if (!answer.trim() || answer.length < 20) { setError('Please provide a more detailed answer before requesting a follow-up.'); return; }
    setFollowUpLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(buildApiUrl('/api/interview/followup'), {
        questionId: questions[currentIndex]._id,
        answer
      }, { headers: { Authorization: `Bearer ${token}` } });

      // Insert follow-up right after current question
      const newQ = res.data;
      setQuestions(prev => {
        const next = [...prev];
        next.splice(currentIndex + 1, 0, newQ);
        return next;
      });
    } catch { setError('Could not generate follow-up question.'); }
    finally { setFollowUpLoading(false); }
  };

  // ── Code Execution (Piston API) ─────────────────────────────────────────
  const handleRunCode = async () => {
    setIsExecuting(true);
    setCodeOutput('Running...\n');
    let language = currentQ?.codeLanguage || 'javascript';
    if (language === 'nodejs') language = 'javascript'; // Fix language mapping if needed
    
    try {
      const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
        language: language,
        version: '*',
        files: [{ content: userCode }]
      });
      setCodeOutput(response.data.run.output || 'No output.');
    } catch (err) {
      setCodeOutput('Error executing code: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsExecuting(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleNext = useCallback(async () => {
    if (isListening) toggleListening();
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    const token = localStorage.getItem('token');
    const finalAnswer = tab === 'code' ? `[Code Submission]\n${userCode}` : answer;
    try {
      const res = await axios.post(buildApiUrl('/api/interview/answer'), {
        questionId: questions[currentIndex]._id,
        answer: finalAnswer || 'No answer provided',
        userCode: tab === 'code' ? userCode : ''
      }, { headers: { Authorization: `Bearer ${token}` } });

      const evaluation = res.data.evaluation || {};
      
      // Add to local memory
      setMemory(prev => [...prev, { 
        q: questions[currentIndex].questionText.substring(0, 60) + '…', 
        summary: finalAnswer.substring(0, 80) + '…',
        scores: [evaluation.technicalScore || 0, evaluation.clarityScore || 0, evaluation.problemSolvingScore || 0]
      }]);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setAnswer(''); setUserCode('// Write your solution here\n');
        setShowHint(false); setHint('');
      } else {
        stopWebcam(); setIsCompleted(true);
      }
    } catch { setError('Failed to submit. Please try again.'); }
    finally { setSubmitting(false); }
  }, [isListening, answer, userCode, tab, questions, currentIndex, stopWebcam]);

  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen().then(() => setFullscreen(true)).catch(()=>{});
    else document.exitFullscreen().then(() => setFullscreen(false)).catch(()=>{});
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[80vh] gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
      <p className="text-textMuted animate-pulse">Loading your interview...</p>
    </div>
  );

  if (isCompleted) return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="glass-panel p-12 text-center max-w-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
        <div className="relative z-10">
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',damping:10}}
            className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
            <span className="text-4xl">🎉</span>
          </motion.div>
          <h2 className="text-3xl font-extrabold mb-3 text-emerald-400">Interview Complete!</h2>
          <p className="text-textMuted mb-8 leading-relaxed">
            Outstanding! You answered all {questions.length} questions. Your AI coaching report is being generated.
          </p>
          <button onClick={() => navigate(`/report/${id}`)} className="btn-primary w-full text-lg py-3.5 flex items-center justify-center gap-2">
            View Full Report & Coaching <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  if (!loading && questions.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="glass-panel p-10 text-center max-w-lg">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-3">No Questions Found</h2>
        <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">Return to Dashboard</button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="max-w-7xl mx-auto w-full px-4 py-4 relative">
      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/20 text-red-300 p-3 rounded-xl mb-3 border border-red-500/20 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-textMuted mb-1.5">
          <div className="flex items-center gap-2">
            <PersonaIcon className={`w-3.5 h-3.5 ${personaMeta.color}`} />
            <span className={`font-semibold ${personaMeta.color}`}>{personaMeta.label} Interview</span>
            <span className="text-white/30">•</span>
            <span>Q{currentIndex+1} of {questions.length}</span>
            {currentQ?.isFollowUp && <span className="px-2 py-0.5 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-300 text-[10px] font-semibold">↩ Follow-up</span>}
          </div>
          <span>{Math.round(progress)}% done</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
            animate={{width:`${progress}%`}} transition={{duration:0.5}} />
        </div>
      </div>

      {/* ── 3-Column Layout: L=sidebar, M=main-interview, R=analyzer ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-4">

        {/* ── LEFT: Contextual Memory + Tips ─────────────────────────── */}
        <div className="hidden lg:flex flex-col gap-4">
          {/* Contextual Memory */}
          <div className="glass-panel p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted mb-3 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-primary" /> Contextual Memory
            </h3>
            {memory.length === 0 ? (
              <p className="text-xs text-textMuted/50 italic">AI will reference your answers once you start answering questions...</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {memory.map((m, i) => (
                  <div key={i} className="p-2.5 bg-white/[0.03] border border-white/10 rounded-xl">
                    <p className="text-[10px] font-semibold text-primary mb-1">Q{i+1}: {m.q}</p>
                    <p className="text-[10px] text-textMuted leading-relaxed">{m.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Type Tips */}
          <div className="glass-panel p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted mb-3 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> {currentQ?.questionType || 'Technical'} Tips
            </h3>
            <ul className="space-y-2">
              {qTips.map((tip, i) => (
                <motion.li key={i} initial={{opacity:0, x:-8}} animate={{opacity:1, x:0}} transition={{delay:i*0.1}}
                  className="text-xs text-textMuted flex items-start gap-1.5">
                  <span className="text-primary mt-0.5 flex-shrink-0">→</span>{tip}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Notes */}
          <div className="glass-panel p-4 flex-grow">
            <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted mb-2 flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5 text-secondary" /> My Notes
            </h3>
            <textarea className="w-full bg-transparent border-none outline-none text-textMain text-xs leading-relaxed placeholder-textMuted/40 resize-none"
              rows={6} placeholder="Jot down key points..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        {/* ── MIDDLE: Video + Question + Answer ──────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Video Panel */}
          <div className="glass-panel p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              {/* Controls bar */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-semibold text-textMuted uppercase tracking-widest">Live Session</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Timer */}
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-black/30 border border-white/10">
                    <div className="relative w-6 h-6">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
                        <motion.circle cx="12" cy="12" r="9" fill="none" stroke={timerColor} strokeWidth="2.5"
                          strokeLinecap="round" strokeDasharray={2*Math.PI*9}
                          animate={{strokeDashoffset: 2*Math.PI*9*(1-timerPct/100)}} transition={{duration:1}} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Clock className="w-2.5 h-2.5" style={{color:timerColor}} />
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold" style={{color:timerColor}}>
                      {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}
                    </span>
                  </div>
                  {/* Camera */}
                  <button onClick={toggleWebcam} disabled={camLoading}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      camEnabled ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/10 border-white/20 text-textMuted hover:text-primary'
                    }`}>
                    {camLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : camEnabled ? <><Video className="w-3.5 h-3.5" />On</> : <><VideoOff className="w-3.5 h-3.5"/>Cam</>}
                  </button>
                  {/* Fullscreen */}
                  <button onClick={toggleFullscreen} className="p-1.5 rounded-full bg-white/10 border border-white/20 text-textMuted hover:text-white transition-all">
                    {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Video grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* AI */}
                <div className="relative rounded-xl overflow-hidden bg-black/40 border border-white/10" style={{aspectRatio:'4/3'}}>
                  <video 
                    ref={avatarVideoRef}
                    loop 
                    muted 
                    playsInline 
                    poster={aiAvatar}
                    className="w-full h-full object-cover"
                    style={{ filter: isListening ? 'brightness(0.5)' : 'brightness(1)' }}
                  >
                    <source src="https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-a-video-call-43187-large.mp4" type="video/mp4" />
                  </video>
                  <motion.div className="absolute inset-0"
                    animate={{boxShadow: isListening ? 'inset 0 0 30px rgba(99,102,241,0.4)' : 'inset 0 0 0 rgba(0,0,0,0)'}}
                    transition={{duration:0.4}} />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="text-xs bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-lg font-semibold text-white">🤖 AI</span>
                    {!isListening && <WaveBars active={true} color="#6366F1" count={8} />}
                  </div>
                </div>
                {/* User */}
                <div className="relative rounded-xl overflow-hidden bg-black/60 border border-white/10" style={{aspectRatio:'4/3'}}>
                  {camEnabled ? (
                    <>
                      <video ref={webcamRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{transform:'scaleX(-1)'}} />
                      {isListening && <motion.div className="absolute inset-0 rounded-xl border-2 border-primary"
                        animate={{opacity:[0.4,1,0.4]}} transition={{duration:1,repeat:Infinity}} />}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span className="text-xs bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-lg font-semibold text-white flex items-center gap-1"><Camera className="w-3 h-3 text-secondary" />You</span>
                        {isListening && <WaveBars active={true} color="#EF4444" count={8} />}
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <CameraOff className="w-8 h-8 text-textMuted/30" />
                      <p className="text-xs text-textMuted">Camera off</p>
                      {camError && <p className="text-[10px] text-red-400 text-center px-2">{camError}</p>}
                      <button onClick={startWebcam} disabled={camLoading}
                        className="text-xs px-2.5 py-1 bg-primary/20 border border-primary/30 text-primary rounded-lg hover:bg-primary/30 transition-all">
                        Enable
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Question + Hint */}
          <AnimatePresence mode="wait">
            <motion.div key={currentIndex} initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
              className="glass-panel p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-24 h-24 bg-primary/10 blur-3xl rounded-full" />
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold text-textMuted uppercase tracking-widest">Q{currentIndex+1}</p>
                    {currentQ?.isCodeChallenge && <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-full font-semibold flex items-center gap-1"><Code2 className="w-2.5 h-2.5" />Code Challenge</span>}
                    {currentQ?.questionType && <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${currentQ.questionType==='Behavioral'?'bg-purple-500/20 text-purple-300 border-purple-500/30':'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>{currentQ.questionType}</span>}
                  </div>
                  <h2 className="text-lg font-bold leading-relaxed">{currentQ?.questionText}</h2>
                </div>
                <button onClick={fetchHint} disabled={hintLoading}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    showHint ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-white/10 border-white/20 text-textMuted hover:text-amber-300 hover:border-amber-500/30'
                  }`}>
                  {hintLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
                  Hint
                </button>
              </div>

              {/* Hint */}
              <AnimatePresence>
                {showHint && hint && (
                  <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                    className="mt-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl relative z-10">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-grow">
                        <p className="text-xs font-bold text-amber-400 mb-1">💡 AI Coaching Hint</p>
                        <p className="text-sm text-amber-100/80 leading-relaxed">{hint}</p>
                      </div>
                      <button onClick={() => setShowHint(false)} className="text-amber-400/50 hover:text-amber-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          {/* Answer Area — Text or Code */}
          <div className="glass-panel overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-white/10">
              <button onClick={() => setTab('text')}
                className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold transition-all ${tab==='text'?'text-white border-b-2 border-primary bg-primary/10':'text-textMuted hover:text-white'}`}>
                <MessageSquare className="w-3.5 h-3.5" /> Text Answer
              </button>
              <button onClick={() => setTab('code')}
                className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold transition-all ${tab==='code'?'text-white border-b-2 border-blue-400 bg-blue-500/10':'text-textMuted hover:text-white'}`}>
                <Code2 className="w-3.5 h-3.5" /> Code Editor
                {currentQ?.isCodeChallenge && <span className="ml-1 px-1.5 py-0.5 bg-blue-500/30 text-blue-300 rounded text-[9px]">Required</span>}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {tab === 'text' ? (
                <motion.div key="text" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-textMuted font-medium uppercase tracking-wider">Your Answer</span>
                    <button onClick={toggleListening}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                        isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-textMuted hover:bg-white/20 hover:text-white'
                      }`}>
                      {isListening ? <><Mic className="w-3.5 h-3.5" />Stop</> : <><MicOff className="w-3.5 h-3.5" />Voice</>}
                    </button>
                  </div>
                  <textarea className="w-full bg-transparent border-none outline-none text-textMain placeholder-textMuted min-h-[100px] resize-y text-sm leading-relaxed"
                    placeholder="Type your answer, or click 'Voice' to speak..." value={answer}
                    onChange={e => setAnswer(e.target.value)} disabled={submitting} />
                </motion.div>
              ) : (
                <motion.div key="code" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col">
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-black/20">
                    <Code2 className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs text-blue-300 font-mono font-semibold">{currentQ?.codeLanguage || 'javascript'}</span>
                    <button onClick={handleRunCode} disabled={isExecuting} className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all rounded text-xs font-semibold border border-emerald-500/40">
                      {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Zap className="w-3 h-3" />}
                      Run Code
                    </button>
                  </div>
                  <div className="flex flex-col border-b border-white/10">
                    <Editor
                      height="200px" // Adjusted height to fit terminal
                      language={currentQ?.codeLanguage || 'javascript'}
                      value={userCode}
                      onChange={v => setUserCode(v || '')}
                      theme="vs-dark"
                      options={{
                        fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false,
                        padding: { top: 12 }, lineNumbers: 'on', automaticLayout: true,
                        fontFamily: '"Fira Code", "JetBrains Mono", monospace'
                      }}
                    />
                    <div className="h-32 bg-black/80 p-3 overflow-y-auto font-mono text-xs border-t border-white/5">
                      <div className="flex items-center justify-between text-textMuted mb-2 border-b border-white/10 pb-1">
                        <span>Terminal Output</span>
                        {codeOutput && <span className="text-emerald-400 text-[9px] uppercase tracking-wider">Executed</span>}
                      </div>
                      <pre className={`${codeOutput.includes('Error') ? 'text-red-400' : 'text-emerald-300'} whitespace-pre-wrap leading-relaxed`}>
                        {codeOutput || '> Ready for execution. Click "Run Code"'}
                      </pre>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="flex justify-between items-center px-5 py-3 border-t border-white/10 gap-3">
              <div className="flex items-center gap-3">
                {tab === 'text' && <span className="text-xs text-textMuted">{wordCount} words</span>}
                {tab === 'text' && answer.length > 0 && <SentimentBadge label={textAnalysis.label} />}
              </div>
              <div className="flex items-center gap-2">
                {/* Adaptive follow-up button */}
                {answer.trim().length >= 30 && tab === 'text' && (
                  <button onClick={requestFollowUp} disabled={followUpLoading}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300 hover:bg-orange-500/20 transition-all font-semibold">
                    {followUpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><RefreshCcw className="w-3.5 h-3.5" />Follow-up Q</>}
                  </button>
                )}
                <button onClick={handleNext} disabled={submitting} className="btn-primary flex items-center gap-2 py-2 px-5 text-sm">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <>{currentIndex === questions.length-1 ? 'Finish & Submit':'Next'}<Send className="w-3.5 h-3.5" /></>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Answer Analyzer ──────────────────────────────────── */}
        <div className="hidden lg:flex flex-col gap-4">
          <div className="glass-panel p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted mb-4 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" /> Live Analyzer
            </h3>

            {/* Quality bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-textMuted">Answer Quality</span>
                <span className="font-bold" style={{color:quality.color}}>{quality.label}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{background:quality.color}}
                  animate={{width:`${quality.pct}%`}} transition={{duration:0.5}} />
              </div>
              <p className="text-[10px] text-textMuted mt-1">{wordCount} words · target 100–200</p>
            </div>

            {/* Confidence meter */}
            {tab === 'text' && (
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-textMuted">Tone Confidence</span>
                  <SentimentBadge label={textAnalysis.label} />
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500"
                    animate={{width:`${textAnalysis.confidence}%`}} transition={{duration:0.4}} />
                </div>
                <p className="text-[10px] text-textMuted mt-1">{textAnalysis.confidence}% confidence score</p>
              </div>
            )}

            {/* AI Facial Expression Track */}
            {camEnabled && faceModelsLoaded && expressions && (
              <div className="mb-4 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                <div className="flex justify-between text-xs mb-1.5 items-center">
                  <span className="text-textMuted flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Facial State</span>
                  <span className={`font-bold capitalize ${expressions[0] === 'happy' ? 'text-emerald-400' : expressions[0] === 'neutral' ? 'text-white/80' : 'text-amber-400'}`}>
                    {expressions[0]}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                  <motion.div 
                    className="h-full rounded-full absolute left-0 top-0"
                    style={{ background: expressions[0] === 'happy' ? '#10B981' : expressions[0] === 'neutral' ? '#9CA3AF' : '#F59E0B' }}
                    animate={{width:`${expressions[1]*100}%`}} 
                    transition={{duration:0.3}} 
                  />
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-primary">{wordCount}</p>
                <p className="text-[10px] text-textMuted mt-0.5">Words</p>
              </div>
              <div className={`bg-white/[0.03] border rounded-xl p-3 text-center ${textAnalysis.fillers.length>3?'border-red-500/30':'border-white/10'}`}>
                <p className={`text-xl font-black ${textAnalysis.fillers.length>3?'text-red-400':textAnalysis.fillers.length>0?'text-yellow-400':'text-emerald-400'}`}>{textAnalysis.fillers.length}</p>
                <p className="text-[10px] text-textMuted mt-0.5">Fillers</p>
              </div>
            </div>

            {/* Filler warnings */}
            {textAnalysis.fillers.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-red-400 mb-1.5 uppercase tracking-wider">⚠️ Detected</p>
                <div className="flex flex-wrap gap-1">
                  {textAnalysis.fillers.map(w => (
                    <span key={w} className="text-[10px] px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-red-300 font-mono">"{w}"</span>
                  ))}
                </div>
              </div>
            )}

            {/* Voice bars */}
            {isListening && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <WaveBars active={true} color="#EF4444" count={12} />
                <span className="text-xs text-red-400 font-semibold">Recording...</span>
              </div>
            )}
          </div>

          {/* Dimension scores after submitting (shown from memory) */}
          <div className="glass-panel p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-secondary" /> Score Dimensions
            </h3>
            <p className="text-[10px] text-textMuted/60 italic">Scores appear after each submission</p>
            <p className="text-xs text-textMuted mt-2">Tracked per answer:</p>
            {['Technical Accuracy', 'Communication Clarity', 'Problem Solving'].map((dim, i) => {
              const latestScore = memory.length > 0 ? memory[memory.length - 1].scores[i] : 0;
              return (
                <div key={dim} className="mt-2">
                  <div className="flex justify-between text-[10px] text-textMuted mb-1">
                    <span>{dim}</span>
                    <span>{latestScore > 0 ? `${latestScore}/100` : 'Evaluated by AI'}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      style={{background: i===0?'#6366F1':i===1?'#10B981':'#F59E0B'}}
                      animate={{width: `${latestScore}%`}}
                      transition={{duration:1}} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
