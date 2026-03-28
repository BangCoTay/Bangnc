import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabasePublic, supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';

export class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, username, display_name } = req.body;
      const normalizedEmail = String(email).trim().toLowerCase();
      const normalizedUsername = String(username).trim().toLowerCase();

      // Check username uniqueness
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('username', normalizedUsername)
        .single();

      if (existingUser) {
        return res.status(409).json({ success: false, error: 'Username already taken' });
      }

      // Create user in Supabase Auth
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { username: normalizedUsername, display_name: display_name || normalizedUsername },
      });

      if (error) {
        logger.error({ error }, 'Registration failed');
        const lowerMsg = error.message.toLowerCase();
        const status = lowerMsg.includes('already') ? 409 : 400;
        return res.status(status).json({ success: false, error: error.message });
      }

      // Sign in to get tokens
      const { data: session, error: signInError } = await supabasePublic.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError || !session.session) {
        return res.status(400).json({ success: false, error: 'Account created but login failed' });
      }

      // Get profile
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        profile.is_admin = normalizedEmail === 'vankhai15052005@gmail.com';
      }

      res.status(201).json({
        success: true,
        data: {
          user: profile,
          access_token: session.session.access_token,
          refresh_token: session.session.refresh_token,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const { data: session, error } = await supabasePublic.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !session.session) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        profile.is_admin = String(email).trim().toLowerCase() === 'vankhai15052005@gmail.com';
      }

      res.json({
        success: true,
        data: {
          user: profile,
          access_token: session.session.access_token,
          refresh_token: session.session.refresh_token,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;
      if (!refresh_token) {
        return res.status(400).json({ success: false, error: 'Refresh token required' });
      }

      const { data, error } = await supabasePublic.auth.refreshSession({ refresh_token });

      if (error || !data.session) {
        return res.status(401).json({ success: false, error: 'Invalid refresh token' });
      }

      res.json({
        success: true,
        data: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      const { error } = await supabasePublic.auth.resetPasswordForEmail(email);

      if (error) {
        logger.warn({ error, email }, 'Password reset failed');
      }

      // Always return success to prevent email enumeration
      res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
