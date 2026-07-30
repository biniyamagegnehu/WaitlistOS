import { HttpException, HttpStatus } from '@nestjs/common';

export class HuggingFaceUnavailableException extends HttpException {
  constructor(message: string = 'Hugging Face API is unavailable') {
    super(message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class InvalidModelResponseException extends HttpException {
  constructor(message: string = 'Invalid response from AI model') {
    super(message, HttpStatus.BAD_GATEWAY);
  }
}

export class InvalidJsonException extends HttpException {
  constructor(message: string = 'AI model returned invalid JSON format') {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

export class MissingApiKeyException extends HttpException {
  constructor(message: string = 'Hugging Face API key is missing') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class RateLimitExceededException extends HttpException {
  constructor(message: string = 'AI provider rate limit exceeded') {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
