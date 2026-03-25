import { create } from 'zustand';
import type { Conversation, Message, Character } from '@ai-companions/shared';
import { chatService } from '../services/chat.service';

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  isLoadingConversations: boolean;
  // Streaming state
  streamingContent: string;
  isStreaming: boolean;

  fetchConversations: () => Promise<void>;
  startConversation: (characterId: string) => Promise<Conversation>;
  loadConversation: (conversationId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  sendStreamingMessage: (content: string) => Promise<void>;
  regenerateResponse: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  clearActiveChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoading: false,
  isSending: false,
  isLoadingConversations: false,
  streamingContent: '',
  isStreaming: false,

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const data = await chatService.listConversations();
      set({ conversations: data, isLoadingConversations: false });
    } catch {
      set({ isLoadingConversations: false });
    }
  },

  startConversation: async (characterId) => {
    set({ isLoading: true });
    try {
      const conversation = await chatService.createConversation(characterId);
      const data = await chatService.getConversation(conversation.id);
      set({
        activeConversation: data.conversation,
        messages: data.messages || [],
        isLoading: false,
      });
      return conversation;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  loadConversation: async (conversationId) => {
    set({ isLoading: true });
    try {
      const data = await chatService.getConversation(conversationId);
      set({
        activeConversation: data.conversation,
        messages: data.messages || [],
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  // Legacy non-streaming send (fallback)
  sendMessage: async (content) => {
    const state = get();
    if (!state.activeConversation || state.isSending) return;

    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: state.activeConversation.id,
      sender_type: 'user',
      character_id: null,
      content,
      media_url: null,
      audio_url: null,
      token_count: 0,
      created_at: new Date().toISOString(),
    };

    set((s) => ({
      messages: [...s.messages, tempUserMsg],
      isSending: true,
    }));

    try {
      const result = await chatService.sendMessage(state.activeConversation.id, content);
      
      set((s) => ({
        messages: [
          ...s.messages.filter((m) => m.id !== tempUserMsg.id),
          result.user_message,
          result.ai_message,
        ],
        isSending: false,
      }));
    } catch {
      set((s) => ({
        messages: s.messages.filter((m) => m.id !== tempUserMsg.id),
        isSending: false,
      }));
    }
  },

  // Streaming send — primary method
  sendStreamingMessage: async (content) => {
    const state = get();
    if (!state.activeConversation || state.isSending || state.isStreaming) return;

    // Optimistic user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: state.activeConversation.id,
      sender_type: 'user',
      character_id: null,
      content,
      media_url: null,
      audio_url: null,
      token_count: 0,
      created_at: new Date().toISOString(),
    };

    set((s) => ({
      messages: [...s.messages, tempUserMsg],
      isSending: true,
      isStreaming: true,
      streamingContent: '',
    }));

    try {
      await chatService.streamMessage(
        state.activeConversation.id,
        content,
        {
          onUserMessage: (msg) => {
            // Replace temp user message with real one from server
            set((s) => ({
              messages: s.messages.map((m) => m.id === tempUserMsg.id ? msg : m),
            }));
          },
          onToken: (token) => {
            // Append streaming token
            set((s) => ({
              streamingContent: s.streamingContent + token,
            }));
          },
          onDone: (aiMessage) => {
            // Stream complete — add final AI message and clear streaming state
            set((s) => ({
              messages: [...s.messages, aiMessage],
              streamingContent: '',
              isStreaming: false,
              isSending: false,
            }));
          },
          onError: (error) => {
            console.error('Stream error:', error);
            set({ streamingContent: '', isStreaming: false, isSending: false });
          },
        },
      );
    } catch {
      // Fallback: remove temp message and clear streaming
      set((s) => ({
        messages: s.messages.filter((m) => m.id !== tempUserMsg.id),
        streamingContent: '',
        isStreaming: false,
        isSending: false,
      }));
    }
  },

  regenerateResponse: async () => {
    const state = get();
    if (!state.activeConversation) return;

    set({ isSending: true });
    try {
      const result = await chatService.regenerate(state.activeConversation.id);
      
      set((s) => {
        const msgs = [...s.messages];
        const lastAiIdx = msgs.map((m) => m.sender_type).lastIndexOf('character');
        if (lastAiIdx >= 0) {
          msgs[lastAiIdx] = result.ai_message;
        } else {
          msgs.push(result.ai_message);
        }
        return { messages: msgs, isSending: false };
      });
    } catch {
      set({ isSending: false });
    }
  },

  deleteConversation: async (id) => {
    try {
      await chatService.deleteConversation(id);
      set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== id),
      }));
    } catch {}
  },

  clearActiveChat: () => set({ activeConversation: null, messages: [], streamingContent: '', isStreaming: false }),
}));
