const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Model cascade: try lite first (more quota-friendly), then full flash
const MODEL_CASCADE = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-lite-latest',
];

// Shared Retry Wrapper with model cascade
// Tries each model in sequence on 503/429, with exponential backoff
const callGeminiWithRetry = async (contents, retries = 3, delayMs = 1500) => {
  let lastError;

  for (const model of MODEL_CASCADE) {
    let modelRetries = retries;
    let currentDelay = delayMs;

    while (modelRetries >= 0) {
      try {
        const response = await ai.models.generateContent({ model, contents });
        return response;
      } catch (err) {
        const status = err?.status;
        lastError = err;

        // Rate-limited on this model → skip to next model
        if (status === 429) {
          console.log(`Gemini ${status} on ${model}. Switching model...`);
          break;
        }

        // Overloaded → retry same model with backoff
        if ([500, 502, 503, 504].includes(status) && modelRetries > 0) {
          console.log(`Gemini ${status} on ${model}. Retrying in ${currentDelay}ms... (${modelRetries} left)`);
          await new Promise(res => setTimeout(res, currentDelay));
          currentDelay *= 2;
          modelRetries--;
          continue;
        }

        // Non-retryable error (400, 401, 403, 404) → throw immediately
        throw err;
      }
    }
  }

  throw lastError;
};

// JSON Cleaner
const cleanGeminiJson = (text) => {
  let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const match = cleaned.match(/(\{[\s\S]*\})/m);
  return match ? match[1] : cleaned;
};

// Resume Analysis
exports.analyzeResume = async (text) => {
  const prompt = `Analyze the following resume text and extract the top skills, technologies, experience, projects, and education. Provide the output strictly as a JSON object with a single "skills" array containing the names of the technical skills and technologies detected. Do not add markdown backticks for json. Just the JSON object.
Text: ${text}`;
  try {
    const response = await callGeminiWithRetry(prompt);
    const data = JSON.parse(cleanGeminiJson(response.text));
    return data.skills || [];
  } catch (error) {
    console.error('Gemini analyzeResume error:', error.message);
    return [];
  }
};

// Generate Questions by Persona
exports.generateQuestions = async (skills, persona = 'Technical') => {
  const personaInstructions = {
    Technical:  'Focus on algorithms, system design, coding concepts, and technical depth. Include 3 technical and 2 behavioral questions.',
    HR:         'Focus on soft skills, teamwork, culture fit, and career motivation. Include 2 situational and 3 behavioral questions.',
    Managerial: 'Focus on leadership, decision-making, conflict resolution, and strategic thinking. Include 2 situational, 2 behavioral, and 1 leadership question.'
  };

  // Fallback skills if resume parsing returned nothing
  const effectiveSkills = (skills && skills.length > 0)
    ? skills
    : ['Problem Solving', 'Communication', 'Teamwork', 'Software Development'];

  const prompt = `Generate 5 interview questions for a ${persona} interview for a candidate with the following skills: ${effectiveSkills.join(', ')}.
${personaInstructions[persona] || personaInstructions.Technical}
Provide the output strictly as a JSON object with a single "questions" array. Each item must have:
- "questionText": the question string
- "questionType": "Technical" or "Behavioral"
- "isCodeChallenge": true ONLY for at most 1 Technical question where the candidate should write code, otherwise false
- "codeLanguage": "javascript" if isCodeChallenge is true, otherwise ""
Clean JSON only, no markdown, no extra text before or after the JSON.`;

  try {
    const response = await callGeminiWithRetry(prompt);
    const data = JSON.parse(cleanGeminiJson(response.text));
    if (data.questions && data.questions.length > 0) return data.questions;
    throw new Error('Empty questions array from Gemini');
  } catch (error) {
    console.error('Gemini generateQuestions error:', error.message);
    // Last-resort: simplified prompt
    try {
      console.log('Retrying with simplified prompt...');
      const simple = `Generate exactly 5 interview questions for a ${persona} interview. Return ONLY valid JSON with no markdown: {"questions": [{"questionText": "...", "questionType": "Technical", "isCodeChallenge": false, "codeLanguage": ""}]}`;
      const retry = await callGeminiWithRetry(simple);
      const retryData = JSON.parse(cleanGeminiJson(retry.text));
      return retryData.questions || [];
    } catch (retryError) {
      console.error('Gemini generateQuestions retry failed:', retryError.message);
      return [];
    }
  }
};

