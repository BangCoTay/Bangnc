import { supabaseAdmin } from '../config/supabase';
import type { Conversation, Message, PaginatedResponse } from '@ai-companions/shared';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export class ChatService {
  async listConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        character:characters(id, name, tagline, avatar_url, style, gender, is_nsfw)
      `)
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Conversation[];
  }

  async getOrCreateConversation(userId: string, characterId: string): Promise<Conversation> {
    // Check if conversation exists
    const { data: existing } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        character:characters(id, name, tagline, avatar_url, style, gender, personality, appearance, description, system_prompt, greeting_message, is_nsfw, categories)
      `)
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .single();

    if (existing) return existing as Conversation;

    // Create new conversation
    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .insert({ user_id: userId, character_id: characterId })
      .select(`
        *,
        character:characters(id, name, tagline, avatar_url, style, gender, personality, appearance, description, system_prompt, greeting_message, is_nsfw, categories)
      `)
      .single();

    if (error) throw error;

    // Insert greeting message from character
    const character = (conversation as any).character;
    if (character?.greeting_message) {
      await supabaseAdmin.from('messages').insert({
        conversation_id: conversation!.id,
        sender_type: 'character',
        character_id: characterId,
        content: character.greeting_message,
      });

      // Update conversation
      await supabaseAdmin
        .from('conversations')
        .update({
          last_message_preview: character.greeting_message,
          message_count: 1,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversation!.id);
    }

    // Increment chat count on character
    await supabaseAdmin.rpc('increment_chat_count', { char_id: characterId });

    return conversation as Conversation;
  }

  async getConversation(conversationId: string, userId: string): Promise<Conversation> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        character:characters(id, name, tagline, avatar_url, style, gender, personality, appearance, description, system_prompt, greeting_message, is_nsfw, categories)
      `)
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundError('Conversation');
    return data as Conversation;
  }

  async getMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedResponse<Message>> {
    // Verify ownership
    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!conv) throw new NotFoundError('Conversation');

    const offset = (page - 1) * limit;

    const { data, count, error } = await supabaseAdmin
      .from('messages')
      .select('*, character:characters(id, name, avatar_url)', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: (data || []) as Message[],
      total: count || 0,
      page,
      limit,
      has_more: offset + limit < (count || 0),
    };
  }

  async getRecentMessages(conversationId: string, limit: number = 30): Promise<Message[]> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*, character:characters(id, name, avatar_url)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return ((data || []) as Message[]).reverse();
  }

  async saveMessage(
    conversationId: string,
    senderType: 'user' | 'character',
    content: string,
    characterId?: string,
  ): Promise<Message> {
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: senderType,
        character_id: characterId || null,
        content,
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation
    await supabaseAdmin
      .from('conversations')
      .update({
        last_message_preview: content.substring(0, 100),
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    // Increment message count
    const { error: rpcError } = await supabaseAdmin.rpc('increment_message_count', { conv_id: conversationId });
    
    if (rpcError) {
      // Fallback
      const { data: conv } = await supabaseAdmin
        .from('conversations')
        .select('message_count')
        .eq('id', conversationId)
        .single();
      if (conv) {
        await supabaseAdmin
          .from('conversations')
          .update({ message_count: (conv.message_count || 0) + 1 })
          .eq('id', conversationId);
      }
    }

    return message as Message;
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!conv) throw new NotFoundError('Conversation');

    // Messages cascade delete
    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  }

  async deleteLastAIMessage(conversationId: string): Promise<void> {
    const { data: lastMsg } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('sender_type', 'character')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastMsg) {
      await supabaseAdmin.from('messages').delete().eq('id', lastMsg.id);
    }
  }
}

export const chatService = new ChatService();
