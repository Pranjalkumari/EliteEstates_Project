const OPENAI_API_URL = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL || process.env.CLIENT_URL || "http://localhost:5173";
const OPENROUTER_SITE_NAME = process.env.OPENROUTER_SITE_NAME || "EliteEstates";
const OPENAI_FALLBACK_MODELS = (process.env.OPENAI_FALLBACK_MODELS || "google/gemma-4-26b-a4b-it:free,cohere/north-mini-code:free")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

function buildFallbackReply(userMessage, propertyContext) {
  const propertyHint = propertyContext
    ? `For this property (${propertyContext.title} in ${propertyContext.city}, $${propertyContext.price}), `
    : "";

  return `${propertyHint}thanks for your message. The owner is currently offline, but your query has been noted. ` +
    `Please share your preferred visit date/time, budget range, and any must-have requirements. ` +
    `The owner will get back to you soon.`;
}

export async function generateOfflineOwnerReply({ userMessage, propertyContext }) {
  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackReply(userMessage, propertyContext);
  }

  const contextText = propertyContext
    ? `Property details:\n- Title: ${propertyContext.title}\n- City: ${propertyContext.city}\n- Address: ${propertyContext.address}\n- Price: ${propertyContext.price}\n- Type: ${propertyContext.type}\n- Property: ${propertyContext.property}\n- Beds/Baths: ${propertyContext.bedroom}/${propertyContext.bathroom}`
    : "Property details are not available.";

  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    };

    if (OPENAI_API_URL.includes("openrouter.ai")) {
      headers["HTTP-Referer"] = OPENROUTER_SITE_URL;
      // OpenRouter docs use this header key; keep X-Title for backwards compatibility.
      headers["X-OpenRouter-Title"] = OPENROUTER_SITE_NAME;
      headers["X-Title"] = OPENROUTER_SITE_NAME;
    }

    const modelsToTry = [OPENAI_MODEL, ...OPENAI_FALLBACK_MODELS].filter(
      (model, index, arr) => arr.indexOf(model) === index
    );

    for (const model of modelsToTry) {
      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are an assistant replying on behalf of a real-estate owner who is currently offline. Keep responses short, professional, and helpful.",
            },
            {
              role: "user",
              content: `User message: ${userMessage}\n\n${contextText}`,
            },
          ],
          temperature: 0.6,
        }),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const aiText = data?.choices?.[0]?.message?.content?.trim();
      if (aiText) {
        return aiText;
      }
    }

    return buildFallbackReply(userMessage, propertyContext);
  } catch (error) {
    return buildFallbackReply(userMessage, propertyContext);
  }
}

