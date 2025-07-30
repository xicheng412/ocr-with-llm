# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Build and Development
- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm run dev -- <image-path>` - Run in development mode with ts-node
- `npm start <image-path>` - Run the built CLI tool
- `npm run typecheck` - Run TypeScript type checking without emitting files
- `npm run lint` - Run ESLint on TypeScript files

### Testing
- `npm test` - Run Jest tests

## Project Architecture

This is a command-line OCR tool that uses Google Gemini AI (via OpenAI-compatible API) to extract text from images with advanced intent analysis capabilities.

### Core Components

**OCRTool** (`src/ocr-tool.ts`) - Main orchestrator class that coordinates image processing
- `processImage()` - Basic OCR extraction 
- `processImageWithIntentAnalysis()` - Advanced OCR with handwriting modification analysis
- `processMultipleImages()` - Batch processing capability

**GeminiClient** (`src/gemini-client.ts`) - API client for Google Gemini
- Handles OpenAI-compatible API calls to Gemini
- Contains sophisticated prompts for intent analysis of handwritten modifications
- Supports both basic OCR and complex document structure analysis

**CLI Interface** (`src/cli.ts`) - Commander.js-based command-line interface
- `extract` command with various options (API key, model, output format, etc.)
- `analyze` command for intent analysis
- JSON and text output formats

### Configuration System

**ConfigManager** (`src/config.ts`) - Centralized configuration management
- Loads from .env file and environment variables
- Priority: CLI arguments > env vars > defaults
- Default model: `gpt-4o-mini`
- Environment variables: `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`

### Type System

The project has extensive TypeScript interfaces for:
- **IntentAnalysisResult** - Complex structure for analyzing handwritten document modifications
- **EditOperation** - Represents different types of text modifications (delete, insert, replace, etc.)
- **SemanticAnalysis** - Document type and structure analysis
- **ModificationAnalysis** - Detailed breakdown of document changes

### Input Validation

**Validator** (`src/validator.ts`) - Comprehensive input validation
- API key format validation
- Image file existence and format checking
- Path resolution and access validation
- Model name validation

### Error Handling

**Error Classes** (`src/errors.ts`) - Custom error types
- `ValidationError` - Input validation failures
- `APIError` - API communication issues  
- `FileError` - File system operation failures
- `OCRError` - OCR processing failures

## Special Features

### Intent Analysis
The tool can analyze handwritten modifications in documents, identifying:
- Deletion marks (strikethrough, crossing out)
- Insertion markers (^, arrows, carets)
- Replacement operations (crossed out + new text)
- Structural reorganization (brackets, numbering)
- Semantic corrections and improvements

This analysis produces structured output with operations, confidence levels, and final reconstructed text.

## API Integration Notes

- Uses OpenAI-compatible API format to communicate with Google Gemini
- Supports custom base URLs for different API providers
- Image processing via Sharp library for optimization
- Base64 encoding for image transmission to API