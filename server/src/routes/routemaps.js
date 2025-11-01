import { Router } from 'express';

const router = Router();

const GEMINI_API_KEY = 'AIzaSyDptN4obJdjOpc4yrqlZPiYXKBc1DUDsiA';
// Using default Gemini model: gemini-pro (most stable and widely available)
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_STREAM_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent`;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// POST /api/routemaps/generate - Generate route map with streaming
router.post('/generate', async (req, res) => {
  try {
    const { query, stream, duration } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Build the prompt for route map generation
    const prompt = `You are an expert career counselor specializing in Indian Defence Forces preparation. 
Create a detailed, week-by-week study roadmap for: "${query}"

IMPORTANT FORMATTING RULES:
- DO NOT use markdown headers (##, ###, ####, etc.)
- DO NOT use hashtags (#) or markdown symbols
- DO NOT use raw formatting symbols like *, **, __
- Use plain text with clear section breaks
- Use bullet points with simple dashes (-) or numbers
- Use emojis sparingly and only where appropriate
- Write in natural, flowing paragraphs
- Structure content with clear headings using plain text (e.g., "OVERVIEW:", "WEEK 1:", "MILESTONES:")
- Make it clean, readable, and professional

Include:
1. Overview of the exam/topic
2. Duration-based study plan (${duration || '6 months'})
3. Week-by-week breakdown with specific topics
4. Important milestones and deadlines
5. Resources and tips
6. Revision strategy

Make it actionable, realistic, and beautifully formatted without markdown syntax.`;

    // If streaming is requested
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      try {
        const response = await fetch(`${GEMINI_STREAM_API_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Gemini API Error:', response.status, errorText);
          res.write(`data: ${JSON.stringify({ error: `Gemini API Error: ${response.status}`, details: errorText })}\n\n`);
          res.end();
          return;
        }

        console.log('Gemini API streaming started successfully');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        let totalChunks = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log(`Streaming completed. Total chunks processed: ${totalChunks}`);
            // Send any remaining buffer
            if (buffer.trim()) {
              try {
                const lines = buffer.split('\n');
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6).trim();
                    if (jsonStr) {
                      const data = JSON.parse(jsonStr);
                      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                        const text = data.candidates[0].content.parts[0].text;
                        res.write(`data: ${JSON.stringify({ text })}\n\n`);
                      }
                    }
                  }
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr || jsonStr === '[DONE]') continue;
              
              try {
                const data = JSON.parse(jsonStr);
                totalChunks++;
                
                // Handle Gemini streaming response format
                // Format 1: Full candidate with content.parts
                if (data.candidates && data.candidates.length > 0) {
                  const candidate = data.candidates[0];
                  
                  // Check if there's content with parts (full chunks)
                  if (candidate.content && candidate.content.parts) {
                    for (const part of candidate.content.parts) {
                      if (part.text) {
                        res.write(`data: ${JSON.stringify({ text: part.text })}\n\n`);
                      }
                    }
                    continue;
                  }
                  
                  // Format 2: Delta chunks (incremental text)
                  if (candidate.delta && candidate.delta.content && candidate.delta.content.parts) {
                    for (const part of candidate.delta.content.parts) {
                      if (part.text) {
                        res.write(`data: ${JSON.stringify({ text: part.text })}\n\n`);
                      }
                    }
                    continue;
                  }
                }
                
                // Log if we get data but no text (for debugging)
                if (totalChunks === 1) {
                  console.log('First chunk sample:', JSON.stringify(data).substring(0, 200));
                }
              } catch (e) {
                // Skip invalid JSON lines
                console.error('Error parsing JSON:', e, 'Line:', jsonStr.substring(0, 100));
              }
            }
          }
        }
      } catch (error) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming response (fallback)
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error (non-streaming):', response.status, errorText);
        return res.status(response.status).json({ error: `Gemini API Error: ${response.status}`, details: errorText });
      }

      const data = await response.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

      res.json({ result });
    }
  } catch (error) {
    console.error('Route map generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

