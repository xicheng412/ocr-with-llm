import { GeminiConfig, OCRResult, IntentAnalysisResult } from './types';
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

  async performOCRWithIntentAnalysis(imagePath: string): Promise<OCRResult> {
    const intentPrompt = `
分析这张图片中的文字编辑操作，按照以下步骤进行：

1. 首先识别图片中所有的文字内容
2. 识别图片中的编辑标记（如删除线、插入符号、替换箭头、交换标记等）
3. 分析每个编辑标记的意图：
   - 删除操作：文字被划掉或标记删除
   - 插入操作：有插入符号或新增文字
   - 替换操作：旧文字被新文字替代
   - 交换操作：两个文字或短语位置互换
   - 修改操作：文字被修正或改写

4. 按照以下JSON格式输出结果：
{
  "original_text": "原始文字内容",
  "operations": [
    {
      "type": "delete|insert|replace|swap|modify",
      "target": "被操作的文字",
      "new_content": "新内容（如果适用）",
      "position": "在文本中的位置描述"
    }
  ],
  "final_text": "应用所有编辑操作后的最终文字"
}

请仔细分析图片中的每个编辑标记，确保准确识别操作意图。
`;

    return this.performOCR(imagePath, intentPrompt);
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

      // Try to parse JSON response for intent analysis
      let intentAnalysis: IntentAnalysisResult | undefined;
      if (prompt && prompt.includes('JSON格式输出')) {
        try {
          // Look for JSON content in the response
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[0]);
            if (parsedData.original_text && parsedData.operations && parsedData.final_text) {
              intentAnalysis = parsedData as IntentAnalysisResult;
            }
          }
        } catch (error) {
          // If JSON parsing fails, continue with plain text
          console.warn('Failed to parse JSON response:', error);
        }
      }

      return {
        text: intentAnalysis ? intentAnalysis.final_text : text,
        confidence: undefined, // OpenAI doesn't provide confidence scores
        language: undefined,   // Could be detected separately if needed
        intentAnalysis: intentAnalysis,
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