// Generate Adaptive Follow-up Question
exports.generateFollowUp = async (questionText, answer, contextualMemory = []) => {
  const memoryContext = contextualMemory.length > 0
    ? `\nPrevious context from this interview:\n${contextualMemory.map(m => `- Q: "${m.questionText}" - Topics: ${m.keyTopics.join(', ')}`).join('\n')}`
    : '';

  const prompt = `You are an expert interviewer. Based on the candidate's answer to the current question, generate ONE smart follow-up question that digs deeper into what they said.

Current Question: ${questionText}
Candidate's Answer: ${answer}
${memoryContext}

Rules:
- Reference specific things the candidate mentioned (technologies, experiences, numbers)
- If they mentioned a tool/framework, ask about a specific challenge with it
- If they gave a vague answer, ask them to be more specific
- Keep it natural and conversational
- Return ONLY a JSON object: { "questionText": "...", "questionType": "Technical" or "Behavioral" }`;

  try {
    const response = await callGeminiWithRetry(prompt);
    return JSON.parse(cleanGeminiJson(response.text));
  } catch (error) {
    console.error('Gemini generateFollowUp error:', error.message);
    return { questionText: 'Can you elaborate more on that point?', questionType: 'Technical' };
  }
};

// Sentiment and Tone Analysis (no API call - fast local analysis)
exports.analyzeSentiment = async (answer) => {
  const lower = answer.toLowerCase();

  const confidentWords = ['definitely', 'absolutely', 'implemented', 'built', 'led', 'designed', 'achieved', 'optimized', 'successfully', 'expertise', 'proficient', 'efficiently', 'directly'];
  const hesitationWords = ['maybe', 'perhaps', 'not sure', 'i think', 'i guess', 'kind of', 'sort of', 'might', 'possibly', 'i believe', 'um', 'uh', 'never really', 'not much'];
  const clarityWords = ['firstly', 'secondly', 'for example', 'specifically', 'in other words', 'to clarify', 'the reason', 'which means', 'such as'];

  const confScore = confidentWords.filter(w => lower.includes(w)).length;
  const hesScore  = hesitationWords.filter(w => lower.includes(w)).length;
  const clarScore = clarityWords.filter(w => lower.includes(w)).length;

  const wordCount = answer.split(/\s+/).filter(Boolean).length;
  const lengthBonus = Math.min(30, wordCount / 5);

  const confidence  = Math.min(100, Math.max(0, 40 + confScore * 8 - hesScore * 10 + lengthBonus));
  const clarity     = Math.min(100, Math.max(0, 30 + clarScore * 12 + lengthBonus));
  const hesitation  = Math.min(100, Math.max(0, hesScore * 15));

  let label = 'Neutral';
  if (confidence >= 65 && hesitation < 30) label = 'Confident';
  else if (hesitation >= 40) label = 'Hesitant';
  else if (confidence < 35) label = 'Uncertain';

  const techKeywords = ['react', 'node', 'python', 'java', 'aws', 'docker', 'mongodb', 'sql', 'api', 'microservices', 'machine learning', 'typescript', 'kubernetes', 'redis', 'graphql'];
  const keyTopics = techKeywords.filter(k => lower.includes(k));

  return { confidence: Math.round(confidence), clarity: Math.round(clarity), hesitation: Math.round(hesitation), label, keyTopics };
};

