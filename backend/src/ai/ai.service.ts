import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

@Injectable()
export class AiService {
 private readonly MODEL = 'gemini-2.0-flash';
private readonly BASE_URL = 'https://generativelanguage.googleapis.com/v1/models';

  constructor(private readonly config: ConfigService) {}

  private getApiKey(): string {
    const key = this.config.get<string>('GEMINI_API_KEY');
    if (!key) throw new BadRequestException('GEMINI_API_KEY is not configured');
    return key;
  }

  private async generate(prompt: string, systemInstruction?: string): Promise<string> {
    const apiKey = this.getApiKey();

    const body = {
      contents: [
        ...(systemInstruction
          ? [{ role: 'user', parts: [{ text: systemInstruction }] }]
          : []),
        { role: 'user', parts: [{ text: prompt }] },
      ],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    };

    const res = await fetch(`${this.BASE_URL}/${this.MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: { message?: string } };
      throw new BadRequestException(err?.error?.message ?? 'Gemini API error');
    }

    const data = (await res.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };

    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  private async chat(messages: ChatMessage[]): Promise<string> {
    const apiKey = this.getApiKey();

    const contents = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'You are a helpful productivity assistant for a developer life OS app. Be concise and practical.',
            },
          ],
        },
        ...contents,
      ],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    };

    const res = await fetch(`${this.BASE_URL}/${this.MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: { message?: string } };
      throw new BadRequestException(err?.error?.message ?? 'Gemini API error');
    }

    const data = (await res.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };

    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  async sendChat(messages: ChatMessage[]): Promise<string> {
    return this.chat(messages);
  }

  async summarize(content: string): Promise<string> {
    return this.generate(
      `Summarize the following note content in 3-5 bullet points. Be concise:\n\n${content}`,
      'You are a helpful assistant that summarizes notes clearly and concisely.',
    );
  }

  async generateTasks(description: string): Promise<string> {
    return this.generate(
      `Break down the following goal or project into actionable tasks. Format as a numbered list with a brief description for each task:\n\n${description}`,
      'You are a productivity assistant. Generate clear, actionable tasks.',
    );
  }

  async generateLearningPlan(topic: string, level = 'beginner'): Promise<string> {
    return this.generate(
      `Create a structured learning plan for "${topic}" at ${level} level. Include: key concepts to learn, recommended resources, and a rough timeline. Be practical and specific.`,
      'You are a learning coach who creates practical study plans for developers.',
    );
  }
}