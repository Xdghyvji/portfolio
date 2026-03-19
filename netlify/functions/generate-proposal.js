const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini 2.5 Flash
// NOTE: Hardcoded for initial deployment. Move to process.env.GEMINI_API_KEY in production.
const genAI = new GoogleGenerativeAI("AIzaSyCDcg1N4T7tUQSexfouqTpot5UaP-pBDNI");

exports.handler = async (event, context) => {
    // CORS Headers
    const headers = {
        "Access-Control-Allow-Origin": "*", 
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json"
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "" };
    }

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    try {
        const { leadData } = JSON.parse(event.body);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `You are an elite Digital Solutions Architect for 'MA Digital Control Center'.
            Your task is to generate a high-converting, professional project proposal based on the client's inquiry.
            
            RULES:
            1. Output ONLY valid, clean HTML. Do NOT wrap your response in markdown formatting (like \`\`\`html).
            2. Use modern Tailwind CSS classes for styling (assume Tailwind is loaded).
            3. The design should be dark-themed, sleek, and utilize glassmorphism (use slate, indigo, and emerald accents).
            4. The proposal MUST include:
               - A professional header (MA Digital Control Center).
               - Executive Summary & Project Objective.
               - Proposed Solution & Scope of Work.
               - Estimated Timeline (Milestones).
               - Estimated Investment / Pricing (Generate a realistic, premium agency estimate based on their request).
            5. Write persuasive, authoritative, and highly technical copy.`
        });

        const prompt = `Generate a proposal for the following inbound lead:
        Client Name: ${leadData.name}
        Client Goal / Subject: ${leadData.goal}
        Detailed Inquiry: ${leadData.details}`;

        const result = await model.generateContent(prompt);
        let htmlContent = result.response.text();
        
        // Strip accidental markdown fences if the model includes them
        htmlContent = htmlContent.replace(/```html\n?/g, '').replace(/```\n?/g, '');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ proposalHtml: htmlContent }),
        };

    } catch (error) {
        console.error("Proposal Gen Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Proposal Generation Failed", details: error.message }),
        };
    }
};