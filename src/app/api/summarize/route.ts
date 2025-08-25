import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { text, summaryType, customLength, tone } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'No text provided for summarization' }, { status: 400 });
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let prompt = '';
    
    // Build prompt based on summary type
    switch (summaryType) {
      case 'short':
        prompt = `Please provide a concise summary of the following text in 1-2 paragraphs. Focus on the main points and key information:\n\n${text}`;
        break;
      case 'bullet':
        prompt = `Please summarize the following text as bullet points. Extract the key information and present it in a clear, organized list:\n\n${text}`;
        break;
      case 'custom':
        const wordCount = customLength || 200;
        prompt = `Please summarize the following text in approximately ${wordCount} words. Maintain the essential information while being concise:\n\n${text}`;
        break;
      default:
        prompt = `Please provide a comprehensive summary of the following text, highlighting the main points and key information:\n\n${text}`;
    }

    // Add tone adjustment if specified
    if (tone && tone !== 'neutral') {
      const toneInstructions = {
        professional: 'Use a professional and formal tone.',
        casual: 'Use a casual and conversational tone.',
        academic: 'Use an academic and scholarly tone with precise language.'
      };
      prompt = `${toneInstructions[tone as keyof typeof toneInstructions]} ${prompt}`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    // Extract highlights (keywords, names, dates)
    const highlightPrompt = `From the following text, extract important keywords, names of people/organizations, and dates. Present them as a JSON object with three arrays: "keywords", "names", and "dates":\n\n${text}`;
    
    const highlightResult = await model.generateContent(highlightPrompt);
    const highlightResponse = await highlightResult.response;
    let highlights = { keywords: [], names: [], dates: [] };
    
    try {
      const highlightText = highlightResponse.text();
      // Try to parse JSON, fallback to empty object if parsing fails
      const jsonMatch = highlightText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        highlights = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.warn('Could not parse highlights:', parseError);
    }

    return NextResponse.json({
      success: true,
      summary,
      highlights,
      originalWordCount: text.split(/\s+/).length,
      summaryWordCount: summary.split(/\s+/).length,
      compressionRatio: Math.round((1 - summary.split(/\s+/).length / text.split(/\s+/).length) * 100)
    });

  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate summary. Please check your API key and try again.' 
    }, { status: 500 });
  }
}
