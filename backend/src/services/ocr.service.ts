import { createWorker } from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number;
}

export const OcrService = {
  /**
   * Extract text from a base64-encoded image using Tesseract.js.
   * Runs entirely server-side — no external API calls.
   *
   * @param base64Image - The image data (with or without data URI prefix)
   * @returns Extracted text and confidence score (0-100)
   */
  async extractText(base64Image: string): Promise<OcrResult> {
    // Strip data URI prefix if present (e.g., "data:image/jpeg;base64,...")
    const imageData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

    // Convert base64 to Buffer
    const imageBuffer = Buffer.from(imageData, 'base64');

    const worker = await createWorker('eng', 1, {
      logger: () => {}, // Suppress progress logs
    });

    try {
      const { data } = await worker.recognize(imageBuffer);
      return {
        text: data.text.trim(),
        confidence: Math.round(data.confidence),
      };
    } finally {
      await worker.terminate();
    }
  },
};
