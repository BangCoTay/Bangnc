import { supabaseAdmin } from '../config/supabase';
import { aiService } from './ai.service';
import { chatService } from './chat.service';
import type { Character, Conversation } from '@ai-companions/shared';
import { logger } from '../utils/logger';

export class GroupService {
  /**
   * Create a group conversation with multiple AI characters
   */
  async createGroupConversation(userId: string, characterIds: string[]): Promise<Conversation> {
    if (characterIds.length < 2 || characterIds.length > 5) {
      throw new Error('Group must have 2-5 characters');
    }

    // Use the first character as the "primary" for the conversations table
    const primaryCharId = characterIds[0];

    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        user_id: userId,
        character_id: primaryCharId,
        is_group: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Link all characters to the group
    const links = characterIds.map((charId) => ({
      conversation_id: conversation!.id,
      character_id: charId,
    }));

    await supabaseAdmin.from('group_conversation_characters').insert(links);

    logger.info({ userId, groupId: conversation!.id, characterCount: characterIds.length }, 'Group created');
    return conversation as Conversation;
  }

  /**
   * Get all characters in a group conversation
   */
  async getGroupCharacters(conversationId: string): Promise<Character[]> {
    const { data, error } = await supabaseAdmin
      .from('group_conversation_characters')
      .select('character:characters(*)')
      .eq('conversation_id', conversationId);

    if (error) throw error;
    return (data || []).map((r: any) => r.character).filter(Boolean) as Character[];
  }

  /**
   * Add a character to an existing group
   */
  async addCharacter(conversationId: string, characterId: string): Promise<void> {
    const characters = await this.getGroupCharacters(conversationId);
    if (characters.length >= 5) {
      throw new Error('Group already has maximum 5 characters');
    }

    await supabaseAdmin.from('group_conversation_characters').insert({
      conversation_id: conversationId,
      character_id: characterId,
    });
  }

  /**
   * Remove a character from a group
   */
  async removeCharacter(conversationId: string, characterId: string): Promise<void> {
    await supabaseAdmin
      .from('group_conversation_characters')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('character_id', characterId);
  }

  /**
   * Generate group responses — select 1-3 characters to respond based on context
   */
  async generateGroupResponse(
    conversation: Conversation,
    userMessage: string,
  ): Promise<Array<{ character: Character; content: string }>> {
    const characters = await this.getGroupCharacters(conversation.id);

    if (characters.length === 0) {
      throw new Error('No characters in group');
    }

    // Determine which characters should respond (1-3 based on context)
    const respondingChars = await this.selectResponders(characters, userMessage);

    // Generate responses in parallel
    const responses = await Promise.all(
      respondingChars.map(async (char) => {
        const content = await aiService.generateResponse(char, conversation, userMessage);
        return { character: char, content };
      }),
    );

    return responses;
  }

  /**
   * Select which characters should respond based on the user message
   * Simple heuristic: 1-2 characters respond, rotating based on message history
   */
  private async selectResponders(characters: Character[], userMessage: string): Promise<Character[]> {
    // Simple strategy: pick 1-2 characters based on message content
    const lowerMsg = userMessage.toLowerCase();

    // Check if user addressed someone by name
    const addressed = characters.filter((c) =>
      lowerMsg.includes(c.name.toLowerCase())
    );

    if (addressed.length > 0) {
      return addressed.slice(0, 2);
    }

    // Default: rotate — pick 1-2 random characters
    const shuffled = [...characters].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(2, characters.length));
  }
}

export const groupService = new GroupService();
