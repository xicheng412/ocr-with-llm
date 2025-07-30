export interface EditOperation {
  type: 'delete' | 'insert' | 'replace' | 'swap' | 'modify';
  target: string;
  new_content?: string;
  position: string;
}

export interface IntentAnalysisResult {
  original_text: string;
  operations: EditOperation[];
  final_text: string;
}

export interface OCRResult {
  text: string;
  confidence?: number;
  language?: string;
  intentAnalysis?: IntentAnalysisResult;
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