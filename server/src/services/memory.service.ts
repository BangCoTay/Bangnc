import { openai, AI_CONFIG } from '../config/ai';
import { chatService } from './chat.service';
import { supabaseAdmin } from '../config/supabase';
import type { Conversation, MemoryFact } from '@ai-companions/shared';
import { logger } from '../utils/logger';

const SUMMARY_PROMPT = `You are a memory manager for an AI companion chatbot. Given a conversation history and an optional existing summary, produce an updated rolling summary that captures the key events, emotional beats, and topics discussed.

Requirements:
- Keep it under 500 words
- Write in third person ("The user...")
- Preserve emotionally significant moments
- Note any relationship developments
- Maintain chronological flow
- If an existing summary is provided, append new information rather than rewriting from scratch

Output ONLY the summary text, no preamble.`;

const FACT_EXTRACTION_PROMPT = `You are a fact extraction system. Given a conversation between a user and an AI companion, extract key facts about the user.

Extract facts in these categories:
- Personal info (name, age, location, occupation)
- Preferences (likes, dislikes, favorites)
- Relationships (mentions of friends, family, partners)
- Goals and interests
- Emotional state and patterns
- Important events or dates mentioned

Output as a JSON array of objects with this exact schema:
[{"key": "category: label", "value": "fact detail", "confidence": 0.0-1.0}]

Only extract facts with confidence >= 0.7. Maximum 20 facts.
Output ONLY the JSON array, no markdown fences or preamble.`;

export class MemoryService {
  /**
   * Generate/update a rolling summary for a conversation
   */
  async summarizeConversation(conversation: Conversation): Promise<string> {
    try {
      const recentMessages = await chatService.getRecentMessages(conversation.id, 40);

      if (recentMessages.length < 5) {
        return conversation.memory_summary || '';
      }

      const messageTranscript = recentMessages
        .map((m) => `${m.sender_type === 'user' ? 'User' : 'AI'}: ${m.content}`)
        .join('\n');

      const userPrompt = conversation.memory_summary
        ? `Existing summary:\n${conversation.memory_summary}\n\nNew messages to incorporate:\n${messageTranscript}`
        : `Conversation to summarize:\n${messageTranscript}`;

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.defaultModel,
        messages: [
          { role: 'system', content: SUMMARY_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 600,
        temperature: 0.3,
      });

      const summary = response.choices[0]?.message?.content?.trim();
      if (!summary) throw new Error('No summary generated');

      logger.info({ conversationId: conversation.id }, 'Memory summary updated');
      return summary;
    } catch (err) {
      logger.error({ err, conversationId: conversation.id }, 'Memory summarization failed');
      return conversation.memory_summary || '';
    }
  }

  /**
   * Extract structured facts about the user from the conversation
   */
  async extractFacts(conversation: Conversation): Promise<MemoryFact[]> {
    try {
      const recentMessages = await chatService.getRecentMessages(conversation.id, 40);
      const userMessages = recentMessages.filter((m) => m.sender_type === 'user');

      if (userMessages.length < 3) {
        return conversation.memory_facts || [];
      }

      const messageTranscript = recentMessages
        .map((m) => `${m.sender_type === 'user' ? 'User' : 'AI'}: ${m.content}`)
        .join('\n');

      const existingFacts = (conversation.memory_facts || [])
        .map((f) => `- ${f.key}: ${f.value}`)
        .join('\n');

      const userPrompt = existingFacts
        ? `Known facts:\n${existingFacts}\n\nRecent conversation:\n${messageTranscript}\n\nExtract any NEW facts not already known. Merge with existing facts and output the combined list.`
        : `Conversation:\n${messageTranscript}`;

      const response = await openai.chat.completions.create({
        model: AI_CONFIG.defaultModel,
        messages: [
          { role: 'system', content: FACT_EXTRACTION_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) throw new Error('No facts extracted');

      // Parse JSON — handle potential markdown fences
      const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      const facts: MemoryFact[] = JSON.parse(jsonStr);

      // Validate and filter
      const validFacts = facts
        .filter((f) => f.key && f.value && typeof f.confidence === 'number' && f.confidence >= 0.7)
        .slice(0, 20);

      logger.info({ conversationId: conversation.id, factCount: validFacts.length }, 'Facts extracted');
      return validFacts;
    } catch (err) {
      logger.error({ err, conversationId: conversation.id }, 'Fact extraction failed');
      return conversation.memory_facts || [];
    }
  }

  /**
   * Persist updated memory to the database
   */
  async updateMemory(
    conversationId: string,
    summary: string,
    facts: MemoryFact[],
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('conversations')
      .update({
        memory_summary: summary,
        memory_facts: facts,
      })
      .eq('id', conversationId);

    if (error) {
      logger.error({ error, conversationId }, 'Failed to persist memory');
    }
  }

  /**
   * Run full memory update pipeline (summary + facts) — call asynchronously
   */
  async processMemory(conversation: Conversation): Promise<void> {
    const [summary, facts] = await Promise.all([
      this.summarizeConversation(conversation),
      this.extractFacts(conversation),
    ]);

    await this.updateMemory(conversation.id, summary, facts);
  }
}

export const memoryService = new MemoryService();
