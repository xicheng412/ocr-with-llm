import * as fs from 'fs';
import * as path from 'path';
import { ValidationError, FileError } from './errors';

export class Validator {
  static validateApiKey(apiKey: string): void {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new ValidationError('API key cannot be empty');
    }
    
    // Allow various API key formats for different providers
    if (apiKey.length < 10) {
      throw new ValidationError('API key appears to be too short');
    }
  }

  static validateImagePath(imagePath: string): void {
    if (!imagePath || imagePath.trim().length === 0) {
      throw new ValidationError('Image path cannot be empty');
    }

    const absolutePath = path.resolve(imagePath);
    
    if (!fs.existsSync(absolutePath)) {
      throw new FileError(`Image file not found: ${absolutePath}`, absolutePath);
    }

    const stats = fs.statSync(absolutePath);
    if (!stats.isFile()) {
      throw new FileError(`Path is not a file: ${absolutePath}`, absolutePath);
    }

    // Check file size (limit to 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (stats.size > maxSize) {
      throw new FileError(`Image file too large: ${Math.round(stats.size / 1024 / 1024)}MB. Maximum size is 20MB`, absolutePath);
    }

    // Check file extension
    const supportedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
    const extension = path.extname(absolutePath).toLowerCase();
    
    if (!supportedExtensions.includes(extension)) {
      throw new ValidationError(`Unsupported file format: ${extension}. Supported formats: ${supportedExtensions.join(', ')}`);
    }
  }

  static validateOutputPath(outputPath: string): void {
    const directory = path.dirname(outputPath);
    
    if (!fs.existsSync(directory)) {
      throw new FileError(`Output directory does not exist: ${directory}`, directory);
    }

    // Check if directory is writable
    try {
      fs.accessSync(directory, fs.constants.W_OK);
    } catch {
      throw new FileError(`Output directory is not writable: ${directory}`, directory);
    }
  }

  static validateModel(model?: string): void {
    // Allow any model name to support various API providers
    return;
  }
}