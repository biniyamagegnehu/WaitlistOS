import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { EngagementService } from './src/modules/engagement/engagement.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const engagementService = app.get(EngagementService);
  
  console.log('Manually triggering engagement evaluation...');
  await engagementService.evaluateAllParticipants();
  console.log('Evaluation complete.');
  
  await app.close();
}

bootstrap().catch(console.error);
