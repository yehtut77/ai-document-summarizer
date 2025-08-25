'use client';

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  wordCount: number;
}

export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    throw new Error('PDF extraction is only available in browser environment');
  }

  try {
    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    const pageCount = pdf.numPages;
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    // Clean up the text
    const cleanText = fullText
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
    
    const wordCount = cleanText.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      text: cleanText,
      pageCount,
      wordCount
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. The file may be corrupted or password-protected.');
  }
}
