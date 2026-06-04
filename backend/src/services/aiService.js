const logger = require('../utils/logger');

// Strips HTML tags/entities from note content before sending to the AI
const stripHtml = (html) => {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
};

// Sends note content to Gemini and returns a concise summary
const summariseNote = async (title, content) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is missing in .env.');
    error.status = 500;
    throw error;
  }

  const plainText = stripHtml(content);

  if (!plainText || plainText.length < 20) {
    const error = new Error('Note content is too short to summarise.');
    error.status = 400;
    throw error;
  }

  const prompt = `Summarise the overall gist of following note in 2-5 complete sentences. Cover the main ideas from the whole note. Do not end mid-sentence. Do not include any preamble or meta-commentary - just the summary.

Title: ${title || 'Untitled'}

Content:
${plainText.slice(0, 12000)}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingLevel: 'low' },
        },
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.error?.message || `Gemini API request failed with status ${response.status}`;

    logger.error({ status: response.status, message }, 'Gemini summariser failed');

    const error = new Error(message);
    error.status = 502;
    throw error;
  }

const candidate = data?.candidates?.[0];

    // Exclude internal thought parts so reasoning doesn't leak into summary
    const summary = (candidate?.content?.parts || [])
      .filter((part) => !part.thought)
      .map((part) => part.text)
      .filter(Boolean)
      .join('')
      .trim();

    if (!summary) {
      const reason = candidate?.finishReason === 'MAX_TOKENS'
        ? 'The summary was cut off before any text was produced. Please try again.'
        : 'Failed to generate summary. Please try again.';
      const error = new Error(reason);
      error.status = 502;
      throw error;
    }

    return summary;
};

module.exports = { summariseNote };