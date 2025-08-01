# OCR Tool

A command-line OCR tool using OpenAI-compatible APIs for text extraction from images.

## Features

- Extract text from images using OpenAI-compatible AI models
- Support for various image formats (JPEG, PNG, etc.)
- TypeScript implementation
- Command-line interface

## Prerequisites

- Node.js (v16 or higher)
- OpenAI-compatible API key (e.g., OpenAI, Gemini via OpenAI format)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ocr-test
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

## Usage

### Development Mode

```bash
npm run dev -- <image-path>
```

Example:
```bash
npm run dev -- pic_data/WechatIMG36746.jpg
```

### Production Build

1. Build the project:
   ```bash
   npm run build
   ```

2. Run the tool:
   ```bash
   npm start <image-path>
   ```

### Global Installation

After building, you can install globally:
```bash
npm install -g .
ocr-tool <image-path>
```

## Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Run in development mode with ts-node
- `npm start` - Run the built CLI tool
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
src/
├── cli.ts          # Command-line interface
├── config.ts       # Configuration management
├── errors.ts       # Error handling
├── ai-client.ts     # AI API client
├── index.ts        # Main entry point
├── ocr-tool.ts     # Core OCR functionality
├── types.ts        # TypeScript type definitions
└── validator.ts    # Input validation
```

## License

MIT