import { GeminiClient } from './gemini-client';
import { OCROptions, OCRResult } from './types';
import { Validator } from './validator';
import { ValidationError, OCRError } from './errors';
import { ConfigManager } from './config';
import * as path from 'path';

export class OCRTool {
  private client: GeminiClient;

  constructor(apiKey: string, model?: string, baseURL?: string) {
    this.client = new GeminiClient({ 
      apiKey, 
      model: ConfigManager.getModel(model),
      baseURL: ConfigManager.getBaseURL(baseURL)
    });
  }

  async processImage(options: OCROptions): Promise<OCRResult> {
    // Validate all options
    Validator.validateApiKey(options.apiKey);
    Validator.validateImagePath(options.imagePath);

    // Resolve absolute path
    const absolutePath = path.resolve(options.imagePath);
    
    // Perform OCR
    const result = await this.client.performOCR(absolutePath, options.prompt);
    
    return result;
  }

  async processMultipleImages(imagesPaths: string[], prompt?: string): Promise<OCRResult[]> {
    const results: OCRResult[] = [];
    
    for (const imagePath of imagesPaths) {
      try {
        // Resolve absolute path
        const absolutePath = path.resolve(imagePath);
        
        // Validate image path
        Validator.validateImagePath(absolutePath);
        
        // Perform OCR using the configured client
        const result = await this.client.performOCR(absolutePath, prompt);
        results.push(result);
      } catch (error) {
        // Continue processing other images even if one fails
        const errorMessage = error instanceof OCRError 
          ? error.message 
          : `Unknown error: ${error instanceof Error ? error.message : 'Unknown'}`;
          
        results.push({
          text: `Error processing ${imagePath}: ${errorMessage}`,
          confidence: 0
        });
      }
    }
    
    return results;
  }

  static getSupportedFormats(): string[] {
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
  }
}