import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { groupService } from '../services/group.service';
import { chatService } from '../services/chat.service';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// Create a group conversation
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { character_ids } = req.body;
    if (!character_ids || !Array.isArray(character_ids) || character_ids.length < 2) {
      return res.status(400).json({ success: false, error: 'Provide 2-5 character_ids' });
    }
    const conversation = await groupService.createGroupConversation(req.user!.id, character_ids);
    res.status(201).json({ success: true, data: conversation });
  } catch (err) { next(err); }
});

// Get group characters
router.get('/:id/characters', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const characters = await groupService.getGroupCharacters(req.params.id);
    res.json({ success: true, data: characters });
  } catch (err) { next(err); }
});

// Add character to group
router.post('/:id/characters', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { character_id } = req.body;
    await groupService.addCharacter(req.params.id, character_id);
    res.json({ success: true, message: 'Character added to group' });
  } catch (err) { next(err); }
});

// Remove character from group
router.delete('/:id/characters/:characterId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await groupService.removeCharacter(req.params.id, req.params.characterId);
    res.json({ success: true, message: 'Character removed from group' });
  } catch (err) { next(err); }
});

// Send message to group (multi-character response)
router.post('/:id/messages', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const conversation = await chatService.getConversation(req.params.id, req.user!.id);

    // Save user message
    const userMessage = await chatService.saveMessage(conversation.id, 'user', content);

    // Generate multi-character responses
    const responses = await groupService.generateGroupResponse(conversation, content);

    // Save all AI responses
    const aiMessages = [];
    for (const resp of responses) {
      const msg = await chatService.saveMessage(
        conversation.id, 'character', resp.content, resp.character.id,
      );
      aiMessages.push({ ...msg, character_name: resp.character.name });
    }

    res.json({
      success: true,
      data: { user_message: userMessage, ai_messages: aiMessages },
    });
  } catch (err) { next(err); }
});

export default router;