// Enhanced Answer Evaluation (Multi-dimensional)
exports.evaluateAnswer = async (question, answer, questionType = 'Technical') => {
  const prompt = `Evaluate this candidate's answer to an interview question and provide a DETAILED multi-dimensional assessment.

Question: ${question}
Question Type: ${questionType}
Candidate's Answer: ${answer}

Return ONLY a strict JSON object with these exact fields:
{
  "score": 7,
  "technicalScore": 7,
  "clarityScore": 7,
  "problemSolvingScore": 7,
  "feedback": "2-3 sentences about what was good and what was missing",
  "keyStrengths": ["strength 1", "strength 2"],
  "improvementPoints": ["improvement 1", "improvement 2"],
  "idealAnswerHint": "1 sentence on what a perfect answer would include"
}`;

  try {
    const response = await callGeminiWithRetry(prompt);
    return JSON.parse(cleanGeminiJson(response.text));
  } catch (error) {
    console.error('Gemini evaluateAnswer error:', error.message);
    return { score: 0, technicalScore: 0, clarityScore: 0, problemSolvingScore: 0, feedback: 'Error evaluating answer.', keyStrengths: [], improvementPoints: [], idealAnswerHint: '' };
  }
};

// AI Hint
exports.getQuestionHint = async (questionText) => {
  const prompt = `You are a helpful interview coach. For the following interview question, provide a SHORT, helpful hint to guide the candidate WITHOUT giving away the full answer.

Question: ${questionText}

Provide ONE concise hint (2-3 sentences max). Be encouraging. Return plain text only.`;

  try {
    const response = await callGeminiWithRetry(prompt);
    return response.text;
  } catch (error) {
    console.error('Gemini hint error:', error.message);
    return 'Think about your past experience and structure your answer using the STAR method (Situation, Task, Action, Result).';
  }
};

// Coaching Report
exports.generateCoachingReport = async (questions, persona) => {
  const qSummary = questions.map((q, i) =>
    `Q${i+1} [${q.questionType}${q.isFollowUp ? ' (Follow-up)' : ''}]: ${q.questionText}\nAnswer: ${q.userAnswer}\nScores: Overall ${q.score}/10, Technical ${q.technicalScore}/10, Clarity ${q.clarityScore}/10\nFeedback: ${q.aiFeedback}`
  ).join('\n\n');

  const prompt = `You are an expert ${persona} interview coach analyzing a candidate's mock interview performance.

Interview Data:
${qSummary}

Generate a comprehensive coaching report. Return ONLY a JSON object with:
{
  "strongPoints": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "improvementAreas": ["area 1", "area 2", "area 3"],
  "suggestedResources": ["Resource 1 and why", "Resource 2", "Resource 3"],
  "coachingReport": "3-4 paragraph narrative coaching summary with actionable advice",
  "nextStepsAction": "One specific, concrete next step the candidate should take this week"
}`;

  try {
    const response = await callGeminiWithRetry(prompt);
    return JSON.parse(cleanGeminiJson(response.text));
  } catch (error) {
    console.error('Gemini coachingReport error:', error.message);
    return { strongPoints: [], improvementAreas: [], suggestedResources: [], coachingReport: '', nextStepsAction: '' };
  }
};

// Improvement Roadmap
exports.generateRoadmap = async (questions) => {
  const prompt = `Based on the candidate's performance, generate a personalized 3-step improvement roadmap.
${questions.map((q, i) => `Q${i+1}: ${q.questionText}\nAnswer: ${q.userAnswer}\nFeedback: ${q.aiFeedback}\nScore: ${q.score}/10`).join('\n\n')}

Provide a concise, actionable 3-step plan in plain markdown. No JSON.`;

  try {
    const response = await callGeminiWithRetry(prompt);
    return response.text;
  } catch (error) {
    console.error('Gemini roadmap error:', error.message);
    return 'Could not generate improvement roadmap.';
  }
};
