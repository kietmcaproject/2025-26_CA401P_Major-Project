import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Mic, CheckCircle, XCircle, Loader2, Video, Volume2, ArrowRight, AlertTriangle, Bot, Code2, Users, Briefcase } from 'lucide-react';

const PERSONAS = [
  {
    id: 'Technical',
    icon: Code2,
    label: 'Technical',
    desc: 'Algorithms, system design, coding challenges, and deep technical depth',
    color: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/40',
    iconColor: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    id: 'HR',
    icon: Users,
    label: 'HR / Soft Skills',
    desc: 'Communication, teamwork, culture fit, and behavioral questions',
    color: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/40',
    iconColor: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    id: 'Managerial',
    icon: Briefcase,
    label: 'Managerial',
    desc: 'Leadership, decision-making, strategic thinking, and conflict resolution',
    color: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/40',
    iconColor: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
];

const CheckItem = ({ label, status }) => {
  const icon = status === 'checking' ? <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
    : status === 'ok'    ? <CheckCircle className="w-4 h-4 text-emerald-400" />
    : status === 'error' ? <XCircle className="w-4 h-4 text-red-400" />
    : status === 'idle'  ? <div className="w-4 h-4 rounded-full border-2 border-white/20" />
    : <div className="w-4 h-4 rounded-full border-2 border-white/20" />;
    
  const color = status === 'ok' ? 'text-emerald-400' : status === 'error' ? 'text-red-400' : status === 'checking' ? 'text-yellow-400' : 'text-textMuted';
  return (
    <div className="flex items-center gap-3 py-2">
      {icon}
      <span className={`text-sm font-medium ${color}`}>{label}</span>
    </div>
  );
};

const TIPS = [
  '💡 Find a quiet place with good lighting behind you',
  '💡 Look directly at the camera when speaking',
  '💡 Use the STAR method for behavioral questions',
  '💡 Take a breath before answering each question',
  '💡 Pause and think — it\'s okay to take 5-10 seconds',
  '💡 Be specific: mention real tools, numbers, and projects',
];

const PreInterviewSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const interviewId = location.state?.interviewId;

  const [selectedPersona, setSelectedPersona] = useState('Technical');
  const [step, setStep] = useState('persona'); // persona | checks
  const [isContinuing, setIsContinuing] = useState(false);
  
  const [camStatus, setCamStatus]     = useState('idle');
  const [micStatus, setMicStatus]     = useState('idle');
  const [browserStatus, setBrowserStatus] = useState('idle');
  const [camStream, setCamStream]     = useState(null);
  const [micLevel, setMicLevel]       = useState(0);
  const [tipIndex, setTipIndex]       = useState(0);

  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const micAnimRef= useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (videoRef.current && camStream) videoRef.current.srcObject = camStream;
  }, [camStream]);

  useEffect(() => {
    return () => cleanup();
  }, []);

  const cleanup = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (micAnimRef.current) cancelAnimationFrame(micAnimRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(console.error);
    }
  };

  const runChecks = async () => {
    setIsContinuing(true);
    await new Promise(r => setTimeout(r, 600)); // slight delay for UX
    setStep('checks');
    setIsContinuing(false);
    
    setBrowserStatus('checking');
    await new Promise(r => setTimeout(r, 400));
    setBrowserStatus(!!(navigator.mediaDevices?.getUserMedia) ? 'ok' : 'error');

    // Only query permissions, do NOT call getUserMedia here
    try {
      const camPerm = await navigator.permissions.query({ name: 'camera' });
      const micPerm = await navigator.permissions.query({ name: 'microphone' });
      setCamStatus(camPerm.state === 'granted' ? 'ok' : camPerm.state === 'denied' ? 'error' : 'idle');
      setMicStatus(micPerm.state === 'granted' ? 'ok' : micPerm.state === 'denied' ? 'error' : 'idle');
    } catch (e) {
      setCamStatus('idle');
      setMicStatus('idle');
    }
  };

  const testHardware = async () => {
    setCamStatus('checking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCamStream(stream);
      setCamStatus('ok');
    } catch { setCamStatus('error'); }

    setMicStatus('checking');
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      
      // Store reference to mic stream for cleanup
      if (!streamRef.current) {
        streamRef.current = micStream;
      } else {
        micStream.getTracks().forEach(t => streamRef.current.addTrack(t));
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      ctx.createMediaStreamSource(micStream).connect(analyser);
      analyser.fftSize = 256;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        analyser.getByteFrequencyData(data);
        setMicLevel(Math.min(100, (data.reduce((a, b) => a + b, 0) / data.length) * 3));
        micAnimRef.current = requestAnimationFrame(update);
      };
      update();
      setMicStatus('ok');
    } catch { setMicStatus('error'); }
  };

  const handleBegin = () => {
    cleanup();
    navigate(`/interview/${interviewId}`, {
      state: { persona: selectedPersona }
    });
  };

  const anyError = camStatus === 'error' || micStatus === 'error' || browserStatus === 'error';
  const allOk    = camStatus === 'ok' && micStatus === 'ok' && browserStatus === 'ok';
  const persona  = PERSONAS.find(p => p.id === selectedPersona);

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-4">
          <Bot className="w-4 h-4" /> Pre-Interview Setup
        </div>
        <h1 className="text-3xl font-extrabold mb-2">
          {step === 'persona' ? 'Choose Your Interview Type' : 'System Check & Tips'}
        </h1>
        <p className="text-textMuted">
          {step === 'persona' ? 'This determines what kind of questions the AI will ask you' : 'Let\'s make sure everything is ready before we begin'}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ── STEP 1: Persona Selection ── */}
        {step === 'persona' && (
          <motion.div key="persona" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {PERSONAS.map(p => {
                const Icon = p.icon;
                const isSelected = selectedPersona === p.id;
                return (
                  <motion.button
                    key={p.id}
                    onClick={() => setSelectedPersona(p.id)}
                    whileHover={{ scale: 1.02, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    className={`glass-panel p-6 text-left flex flex-col gap-4 transition-all duration-300 relative overflow-hidden ${
                      isSelected ? `border-2 ${p.border}` : 'border border-white/10'
                    }`}
                  >
                    {isSelected && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${p.color} pointer-events-none`} />
                    )}
                    <div className={`relative z-10 p-3 rounded-2xl w-fit ${isSelected ? `bg-gradient-to-br ${p.color}` : 'bg-white/5'} border border-white/10`}>
                      <Icon className={`w-7 h-7 ${isSelected ? p.iconColor : 'text-textMuted'}`} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{p.label}</h3>
                        {isSelected && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${p.badge}`}>Selected</span>
                        )}
                      </div>
                      <p className="text-textMuted text-sm leading-relaxed">{p.desc}</p>
                    </div>
                    {isSelected && (
                      <div className="relative z-10 mt-auto">
                        <CheckCircle className={`w-5 h-5 ${p.iconColor}`} />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex justify-center">
              <motion.button
                onClick={runChecks}
                disabled={isContinuing}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className={`py-4 px-12 rounded-2xl font-bold text-lg flex items-center gap-3 bg-gradient-to-r ${persona.color.replace('/20', '')} border ${persona.border} text-white shadow-xl ${isContinuing ? 'opacity-75 cursor-not-allowed' : ''}`}
                style={{ background: 'linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))' }}
              >
                {isContinuing ? <Loader2 className="w-6 h-6 animate-spin" /> : <persona.icon className="w-6 h-6" />}
                {isContinuing ? 'Preparing...' : `Continue with ${persona.label} Interview`}
                {!isContinuing && <ArrowRight className="w-5 h-5" />}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: System Checks ── */}
        {step === 'checks' && (
          <motion.div key="checks" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Camera Preview */}
              <div className="glass-panel p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2"><Camera className="w-5 h-5 text-primary" /> Camera Preview</h3>
                  {camStatus !== 'ok' && camStatus !== 'checking' && (
                    <button onClick={testHardware} className="text-xs bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-3 py-1.5 rounded-lg transition-colors">
                      Test Camera/Mic
                    </button>
                  )}
                </div>
                <div className="w-full rounded-2xl overflow-hidden bg-black/60 border border-white/10 relative" style={{ aspectRatio: '4/3' }}>
                  {camStatus === 'ok' ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs text-white font-medium">LIVE</span>
                      </div>
                    </>
                  ) : camStatus === 'checking' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      <p className="text-textMuted text-sm">Requesting camera...</p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <CameraOff className="w-12 h-12 text-textMuted/50" />
                      <p className="text-xs text-textMuted text-center px-4">Click "Test Camera/Mic" to preview, or proceed without it.</p>
                    </div>
                  )}
                </div>
                {(micStatus === 'ok' || micStatus === 'checking') && (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Mic className="w-4 h-4 text-secondary" />
                      <span className="text-xs text-textMuted">Microphone Level — speak to test</span>
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-secondary to-emerald-300"
                        animate={{ width: `${micLevel}%` }} transition={{ duration: 0.1 }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Right col */}
              <div className="flex flex-col gap-5">
                {/* Persona badge */}
                <div className={`glass-panel p-4 flex items-center gap-3 border ${persona.border} bg-gradient-to-br ${persona.color}`}>
                  <persona.icon className={`w-6 h-6 ${persona.iconColor}`} />
                  <div>
                    <p className="font-bold">{persona.label} Interview Selected</p>
                    <p className="text-xs text-textMuted">{persona.desc}</p>
                  </div>
                </div>

                {/* System checks */}
                <div className="glass-panel p-5">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-secondary" /> System Checks</h3>
                  <div className="divide-y divide-white/5">
                    <CheckItem label="Browser supports WebRTC" status={browserStatus} />
                    <CheckItem label="Camera access (Optional)" status={camStatus} />
                    <CheckItem label="Microphone access (Optional)" status={micStatus} />
                    <CheckItem label="Speech recognition" status={typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) ? 'ok' : 'error'} />
                  </div>
                  {anyError && (
                    <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-300">Errors won't stop you — camera/mic are optional features.</p>
                    </div>
                  )}
                </div>

                {/* Tips carousel */}
                <div className="glass-panel p-5 flex-grow">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><Volume2 className="w-4 h-4 text-primary" /> Quick Tips</h3>
                  <div className="overflow-hidden h-12">
                    <AnimatePresence mode="wait">
                      <motion.p key={tipIndex} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.35 }} className="text-sm text-textMuted leading-relaxed">
                        {TIPS[tipIndex]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  <div className="flex gap-1.5 mt-3">
                    {TIPS.map((_, i) => (
                      <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === tipIndex ? 'bg-primary w-6' : 'bg-white/15 w-2'}`} />
                    ))}
                  </div>
                </div>

                {/* Begin */}
                <motion.button onClick={handleBegin} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-secondary text-white shadow-xl shadow-primary/30">
                  {allOk ? <><CheckCircle className="w-6 h-6" /> All Ready — Start Interview</> : <><ArrowRight className="w-6 h-6" /> Start Interview Anyway</>}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PreInterviewSetup;
