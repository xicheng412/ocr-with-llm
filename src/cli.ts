#!/usr/bin/env node

import { Command } from 'commander';
import { OCRTool } from './ocr-tool';
import { handleError } from './errors';
import { Validator } from './validator';
import { ConfigManager } from './config';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('ocr-tool')
  .description('OCR tool using OpenAI compatible API')
  .version('1.0.0');

program
  .command('extract')
  .description('Extract text from an image using OCR')
  .argument('<image-path>', 'Path to the image file')
  .option('-k, --api-key <key>', 'OpenAI compatible API key')
  .option('-p, --prompt <prompt>', 'Custom prompt for OCR extraction')
  .option('-o, --output <file>', 'Output file path (optional)')
  .option('-m, --model <model>', 'Model to use (default: gpt-4o-mini)')
  .option('-u, --base-url <url>', 'Custom base URL for API')
  .option('-j, --json', 'Output result in JSON format')
  .action(async (imagePath: string, options: any) => {
    try {
      // Get configuration with priority: CLI options > env vars > defaults
      const apiKey = ConfigManager.getApiKey(options.apiKey);
      const model = ConfigManager.getModel(options.model);
      const baseURL = ConfigManager.getBaseURL(options.baseUrl);

      // Validate inputs before processing
      Validator.validateApiKey(apiKey);
      Validator.validateImagePath(imagePath);
      Validator.validateModel(model);
      
      if (options.output) {
        Validator.validateOutputPath(options.output);
      }

      if (!options.json) {
        console.log(`Processing image: ${imagePath}`);
        console.log(`Using model: ${model}`);
      }
      
      // Initialize OCR tool
      const ocrTool = new OCRTool(apiKey, model, baseURL);
      
      // Process the image
      const result = await ocrTool.processImage({
        apiKey,
        imagePath,
        prompt: options.prompt
      });

      // Output results
      if (options.json) {
        // Output in JSON format
        const jsonResult = {
          success: true,
          image_path: imagePath,
          model: model,
          result: result
        };
        
        if (options.output) {
          // Write JSON to file
          fs.writeFileSync(options.output, JSON.stringify(jsonResult, null, 2));
          console.log(`JSON result saved to: ${options.output}`);
        } else {
          // Print JSON to console
          console.log(JSON.stringify(jsonResult, null, 2));
        }
      } else if (options.output) {
        // Write to file
        fs.writeFileSync(options.output, result.text);
        console.log(`Text extracted and saved to: ${options.output}`);
      } else {
        // Print to console
        console.log('\n--- Extracted Text ---');
        console.log(result.text);
        console.log('--- End ---\n');
      }

    } catch (error) {
      handleError(error);
    }
  });

program
  .command('batch')
  .description('Extract text from multiple images')
  .argument('<images...>', 'Paths to image files')
  .option('-k, --api-key <key>', 'OpenAI compatible API key')
  .option('-p, --prompt <prompt>', 'Custom prompt for OCR extraction')
  .option('-o, --output-dir <dir>', 'Output directory for text files')
  .option('-m, --model <model>', 'Model to use (default: gpt-4o-mini)')
  .option('-u, --base-url <url>', 'Custom base URL for API')
  .action(async (images: string[], options: any) => {
    try {
      // Get configuration with priority: CLI options > env vars > defaults
      const apiKey = ConfigManager.getApiKey(options.apiKey);
      const model = ConfigManager.getModel(options.model);
      const baseURL = ConfigManager.getBaseURL(options.baseUrl);

      // Validate inputs
      Validator.validateApiKey(apiKey);
      Validator.validateModel(model);
      
      // Validate all image paths
      for (const imagePath of images) {
        Validator.validateImagePath(imagePath);
      }
      
      if (options.outputDir && !fs.existsSync(options.outputDir)) {
        fs.mkdirSync(options.outputDir, { recursive: true });
      }

      console.log(`Processing ${images.length} images...`);
      console.log(`Using model: ${model}`);
      
      // Initialize OCR tool
      const ocrTool = new OCRTool(apiKey, model, baseURL);
      
      // Process all images
      const results = await ocrTool.processMultipleImages(images, options.prompt);

      // Output results
      for (let i = 0; i < images.length; i++) {
        const imagePath = images[i];
        const result = results[i];
        
        console.log(`\n--- ${path.basename(imagePath)} ---`);
        console.log(result.text);
        
        if (options.outputDir) {
          // Generate output filename
          const imageBaseName = path.parse(imagePath).name;
          const outputPath = path.join(options.outputDir, `${imageBaseName}.txt`);
          
          // Write to file
          fs.writeFileSync(outputPath, result.text);
          console.log(`Saved to: ${outputPath}`);
        }
      }

    } catch (error) {
      handleError(error);
    }
  });

program
  .command('analyze')
  .description('Analyze text editing intentions in an image (detect insertions, deletions, replacements, etc.)')
  .argument('<image-path>', 'Path to the image file')
  .option('-k, --api-key <key>', 'OpenAI compatible API key')
  .option('-o, --output <file>', 'Output file path (optional)')
  .option('-m, --model <model>', 'Model to use (default: gpt-4o-mini)')
  .option('-u, --base-url <url>', 'Custom base URL for API')
  .action(async (imagePath: string, options: any) => {
    try {
      // Get configuration with priority: CLI options > env vars > defaults
      const apiKey = ConfigManager.getApiKey(options.apiKey);
      const model = ConfigManager.getModel(options.model);
      const baseURL = ConfigManager.getBaseURL(options.baseUrl);

      // Validate inputs before processing
      Validator.validateApiKey(apiKey);
      Validator.validateImagePath(imagePath);
      Validator.validateModel(model);
      
      if (options.output) {
        Validator.validateOutputPath(options.output);
      }

      console.log(`Analyzing editing intentions in image: ${imagePath}`);
      console.log(`Using model: ${model}`);
      
      // Initialize OCR tool
      const ocrTool = new OCRTool(apiKey, model, baseURL);
      
      // Process the image with intent analysis
      const result = await ocrTool.processImageWithIntentAnalysis({
        apiKey,
        imagePath
      });

      // Output results
      if (options.output) {
        // Write to file
        fs.writeFileSync(options.output, result.text);
        console.log(`Analysis results saved to: ${options.output}`);
      } else {
        // Print to console
        console.log('\n--- Editing Intention Analysis ---');
        console.log(result.text);
        console.log('--- End ---\n');
      }

    } catch (error) {
      handleError(error);
    }
  });

program
  .command('formats')
  .description('List supported image formats')
  .action(() => {
    console.log('Supported image formats:');
    OCRTool.getSupportedFormats().forEach(format => {
      console.log(`  ${format}`);
    });
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
  process.exit(1);
});

// Print current model when starting in dev mode
if (process.env.NODE_ENV !== 'production') {
  const currentModel = ConfigManager.getModel();
  console.log(`🚀 Development mode - Using model: ${currentModel}`);
}

// Parse command line arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}