const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini Engine securely using the Environment Variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event, context) => {
    // CORS Headers for secure cross-origin requests
    const headers = {
        "Access-Control-Allow-Origin": "*", // Restrict this to your actual domain in production
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json"
    };

    // Handle Preflight OPTIONS request
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "" };
    }

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    try {
        const { message, clientContext, chatHistory } = JSON.parse(event.body);

        if (!message) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Message payload missing." }) };
        }

        // Initialize Gemini 2.5 Flash with extreme Command Center System Instructions
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `You are 'Oracle', the highly advanced, professional AI assistant integrated into the MA Digital Control Center. 
            Your tone is high-tech, efficient, extremely polite, and concise. You speak like a premium AI concierge.
            
            You are currently assisting the following client. Here is their real-time telemetry data:
            ${JSON.stringify(clientContext, null, 2)}
            
            RULES:
            1. Answer questions based ONLY on the provided telemetry data.
            2. If they ask about project status, read their active projects from the context.
            3. If they ask about billing, read their pending invoices from the context.
            4. If they ask a question outside this scope, or require human intervention, politely instruct them to use the 'Support Desk' module to open a ticket with the administrative team.
            5. Keep answers brief and formatted beautifully.`
        });

        // Initialize conversation with history to maintain context
        const chat = model.startChat({
            history: chatHistory || [],
        });

        // Transmit message to Gemini
        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                response: responseText,
                status: "success"
            }),
        };

    } catch (error) {
        console.error("Oracle AI Node Failure:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: "Oracle Cognitive Core Offline. Please try again later.", 
                details: error.message 
            }),
        };
    }
};