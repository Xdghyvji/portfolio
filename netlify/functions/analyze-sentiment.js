const { GoogleGenerativeAI } = require("@google/generative-ai");

// Securely initialize Gemini pulling from your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event, context) => {
    // CORS Headers
    const headers = {
        "Access-Control-Allow-Origin": "*", 
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json"
    };

    // Handle Preflight
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "" };
    }

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    try {
        const { textToAnalyze } = JSON.parse(event.body);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `You are an elite AI Sentiment & Intent Analyzer for the MA Digital Control Center. 
            Your objective is to read incoming client leads and provide a rapid, tactical breakdown.
            
            Format your response strictly as follows (keep it very concise):
            - Intent Level: [High/Medium/Low]
            - Primary Sentiment: [Urgent, Professional, Frustrated, Curious, etc.]
            - Tactical Approach: [1 sentence on the best way to close or handle this lead]`
        });

        const result = await model.generateContent(`Analyze the following lead data:\n${textToAnalyze}`);
        const analysis = result.response.text();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ analysis }),
        };

    } catch (error) {
        console.error("Sentiment Analysis Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Sentiment Analysis Failed", details: error.message }),
        };
    }
};