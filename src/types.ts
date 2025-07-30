export interface OCRResult {
  text: string;
  confidence?: number;
  language?: string;
}

export interface OCROptions {
  apiKey: string;
  imagePath: string;
  prompt?: string;
}

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
}