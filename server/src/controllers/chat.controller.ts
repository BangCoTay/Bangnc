import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { chatService } from '../services/chat.service';
import { aiService } from '../services/ai.service';
import type { Character } from '@ai-companions/shared';

export class ChatController {
  async listConversations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const conversations = await chatService.listConversations(req.user!.id);
      res.json({ success: true, data: conversations });
    } catch (err) {
      next(err);
    }
  }

  async createConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { character_id } = req.body;
      if (!character_id) {
        return res.status(400).json({ success: false, error: 'character_id is required' });
      }
      const conversation = await chatService.getOrCreateConversation(req.user!.id, character_id);
      res.status(201).json({ success: true, data: conversation });
    } catch (err) {
      next(err);
    }
  }

  async getConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const conversation = await chatService.getConversation(req.params.id, req.user!.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await chatService.getMessages(req.params.id, req.user!.id, page, limit);
      
      res.json({
        success: true,
        data: {
          conversation,
          messages: messages.data,
          pagination: {
            total: messages.total,
            page: messages.page,
            limit: messages.limit,
            has_more: messages.has_more,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await chatService.deleteConversation(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Conversation deleted' });
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { content } = req.body;
      const conversationId = req.params.id;

      // Get conversation with character data
      const conversation = await chatService.getConversation(conversationId, req.user!.id);
      const character = conversation.character as Character;

      if (!character) {
        return res.status(404).json({ success: false, error: 'Character not found for this conversation' });
      }

      // Save user message
      const userMessage = await chatService.saveMessage(conversationId, 'user', content);

      // Generate AI response
      const aiResponseContent = await aiService.generateResponse(character, conversation, content);

      // Save AI response
      const aiMessage = await chatService.saveMessage(
        conversationId,
        'character',
        aiResponseContent,
        character.id,
      );

      res.json({
        success: true,
        data: {
          user_message: userMessage,
          ai_message: aiMessage,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async regenerate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const conversationId = req.params.id;
      const conversation = await chatService.getConversation(conversationId, req.user!.id);
      const character = conversation.character as Character;

      if (!character) {
        return res.status(404).json({ success: false, error: 'Character not found' });
      }

      const aiResponseContent = await aiService.regenerateResponse(character, conversation);
      const aiMessage = await chatService.saveMessage(
        conversationId,
        'character',
        aiResponseContent,
        character.id,
      );

      res.json({ success: true, data: { ai_message: aiMessage } });
    } catch (err) {
      next(err);
    }
  }
}

export const chatController = new ChatController();
