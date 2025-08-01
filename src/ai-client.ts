import { AIConfig, OCRResult, IntentAnalysisResult } from './types';
import { APIError, FileError } from './errors';
import { Validator } from './validator';
import * as fs from 'fs';

export class AIClient {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(config: AIConfig) {
    Validator.validateApiKey(config.apiKey);
    Validator.validateModel(config.model);
    
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
    this.model = config.model || 'gpt-4o-mini';
  }

  async performOCRWithIntentAnalysis(imagePath: string): Promise<OCRResult> {
    const intentPrompt = `
请按以下步骤分析和整理手写文书图片：

## 第一步：手写标识符意图解析
仔细识别画面中的各种手写修改标记：

### 文字修改标记
- **删除标记**：划线、涂黑、打叉表示删除的内容
- **插入标记**：^符号、∧符号、箭头指向的插入位置
- **替换标记**：划掉原文+在旁边/上方写新内容
- **移位标记**：圆圈+数字、字母标记的前后调换位置

### 结构调整标记  
- **段落重组**：大括号、方框圈定的内容块移动
- **顺序调整**：①②③或A、B、C标记的重新排序
- **层级调整**：缩进线、层级箭头表示的结构变化

### 指向关系标记
- **箭头指向**：→ ↑ ↓ ↖ ↗等箭头的具体指向位置
- **连接线**：实线、虚线连接的相关内容
- **引用标记**：见、参考、如上等文字指向

### 补充说明标记
- **旁注内容**：页边、行间的补充文字
- **强调标记**：下划线、波浪线、圆圈重点标注
- **疑问标记**：？号、待定等不确定内容

## 第二步：语义思考与意图推断
结合文本语义内容深度分析修改意图：

### 语义一致性检查
- **上下文连贯**：修改是否符合前后文的逻辑关系
- **语法正确性**：修改后是否符合语法规则
- **语义完整性**：修改是否破坏了原文的完整表达
- **术语一致性**：专业术语、人名、地名的统一性

### 意图推断优先级
1. **明确标记** + **语义合理** = 执行修改
2. **模糊标记** + **语义推断** = 选择语义上最合理的解释
3. **冲突标记** + **语义判断** = 优先选择语义连贯的版本
4. **缺失标记** + **语义补全** = 基于语义推断可能的修改意图

### 语义驱动的修改决策
- 当手写标记不清晰时，优先考虑语义合理性
- 当存在多种解释可能时，选择语义上最符合文档目的的版本
- 识别并修正可能的语义错误（如错别字、语法错误）
- 保持专业术语和关键概念的准确性

## 第三步：修改意图执行
按照识别出的修改意图和语义分析重构文本：

1. **先处理删除**：移除所有标记为删除且语义上冗余的内容
2. **执行替换**：用新内容替换标记的旧内容，确保语义连贯
3. **处理插入**：在箭头等指向位置插入新内容，保持语义完整
4. **调整顺序**：按标记重新排列段落、句子顺序，优化逻辑流程
5. **整合旁注**：将边注、补充说明合理融入正文，增强语义表达
6. **语义优化**：确保修改后内容逻辑连贯、表达清晰

## 第四步：文本重组输出
基于修改意图和语义分析生成最终文本，按照以下JSON格式输出结果：
{
  "original_text": "原始文字内容（包括所有可识别文字）",
  "semantic_analysis": {
    "document_type": "文档类型判断",
    "main_theme": "文档主题",
    "key_concepts": ["关键概念1", "关键概念2"],
    "logical_structure": "逻辑结构描述"
  },
  "modification_analysis": {
    "deletions": ["被删除的内容1", "被删除的内容2"],
    "insertions": [{"position": "插入位置描述", "content": "插入内容", "semantic_reason": "语义原因"}],
    "replacements": [{"old": "原内容", "new": "新内容", "semantic_reason": "语义原因"}],
    "repositions": [{"content": "移动的内容", "from": "原位置", "to": "新位置", "semantic_reason": "语义原因"}],
    "annotations": ["旁注内容1", "旁注内容2"],
    "uncertain_items": ["不确定的修改意图"],
    "semantic_corrections": ["基于语义推断的修正"]
  },
  "operations": [
    {
      "type": "delete|insert|replace|swap|modify|annotate|semantic_correct",
      "target": "操作的文字",
      "new_content": "新内容（如果适用）", 
      "position": "在文本中的位置描述",
      "intent": "修改意图说明",
      "semantic_justification": "语义合理性说明"
    }
  ],
  "final_text": "应用所有编辑操作后的最终文字",
  "semantic_quality_check": {
    "coherence": "连贯性评估",
    "completeness": "完整性评估", 
    "accuracy": "准确性评估"
  }
}

## 特别注意
- **语义优先**：当物理标记与语义合理性冲突时，优先考虑语义合理性
- **上下文理解**：充分理解文档的整体背景和目的
- **专业性保持**：维护专业术语和技术表达的准确性
- **逻辑连贯**：确保修改后的文本在逻辑上前后一致
- **意图推断**：对模糊或缺失的修改标记进行合理的语义推断
- 手写字迹可能潦草，优先理解修改意图而非逐字识别
- 修改标记可能不规范，需要根据语义和上下文推断真实意图
- 如果修改冲突或矛盾，选择语义上最合理和逻辑最连贯的版本
- 对难以确定的修改意图在uncertain_items中标注，并提供语义推断
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