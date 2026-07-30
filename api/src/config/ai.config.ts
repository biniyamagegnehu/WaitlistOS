import { registerAs } from '@nestjs/config';

export const aiConfig = registerAs('ai', () => ({
  huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY,
  model: process.env.AI_MODEL || 'Qwen/Qwen2.5-Coder-32B-Instruct',
}));
