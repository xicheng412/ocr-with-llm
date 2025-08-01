export interface EditOperation {
  type: 'delete' | 'insert' | 'replace' | 'swap' | 'modify' | 'annotate' | 'semantic_correct';
  target: string;
  new_content?: string;
  position: string;
  intent?: string;
  semantic_justification?: string;
}

export interface SemanticAnalysis {
  document_type: string;
  main_theme: string;
  key_concepts: string[];
  logical_structure: string;
}

export interface ModificationAnalysis {
  deletions: string[];
  insertions: Array<{position: string; content: string; semantic_reason?: string}>;
  replacements: Array<{old: string; new: string; semantic_reason?: string}>;
  repositions: Array<{content: string; from: string; to: string; semantic_reason?: string}>;
  annotations: string[];
  uncertain_items: string[];
  semantic_corrections?: string[];
}

export interface SemanticQualityCheck {
  coherence: string;
  completeness: string;
  accuracy: string;
}

export interface IntentAnalysisResult {
  original_text: string;
  semantic_analysis?: SemanticAnalysis;
  modification_analysis?: ModificationAnalysis;
  operations: EditOperation[];
  final_text: string;
  semantic_quality_check?: SemanticQualityCheck;
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

export interface AIConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
}