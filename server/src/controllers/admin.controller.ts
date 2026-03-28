import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export class AdminController {
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { count: usersCount } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
      const { count: charactersCount } = await supabaseAdmin.from('characters').select('*', { count: 'exact', head: true });
      
      res.json({
        success: true,
        data: {
          users: usersCount || 0,
          characters: charactersCount || 0,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { data, error, count } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      
      res.json({
        success: true,
        data,
        total: count || 0
      });
    } catch (error) {
      next(error);
    }
  }

  async getCharacters(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { data, error, count } = await supabaseAdmin
        .from('characters')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      
      res.json({
        success: true,
        data,
        total: count || 0
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) throw error;
      
      res.json({
        success: true,
        message: 'User banned'
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCharacter(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const { error } = await supabaseAdmin
        .from('characters')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      res.json({
        success: true,
        message: 'Character deleted'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
