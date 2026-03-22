import { GoogleGenerativeAI } from '@google/generative-ai';

// use a safe publicly available dummy logic or just the code block
async function testChat() {
  if (!process.env.GEMINI_API_KEY) {
    console.log('Skipping chat test due to no local GEMINI key');
    return;
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
    const systemPrompt = "Hello system";
    const userPrompt = "Hello user";
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });
    
    console.log('Generating content...');
    const result = await model.generateContent(userPrompt);
    const answer = result.response.text();
    console.log('Result:', answer.substring(0, 50));
  } catch (e) {
    console.error('Chat logic failed:', e.message);
  }
}

testChat();
