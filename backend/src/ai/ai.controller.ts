import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AiService, ChatMessage } from './ai.service';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() body: { messages: ChatMessage[] }) {
    const reply = await this.aiService.sendChat(body.messages);
    return { reply };
  }

  @Post('summarize')
  async summarize(@Body() body: { content: string }) {
    const summary = await this.aiService.summarize(body.content);
    return { summary };
  }

  @Post('generate-tasks')
  async generateTasks(@Body() body: { description: string }) {
    const tasks = await this.aiService.generateTasks(body.description);
    return { tasks };
  }

  @Post('learning-plan')
  async learningPlan(@Body() body: { topic: string; level?: string }) {
    const plan = await this.aiService.generateLearningPlan(body.topic, body.level);
    return { plan };
  }
}
