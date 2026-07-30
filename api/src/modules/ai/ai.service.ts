import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HfInference } from '@huggingface/inference';
import { PrismaService } from '../../prisma/prisma.service';
import {
  HuggingFaceUnavailableException,
  InvalidJsonException,
  InvalidModelResponseException,
  MissingApiKeyException,
  RateLimitExceededException,
} from './exceptions/ai.exceptions';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private hf: HfInference;
  private readonly model: string;
  private readonly provider = 'huggingface';

  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('ai.huggingfaceApiKey');
    if (!apiKey) {
      throw new MissingApiKeyException();
    }
    this.hf = new HfInference(apiKey);
    this.model = this.configService.get<string>('ai.model') || 'Qwen/Qwen3-30B-A3B-Instruct-2507';
  }

  /**
   * Generates a text response from the AI model.
   * 
   * @param prompt The prompt to send to the model
   * @param feature The name of the feature invoking this generation (for logging)
   * @param userId The ID of the user requesting the generation (optional, for rate-limiting & tracking)
   */
  async generate(prompt: string, feature: string = 'general', userId?: string): Promise<string> {
    try {
      // Future Foundation: Check Rate Limits here
      // await this.checkRateLimit(userId, feature);

      const response = await this.hf.chatCompletion({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.7,
      });

      const resultText = response.choices?.[0]?.message?.content;

      if (!resultText) {
        throw new InvalidModelResponseException();
      }

      // Log generation asynchronously so it doesn't block
      this.logGeneration(userId, feature, prompt, resultText).catch((err) =>
        this.logger.error('Failed to log AI generation', err),
      );

      return resultText;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Generates a structured JSON response from the AI model.
   * 
   * @param prompt The prompt to send to the model
   * @param feature The name of the feature invoking this generation (for logging)
   * @param userId The ID of the user requesting the generation (optional)
   */
  async generateJson<T>(prompt: string, feature: string = 'general-json', userId?: string): Promise<T> {
    const jsonInstruction = `\n\nReturn the response ONLY as a valid JSON object. Do not include markdown formatting like \`\`\`json.`;
    const fullPrompt = prompt + jsonInstruction;

    const resultText = await this.generate(fullPrompt, feature, userId);

    try {
      const parsed = JSON.parse(resultText);
      return parsed as T;
    } catch (error) {
      this.logger.error(`Failed to parse AI JSON response: ${resultText}`);
      throw new InvalidJsonException();
    }
  }

  /**
   * Health check to verify Hugging Face connectivity and configuration.
   */
  async checkHealth(): Promise<{ provider: string; model: string; status: string }> {
    return {
      provider: this.provider,
      model: this.model,
      status: 'ok',
    };
  }

  /**
   * Internal method to track all AI usage.
   */
  private async logGeneration(
    userId: string | undefined,
    feature: string,
    prompt: string,
    response: string,
  ): Promise<void> {
    await this.prismaService.aiLog.create({
      data: {
        userId,
        feature,
        prompt,
        response,
        provider: this.provider,
        model: this.model,
      },
    });
  }

  /**
   * Internal error handler to map standard errors to custom exceptions.
   */
  private handleError(error: any): never {
    this.logger.error('AI Generation Error', error.stack || error);

    if (error.message?.includes('Rate limit')) {
      throw new RateLimitExceededException();
    }

    if (error instanceof InvalidModelResponseException) {
      throw error;
    }

    throw new HuggingFaceUnavailableException(error.message);
  }
}
