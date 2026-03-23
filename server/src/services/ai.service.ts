import { openai, AI_CONFIG } from '../config/ai';
import { buildSystemPrompt } from '../utils/prompts';
import { chatService } from './chat.service';
import type { Character, Conversation, Message } from '@ai-companions/shared';
import { logger } from '../utils/logger';

export class AIService {
  /**
   * Generate an AI response for a conversation
   */
  async generateResponse(
    character: Character,
    conversation: Conversation,
    userMessage: string,
  ): Promise<string> {
    try {
      // Build system prompt
      const systemPrompt = buildSystemPrompt(character, conversation);

      // Get recent messages for context
      const recentMessages = await chatService.getRecentMessages(conversation.id, 30);

      // Build message array for OpenAI
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ];

      // Add recent messages
      for (const msg of recentMessages) {
        if (msg.sender_type === 'user') {
          messages.push({ role: 'user', content: msg.content });
        } else if (msg.sender_type === 'character') {
          messages.push({ role: 'assistant', content: msg.content });
        }
      }

      // Add new user message
      messages.push({ role: 'user', content: userMessage });

      // Call OpenAI
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
      
      // Return a fallback in-character response
      return `*${character.name} pauses for a moment* I'm sorry, I seem to have lost my train of thought. Could you say that again?`;
    }
  }

  /**
   * Regenerate the last AI response
   */
  async regenerateResponse(
    character: Character,
    conversation: Conversation,
  ): Promise<string> {
    // Get the last user message
    const recentMessages = await chatService.getRecentMessages(conversation.id, 30);
    const lastUserMessage = [...recentMessages].reverse().find(m => m.sender_type === 'user');

    if (!lastUserMessage) {
      return `*${character.name} smiles* What would you like to talk about?`;
    }

    // Delete the last AI message
    await chatService.deleteLastAIMessage(conversation.id);

    // Generate a new response
    return this.generateResponse(character, conversation, lastUserMessage.content);
  }
}

export const aiService = new AIService();
