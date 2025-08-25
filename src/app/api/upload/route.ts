import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const extractedText: string | null = data.get('extractedText') as string;

    // Check if we have pre-extracted text (for TXT files processed client-side)
    if (extractedText) {
      return NextResponse.json({
        text: extractedText,
        wordCount: extractedText.split(/\s+/).filter(word => word.length > 0).length,
        fileType: 'text/plain', // Assuming TXT for pre-extracted text
        fileName: 'document.txt',
        fileSize: 0
      });
    }

    // Handle server-side extraction for DOCX and TXT files
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type (only DOCX and TXT supported)
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload DOCX or TXT files for server-side processing.' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let text = '';

    try {
      // Extract text based on file type
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else if (file.type === 'text/plain') {
        text = buffer.toString('utf-8');
      }

      // Basic validation of extracted text
      if (!text || text.trim().length === 0) {
        return NextResponse.json({ error: 'No text could be extracted from the file' }, { status: 400 });
      }

      // Limit text length for processing
      if (text.length > 100000) {
        text = text.substring(0, 100000) + '...';
      }

      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;

      return NextResponse.json({
        success: true,
        text,
        filename: file.name,
        fileSize: file.size,
        wordCount,
      });

    } catch (extractionError) {
      console.error('Text extraction error:', extractionError);
      return NextResponse.json({ error: 'Failed to extract text from file' }, { status: 500 });
    }

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
  }
}
