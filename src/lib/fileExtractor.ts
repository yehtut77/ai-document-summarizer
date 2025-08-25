'use client';

export interface FileExtractionResult {
  text: string;
  wordCount: number;
  fileType: string;
  fileName: string;
  fileSize: number;
  pageCount?: number;
}

export async function extractTextFromFile(file: File): Promise<FileExtractionResult> {
  const fileType = file.type;
  let text = '';

  try {
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For DOCX files, we'll still need server-side processing
      // This will be handled by sending the file to the server
      throw new Error('DOCX processing requires server-side extraction');
    } else if (fileType === 'text/plain') {
      text = await file.text();
    } else {
      throw new Error('Unsupported file type');
    }

    // Basic validation
    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from the file');
    }

    // Limit text length for processing
    if (text.length > 100000) {
      text = text.substring(0, 100000) + '...';
    }

    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;

    return {
      text,
      wordCount,
      fileType,
      fileName: file.name,
      fileSize: file.size
    };
  } catch (error) {
    console.error('File extraction error:', error);
    throw error;
  }
}
