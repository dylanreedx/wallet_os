# P11-001: Deployment Setup

**Phase**: 11 - Deployment & Infrastructure  
**Priority**: High  
**Status**: TODO  
**Created**: 2025-11-19  

## Overview

Set up production deployment infrastructure for both backend and frontend applications with proper environment configuration and smart base URL handling.

## Requirements

### Backend Deployment
- [ ] Deploy backend API to production environment
- [ ] Configure production environment variables
- [ ] Set up database connection for production
- [ ] Configure CORS for production domain
- [ ] Set up SSL/TLS certificates
- [ ] Configure production logging

### Frontend Deployment
- [ ] Deploy frontend application to production
- [ ] Configure production environment variables
- [ ] Set up production build optimization
- [ ] Configure CDN if applicable

### Smart Base URL Configuration
- [ ] Implement environment detection (dev vs prod)
- [ ] Create smart base URL utility that automatically determines:
  - Development: `http://localhost:3000` (or appropriate dev URL)
  - Production: Production API URL
- [ ] Use base URL throughout the app consistently
- [ ] Update API client to use smart base URL
- [ ] Ensure all fetch calls use the base URL utility

### Environment Variables
- [ ] Document all required environment variables
- [ ] Create `.env.example` files for both frontend and backend
- [ ] Set up environment variables in deployment platform
- [ ] Implement environment variable validation on startup

## Technical Details

### Smart Base URL Implementation
```typescript
// utils/config.ts or similar
export const getBaseUrl = () => {
  // Check if we're in production
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://api.yourdomain.com';
  }
  
  // Development environment
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

export const API_BASE_URL = getBaseUrl();
```

### Required Environment Variables

**Backend (.env)**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=...
RESEND_API_KEY=...
OPENAI_API_KEY=...
FRONTEND_URL=https://yourdomain.com
```

**Frontend (.env)**
```
VITE_API_URL=https://api.yourdomain.com
VITE_APP_ENV=production
```

## Acceptance Criteria

- [ ] Backend is deployed and accessible via production URL
- [ ] Frontend is deployed and accessible via production URL
- [ ] All environment variables are properly configured
- [ ] Smart base URL automatically detects and uses correct API endpoint
- [ ] No hardcoded URLs in the codebase
- [ ] API calls work in both development and production
- [ ] HTTPS is enforced in production
- [ ] Error handling works correctly in production

## Dependencies

- Hosting platform selection (e.g., Vercel, Netlify, Railway, Render)
- Domain name configuration
- SSL certificate setup
- Database hosting (if not already set up)

## Notes

- Consider using environment-specific configuration files
- Implement health check endpoints for monitoring
- Set up CI/CD pipeline for automated deployments
- Consider implementing feature flags for gradual rollouts
- Document deployment process for team members
