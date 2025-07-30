import { GeminiConfig, OCRResult } from './types';
import { APIError, FileError } from './errors';
import { Validator } from './validator';
import * as fs from 'fs';

export class GeminiClient {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(config: GeminiConfig) {
    Validator.validateApiKey(config.apiKey);
    Validator.validateModel(config.model);
    
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
    this.model = config.model || 'gpt-4o-mini';
  }

  async performOCR(imagePath: string, prompt?: string): Promise<OCRResult> {
    try {
      // Validate image path
      Validator.validateImagePath(imagePath);

      // Read image file
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);

      // Default OCR prompt
      const defaultPrompt = 'Extract all text from this image. Return only the text content without any additional formatting or explanations.';
      const finalPrompt = prompt || defaultPrompt;

      // Prepare OpenAI API request
      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: finalPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000
      };

      // Make API request
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json() as any;
      const text = data.choices?.[0]?.message?.content?.trim() || '';

      return {
        text: text,
        confidence: undefined, // OpenAI doesn't provide confidence scores
        language: undefined,   // Could be detected separately if needed
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('API key')) {
        throw new APIError(`Invalid API key or API error: ${error.message}`);
      }
      if (error instanceof Error && error.message.includes('quota')) {
        throw new APIError('API quota exceeded. Please check your billing and usage limits.');
      }
      throw new APIError(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getMimeType(filePath: string): string {
    const extension = filePath.toLowerCase().split('.').pop();
    const mimeTypes: { [key: string]: string } = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
    };
    
    return mimeTypes[extension || ''] || 'image/jpeg';
  }
}