import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { characterService } from '../services/character.service';

export class CharacterController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await characterService.list(req.query as any, req.user?.id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const character = await characterService.getById(req.params.id, req.user?.id);
      res.json({ success: true, data: character });
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const character = await characterService.create(req.body, req.user!.id);
      res.status(201).json({ success: true, data: character });
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const character = await characterService.update(req.params.id, req.body, req.user!.id);
      res.json({ success: true, data: character });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await characterService.delete(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Character deleted' });
    } catch (err) {
      next(err);
    }
  }

  async toggleFavorite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await characterService.toggleFavorite(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getMyCharacters(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const characters = await characterService.getByCreator(req.user!.id);
      res.json({ success: true, data: characters });
    } catch (err) {
      next(err);
    }
  }
}

export const characterController = new CharacterController();
