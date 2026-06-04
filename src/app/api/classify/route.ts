import {NextRequest} from "next/server";

// ---------------------------------------------------------------------------
// Mock classifier — replace with a real AI call (e.g. OpenAI, Anthropic, etc.)
// ---------------------------------------------------------------------------
function makePrompt(message: string) {

    return `You are a senior customer support representative.
   Your task is to classify the following customer message into one of the following categories:
   Billing, Technical, General Inquiry, Complaint, Feature Request. 
   Also, determine the priority of the message as Urgent, High, Medium, or Low.
   Your response should be in JSON and in the following format: 
   {"category": [Category], "priority": [Priority], "suggested_reply": [Suggested Reply],
    "estimated_resolution_time": [Estimated Resolution Time]}.
   For example: {"category": Billing, "priority": High, "suggested_reply": Thank you for your patience,
   "estimated_resolution_time": 1 business day}. Now, classify the following message: ${message}`;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const message: string | undefined = body?.message;

        if (!message || message.trim().length < 10) {
            return Response.json(
                {error: "Message must be at least 10 characters long."},
                {status: 400}
            );
        }

        const prompt = makePrompt(message.trim());

        const result = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: 1024,
            }),
        });

        const data = await result.json();
        const response = JSON.parse(data.choices[0].message.content);

        if (response) {
            return Response.json(response, {status: 200});
        }

        return Response.json(
            {error: "Failed to classify the ticket. Please try again."},
            {status: 500}
        );

    } catch {
        return Response.json(
            {error: "Failed to classify the ticket. Please try again."},
            {status: 500}
        );
    }
}
