import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { userService } from "../services/user.service";
import { PLANS } from "@ai-companions/shared";

export class UserController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await userService.getProfile(req.user!.id);
      if (profile) {
        profile.is_admin = req.user!.email === "vankhai15052005@gmail.com";
      }
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await userService.updateProfile(req.user!.id, req.body);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async getFavorites(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const favorites = await userService.getFavorites(req.user!.id);
      res.json({ success: true, data: favorites });
    } catch (err) {
      next(err);
    }
  }

  async getPlans(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: PLANS });
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
