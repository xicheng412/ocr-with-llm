export class OCRError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'OCRError';
  }
}

export class ValidationError extends OCRError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class APIError extends OCRError {
  constructor(message: string, public statusCode?: number) {
    super(message, 'API_ERROR');
    this.name = 'APIError';
  }
}

export class FileError extends OCRError {
  constructor(message: string, public filePath?: string) {
    super(message, 'FILE_ERROR');
    this.name = 'FileError';
  }
}

export function handleError(error: unknown): never {
  if (error instanceof OCRError) {
    console.error(`${error.name}: ${error.message}`);
    if (error.code) {
      console.error(`Error Code: ${error.code}`);
    }
  } else if (error instanceof Error) {
    console.error(`Unexpected Error: ${error.message}`);
  } else {
    console.error('An unknown error occurred');
  }
  
  process.exit(1);
}