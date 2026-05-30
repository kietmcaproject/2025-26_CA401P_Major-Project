require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
    try {
        console.log('Testing generateQuestions...');
        const skills = ['React', 'Node.js', 'MongoDB'];
        const prompt = `Generate 5 technical interview questions for a candidate with the following skills: ${skills.join(', ')}. Include a mix of technical, behavioral, and problem-solving questions. Provide the output as a JSON object with a single "questions" array containing strings of the questions. Clean JSON only.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        console.log('Got result:', response.text);
    } catch (e) {
        console.error('Error message:', e.message);
    }
}
test();
