import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  financialContext: z.string().optional(),
});

const SYSTEM_PROMPT = `You are FinPilot AI, a warm, precise personal financial advisor.

Guidelines:
- Give actionable, concrete advice grounded in the user's financial context when provided.
- Use INR (₹) by default. Use lakhs/crores where natural.
- Prefer short bullet lists and clear headings. Use markdown.
- Never invent numbers. If unsure, ask a clarifying question.
- Cover: budgeting, expenses, investments (India: PPF, EPF, NPS, ELSS, index funds, FDs), tax (old/new regime), insurance, loans, EMI, goals, retirement, inflation.
- Keep responses under ~250 words unless asked for detail.`;

export const chatWithAdvisor = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const systemPieces = [SYSTEM_PROMPT];

    if (data.financialContext) {
      systemPieces.push(
        `\n\nUser financial snapshot:\n${data.financialContext}`
      );
    }

    try {
      const geminiKey = process.env.GEMINI_API_KEY;

      if (!geminiKey) {
        throw new Error("GEMINI_API_KEY is not configured.");
      }

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": geminiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPieces.join("\n") }],
            },
            contents: data.messages
              .filter((message) => message.role !== "system")
              .map((message) => ({
                role: message.role === "assistant" ? "model" : "user",
                parts: [{ text: message.content }],
              })),
            generationConfig: {
              maxOutputTokens: 700,
            },
          }),
        }
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Gemini API ${response.status}: ${body.slice(0, 300)}`
        );
      }

      const payload = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      };

      const text = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();

      if (!text) {
        throw new Error("Gemini returned an empty response.");
      }

      return { text };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      if (/429/.test(message)) {
        throw new Error(
          "AI rate limit reached. Please try again in a moment."
        );
      }

      if (/401|403/.test(message)) {
        throw new Error("AI API key is invalid or not authorized.");
      }

      throw new Error(`AI advisor failed: ${message}`);
    }
  });