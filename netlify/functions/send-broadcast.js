const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Resend } = require("resend");

// Initialize APIs (Move to process.env in production)
const genAI = new GoogleGenerativeAI("AIzaSyCDcg1N4T7tUQSexfouqTpot5UaP-pBDNI");
const resend = new Resend("re_P4SvFN5Z_BkWw2wVvAL6cvLXqwi117XB3");

exports.handler = async (event, context) => {
    // CORS Headers
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json"
    };

    if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
    if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };

    try {
        const { leads, campaignPrompt, senderName } = JSON.parse(event.body);

        if (!leads || leads.length === 0) throw new Error("No target leads provided.");

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `You are an elite AI Copywriter for MA Digital Control Center.
            Your job is to write highly-converting, personalized cold emails based on the provided campaign goal and specific lead details.
            
            RULES:
            1. Write in a confident, professional, and slightly conversational tone.
            2. Keep it concise. Focus on value and a clear Call To Action.
            3. Use HTML formatting for the body (e.g., <br>, <strong>, <p>).
            4. You MUST output ONLY valid JSON in this exact format:
            {
              "subject": "The personalized subject line",
              "bodyHtml": "The formatted HTML email body"
            }
            Do not wrap the JSON in markdown blocks like \`\`\`json.`
        });

        let successCount = 0;
        let failCount = 0;

        // Loop through leads and personalize each email
        // Using a sequential for-loop to avoid hitting Gemini rate limits on large lists
        for (const lead of leads) {
            try {
                const aiPrompt = `
                CAMPAIGN GOAL: ${campaignPrompt}
                ---
                TARGET LEAD DETAILS:
                Name: ${lead.name || 'Friend'}
                Interest/Goal: ${lead.goal || 'Digital Growth'}
                Previous Inquiry Notes: ${lead.details || 'N/A'}
                ---
                Write the personalized email from ${senderName || 'Mubashir Arham'}. Ensure it feels tailored to their specific inquiry.`;

                const result = await model.generateContent(aiPrompt);
                const responseText = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '');
                
                const emailData = JSON.parse(responseText);

                // Dispatch via Resend
                await resend.emails.send({
                    from: 'MA Digital Control Center <onboarding@resend.dev>', // Change to your verified domain later (e.g., hello@mubashir.com)
                    to: lead.email,
                    subject: emailData.subject,
                    html: emailData.bodyHtml
                });

                successCount++;
            } catch (err) {
                console.error(`Failed to process lead: ${lead.email}`, err);
                failCount++;
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                message: "Broadcast transmission complete.",
                stats: { sent: successCount, failed: failCount }
            }),
        };

    } catch (error) {
        console.error("Broadcast Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Transmission Failed", details: error.message }),
        };
    }
};