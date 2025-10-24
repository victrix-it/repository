import express, { type Express } from "express";
import passport from "passport";
import { initializeAuthStrategies, isAuthMethodEnabled } from "./authStrategies";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import {
  createAuditLog,
  checkAccountLockout,
  recordFailedLoginAttempt,
  clearFailedLoginAttempts,
  createUserSession,
  endUserSession,
} from "./auditLog";

// Middleware to check if user is authenticated
// ISO 27001 Control A.5.17 - Authentication Information
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Log unauthorized access attempt
  createAuditLog({
    eventType: 'unauthorized_access_attempt',
    success: false,
    reason: 'Attempted to access protected resource without authentication',
    req,
  });
  
  res.status(401).json({ message: "Unauthorized" });
}

// Register multi-auth routes
export async function registerMultiAuthRoutes(app: Express) {
  // Initialize auth strategies
  await initializeAuthStrategies();

  // Get available auth methods
  app.get('/api/auth/methods', async (req, res) => {
    try {
      const methods = {
        replit: true, // Always available in Replit environment
        local: await isAuthMethodEnabled('local'),
        ldap: await isAuthMethodEnabled('ldap'),
        saml: await isAuthMethodEnabled('saml'),
      };
      res.json(methods);
    } catch (error) {
      console.error('[auth] Error fetching auth methods:', error);
      res.status(500).json({ message: 'Failed to fetch auth methods' });
    }
  });

  // Local authentication routes
  // ISO 27001 Control A.5.17 - Authentication Information
  app.post('/api/auth/local/register', async (req, res) => {
    try {
      const enabled = await isAuthMethodEnabled('local');
      if (!enabled) {
        return res.status(403).json({ message: 'Local registration is disabled' });
      }

      const { email, password, firstName, lastName } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        passwordHash,
        authProvider: 'local',
        role: 'user',
      });

      // Audit log - user created
      await createAuditLog({
        eventType: 'user_created',
        userId: user.id,
        username: email,
        success: true,
        reason: 'User self-registered via local authentication',
        req,
      });

      // Log in the user
      req.login(user, async (err: any) => {
        if (err) {
          return res.status(500).json({ message: 'Registration successful but login failed' });
        }
        
        // Create session tracking
        const sessionId = (req.session as any).id;
        if (sessionId && user.id) {
          const ipAddress = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip;
          const userAgent = req.get('user-agent');
          await createUserSession({ userId: user.id, sessionId, ipAddress, userAgent });
        }
        
        res.json({ user: { id: user.id, email: user.email, role: user.role } });
      });
    } catch (error: any) {
      console.error('[auth] Local registration error:', error);
      res.status(500).json({ message: error.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/local/login', async (req, res, next) => {
    const { email } = req.body;
    
    // ISO 27001 Control A.5.17 - Check account lockout
    if (email) {
      const lockStatus = await checkAccountLockout(email);
      if (lockStatus.isLocked) {
        await createAuditLog({
          eventType: 'login_failure',
          username: email,
          success: false,
          reason: lockStatus.message || 'Account locked due to multiple failed attempts',
          req,
        });
        return res.status(403).json({ message: lockStatus.message });
      }
    }
    
    passport.authenticate('local', async (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        // Failed login - record attempt
        if (email) {
          const ipAddress = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip;
          await recordFailedLoginAttempt(email, ipAddress);
        }
        
        await createAuditLog({
          eventType: 'login_failure',
          username: email || 'unknown',
          success: false,
          reason: info?.message || 'Invalid credentials',
          req,
        });
        
        return res.status(401).json({ message: info?.message || 'Login failed' });
      }
      
      // Successful login
      req.login(user, async (loginErr: any) => {
        if (loginErr) {
          return next(loginErr);
        }
        
        // Clear failed attempts
        if (email) {
          await clearFailedLoginAttempts(email);
        }
        
        // Create session tracking
        const sessionId = (req.session as any).id;
        if (sessionId && user.id) {
          const ipAddress = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip;
          const userAgent = req.get('user-agent');
          await createUserSession({ userId: user.id, sessionId, ipAddress, userAgent });
        }
        
        // Audit log - successful login
        await createAuditLog({
          eventType: 'login_success',
          userId: user.id,
          username: user.email || email,
          success: true,
          reason: 'Successful local authentication',
          req,
        });
        
        res.json({ user });
      });
    })(req, res, next);
  });

  // LDAP authentication routes
  app.post('/api/auth/ldap/login',
    async (req, res, next) => {
      const enabled = await isAuthMethodEnabled('ldap');
      if (!enabled) {
        return res.status(403).json({ message: 'LDAP authentication is disabled' });
      }
      next();
    },
    passport.authenticate('ldap', { failureMessage: true }),
    (req, res) => {
      res.json({ user: req.user });
    }
  );

  // SAML authentication routes
  app.get('/api/auth/saml/login',
    async (req, res, next) => {
      const enabled = await isAuthMethodEnabled('saml');
      if (!enabled) {
        return res.status(403).json({ message: 'SAML authentication is disabled' });
      }
      next();
    },
    passport.authenticate('saml')
  );

  app.post('/api/auth/saml/callback',
    passport.authenticate('saml', { failureRedirect: '/' }),
    (req, res) => {
      // Redirect to dashboard after successful SAML login
      res.redirect('/');
    }
  );

  // Logout route (works for all auth methods)
  // ISO 27001 Control A.5.17 - Authentication Information
  app.post('/api/auth/logout', async (req, res) => {
    const user = req.user as any;
    const sessionId = (req.session as any)?.id;
    
    req.logout(async (err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      
      // End session tracking
      if (sessionId) {
        await endUserSession(sessionId);
      }
      
      // Audit log - logout
      if (user) {
        await createAuditLog({
          eventType: 'logout',
          userId: user.id,
          username: user.email,
          success: true,
          reason: 'User logged out',
          req,
        });
      }
      
      res.json({ success: true });
    });
  });

  console.log('[auth] Multi-auth routes registered');
}
