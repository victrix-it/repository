import express, { type Express } from "express";
import passport from "passport";
import { initializeAuthStrategies, isAuthMethodEnabled } from "./authStrategies";
import { storage } from "./storage";
import bcrypt from "bcryptjs";

// Middleware to check if user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
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

      // Log in the user
      req.login(user, (err: any) => {
        if (err) {
          return res.status(500).json({ message: 'Registration successful but login failed' });
        }
        res.json({ user: { id: user.id, email: user.email, role: user.role } });
      });
    } catch (error: any) {
      console.error('[auth] Local registration error:', error);
      res.status(500).json({ message: error.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/local/login',
    passport.authenticate('local', { failureMessage: true }),
    (req, res) => {
      res.json({ user: req.user });
    }
  );

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
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  console.log('[auth] Multi-auth routes registered');
}
