import { openai, AI_CONFIG } from '../config/ai';
import { buildSystemPrompt } from '../utils/prompts';
import { chatService } from './chat.service';
import type { Character, Conversation, Message } from '@ai-companions/shared';
import { logger } from '../utils/logger';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export class AIService {
  /**
   * Build the OpenAI messages array from conversation context
   */
  private async buildMessages(
    character: Character,
    conversation: Conversation,
    userMessage: string,
  ): Promise<ChatMessage[]> {
    const systemPrompt = buildSystemPrompt(character, conversation);
    const recentMessages = await chatService.getRecentMessages(conversation.id, 30);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of recentMessages) {
      if (msg.sender_type === 'user') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.sender_type === 'character') {
        messages.push({ role: 'assistant', content: msg.content });
      }
    }

    messages.push({ role: 'user', content: userMessage });
    return messages;
  }

  /**
   * Generate a non-streaming AI response (legacy, used by regenerate)
   */
  async generateResponse(
    character: Character,
    conversation: Conversation,
    userMessage: string,
  ): Promise<string> {
    try {
      const messages = await this.buildMessages(character, conversation, userMessage);

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.defaultModel,
        messages,
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
        presence_penalty: AI_CONFIG.presencePenalty,
        frequency_penalty: AI_CONFIG.frequencyPenalty,
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      logger.debug({
        character: character.name,
        tokens: response.usage?.total_tokens,
      }, 'AI response generated');

      return aiResponse.trim();
    } catch (err: any) {
      logger.error({ err, character: character.name }, 'AI generation failed');
      return `*${character.name} pauses for a moment* I'm sorry, I seem to have lost my train of thought. Could you say that again?`;
    }
  }

  /**
   * Generate a streaming AI response — yields text chunks via async generator
   */
  async *generateStreamingResponse(
    character: Character,
    conversation: Conversation,
    userMessage: string,
  ): AsyncGenerator<string, string, unknown> {
    let fullResponse = '';

    try {
      const messages = await this.buildMessages(character, conversation, userMessage);

      const stream = await openai.chat.completions.create({
        model: AI_CONFIG.defaultModel,
        messages,
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
        presence_penalty: AI_CONFIG.presencePenalty,
        frequency_penalty: AI_CONFIG.frequencyPenalty,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullResponse += delta;
          yield delta;
        }
      }

      logger.debug({ character: character.name }, 'Streaming response completed');
    } catch (err: any) {
      logger.error({ err, character: character.name }, 'Streaming AI generation failed');
      const fallback = `*${character.name} pauses for a moment* I'm sorry, I seem to have lost my train of thought. Could you say that again?`;
      fullResponse = fallback;
      yield fallback;
    }

    return fullResponse.trim();
  }

  /**
   * Regenerate the last AI response
   */
  async regenerateResponse(
    character: Character,
    conversation: Conversation,
  ): Promise<string> {
    const recentMessages = await chatService.getRecentMessages(conversation.id, 30);
    const lastUserMessage = [...recentMessages].reverse().find(m => m.sender_type === 'user');

    if (!lastUserMessage) {
      return `*${character.name} smiles* What would you like to talk about?`;
    }

    await chatService.deleteLastAIMessage(conversation.id);
    return this.generateResponse(character, conversation, lastUserMessage.content);
  }
}

export const aiService = new AIService();
