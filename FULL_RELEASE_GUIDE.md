# 🚀 AI Girlfriend - Complete Release & Publishing Guide

This document provides a comprehensive, step-by-step roadmap for taking your application from a local development environment to a live, production-ready state on **APKPure**.

---

## 🛠️ Phase 1: Backend Deployment (Express Server)

The backend server manages real-time chat, AI memory, and Supabase integrations. We recommend **Render** or **Railway** for seamless Node.js deployment.

### 1. Prepare for Deployment
- Ensure `server/package.json` has a `build` and `start` script.
- Ensure all logic uses environment variables for sensitive data.

### 2. Deployment Steps (using [Render](https://render.com/))
1. **Connect Repository**: Link your GitHub/GitLab repo to Render.
2. **New Web Service**: Create a new "Web Service" pointing to the `server/` directory.
3. **Configurations**:
    - **Build Command**: `npm install && npm run build` (if in the root, use `cd server && npm install && npm run build`).
    - **Start Command**: `npm start` (or `node dist/index.js`).
4. **Environment Variables**:
    Add the following variables in the Render dashboard:
    - `SUPABASE_URL`: (Your production Supabase URL)
    - `SUPABASE_SERVICE_ROLE_KEY`: (Your production service role key)
    - `OPENAI_API_KEY`: (Your OpenAI API key)
    - `NODE_ENV`: `production`

---

## 🏗️ Phase 2: Supabase Production Setup

1. **New Project**: Create a new project in the [Supabase Dashboard](https://supabase.com).
2. **Database Migrations**:
    - Navigate to the **SQL Editor**.
    - Copy and execute the contents of `supabase/migration.sql` and `supabase/migration_v2.sql`.
3. **Verify Schemas**: Ensure tables like `characters`, `messages`, and `users` are correctly created.

---

## 📱 Phase 3: Frontend Production Build (Expo & EAS)

We use **EAS (Expo Application Services)** to generate the final APK for distribution.

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login & Link Project
```bash
eas login
eas build:configure
```

### 3. Update Environment Variables
Create or update `app/.env` with your **production** URLs:
```env
EXPO_PUBLIC_API_URL=https://your-backend-url.onrender.com
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Build the APK
To generate an APK file that can be uploaded directly to APKPure:
```bash
eas build --platform android --profile preview
```
> [!NOTE]
> The `preview` profile by default generates an APK. If you want a Google Play Store bundle, use `--profile production` (AAB).

---

## 📤 Phase 4: Publishing to APKPure

Once you have the `.apk` file from EAS:

1. **Download APK**: Download the generated build from the Expo dashboard or the link provided in the terminal.
2. **Upload to APKPure**: Follow the detailed steps in our **[APKPure Publishing Guide](file:///d:/Coding%20Projects/AI_Girlfriend/APKPURE_PUBLISHING_GUIDE.md)** to complete the store listing.

---

## 💡 Summary Checklist
- [ ] Backend is live and returning 200 OK on `/` or health check.
- [ ] Supabase has all necessary tables and RLS policies.
- [ ] Frontend `.env` points to the **Production URL**, not `localhost`.
- [ ] EAS build finishes without errors.
- [ ] APK is tested on a real device before store submission.

---
*For support or further queries, refer to the [official Expo documentation](https://docs.expo.dev/).*
