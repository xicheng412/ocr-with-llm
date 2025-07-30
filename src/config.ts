import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env'), debug: false });

export interface AppConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
}

export class ConfigManager {
  /**
   * Get configuration from environment variables with fallback to defaults
   */
  static getConfig(): AppConfig {
    return {
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    };
  }

  /**
   * Get API key with priority: parameter > env var
   */
  static getApiKey(provided?: string): string {
    const apiKey = provided || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('API key is required. Use --api-key option or set OPENAI_API_KEY environment variable.');
    }
    return apiKey;
  }

  /**
   * Get base URL with priority: parameter > env var > default
   */
  static getBaseURL(provided?: string): string | undefined {
    return provided || process.env.OPENAI_BASE_URL;
  }

  /**
   * Get model with priority: parameter > env var > default
   */
  static getModel(provided?: string): string {
    return provided || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  /**
   * Check if all required environment variables are set
   */
  static validateEnvironment(): { isValid: boolean; missing: string[] } {
    const missing: string[] = [];
    
    if (!process.env.OPENAI_API_KEY) {
      missing.push('OPENAI_API_KEY');
    }

    return {
      isValid: missing.length === 0,
      missing
    };
  }
}