import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import LdapStrategy from "passport-ldapauth";
import { Strategy as SamlStrategy, type Profile as SamlProfile } from "@node-saml/passport-saml";
import { storage } from "./storage";
import bcrypt from "bcryptjs";

// Helper to get auth configuration from database
async function getAuthConfig(key: string): Promise<string | null> {
  const setting = await storage.getSetting(key);
  return setting?.value || null;
}

// Helper to check if an auth method is enabled
export async function isAuthMethodEnabled(method: 'ldap' | 'saml' | 'local'): Promise<boolean> {
  const enabled = await getAuthConfig(`auth_${method}_enabled`);
  return enabled === 'true';
}

// Local authentication strategy (username/password)
export function setupLocalAuth() {
  passport.use('local', new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (user.authProvider !== 'local') {
          return done(null, false, { message: 'Please use your organization login method' });
        }

        if (!user.passwordHash) {
          return done(null, false, { message: 'Invalid account configuration' });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));
}

// LDAP authentication strategy
export async function setupLdapAuth() {
  const enabled = await isAuthMethodEnabled('ldap');
  if (!enabled) {
    console.log('[auth] LDAP authentication is disabled');
    return;
  }

  const ldapUrl = await getAuthConfig('auth_ldap_url');
  const bindDn = await getAuthConfig('auth_ldap_bind_dn');
  const bindPassword = await getAuthConfig('auth_ldap_bind_password');
  const searchBase = await getAuthConfig('auth_ldap_search_base');
  const searchFilter = await getAuthConfig('auth_ldap_search_filter') || '(uid={{username}})';

  if (!ldapUrl || !searchBase) {
    console.log('[auth] LDAP configuration incomplete - disabled');
    return;
  }

  passport.use('ldap', new LdapStrategy(
    {
      server: {
        url: ldapUrl,
        bindDN: bindDn || '',
        bindCredentials: bindPassword || '',
        searchBase: searchBase,
        searchFilter: searchFilter,
        searchAttributes: ['mail', 'givenName', 'sn', 'cn'],
      },
    },
    async (ldapUser: any, done: any) => {
      try {
        const email = ldapUser.mail || ldapUser.email;
        const firstName = ldapUser.givenName || ldapUser.cn;
        const lastName = ldapUser.sn || '';
        
        if (!email) {
          return done(null, false, { message: 'No email found in LDAP profile' });
        }

        // Find or create user
        let user = await storage.getUserByEmail(email);
        
        if (!user) {
          // Create new user from LDAP
          user = await storage.createUser({
            email: email,
            firstName: firstName as string,
            lastName: lastName as string,
            role: 'user',
            authProvider: 'ldap',
            ldapDn: ldapUser.dn as string,
          });
        } else if (user.authProvider !== 'ldap') {
          // User exists but uses different auth method
          return done(null, false, { message: 'Email already registered with different login method' });
        } else {
          // Update LDAP user info
          await storage.updateUser(user.id, {
            firstName: firstName,
            lastName: lastName,
            ldapDn: ldapUser.dn,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  console.log('[auth] LDAP authentication configured');
}

// SAML authentication strategy
export async function setupSamlAuth() {
  const enabled = await isAuthMethodEnabled('saml');
  if (!enabled) {
    console.log('[auth] SAML authentication is disabled');
    return;
  }

  const entryPoint = await getAuthConfig('auth_saml_entry_point');
  const issuer = await getAuthConfig('auth_saml_issuer');
  const callbackUrl = await getAuthConfig('auth_saml_callback_url');
  const cert = await getAuthConfig('auth_saml_cert');

  if (!entryPoint || !issuer || !callbackUrl) {
    console.log('[auth] SAML configuration incomplete - disabled');
    return;
  }

  passport.use('saml', new SamlStrategy(
    {
      entryPoint: entryPoint,
      issuer: issuer,
      callbackUrl: callbackUrl,
      cert: cert || undefined,
      acceptedClockSkewMs: -1,
    },
    async (profile: SamlProfile, done: any) => {
      try {
        const email = profile.email || profile.nameID;
        const firstName = profile.givenName || profile.firstName || '';
        const lastName = profile.surname || profile.lastName || '';
        
        if (!email) {
          return done(null, false, { message: 'No email found in SAML profile' });
        }

        // Find or create user
        let user = await storage.getUserByEmail(email);
        
        if (!user) {
          // Create new user from SAML
          user = await storage.createUser({
            email: email,
            firstName: firstName as string,
            lastName: lastName as string,
            role: 'user',
            authProvider: 'saml',
            samlNameId: profile.nameID as string,
          });
        } else if (user.authProvider !== 'saml') {
          // User exists but uses different auth method
          return done(null, false, { message: 'Email already registered with different login method' });
        } else {
          // Update SAML user info
          await storage.updateUser(user.id, {
            firstName: firstName,
            lastName: lastName,
            samlNameId: profile.nameID,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  console.log('[auth] SAML authentication configured');
}

// Initialize all authentication strategies
export async function initializeAuthStrategies() {
  setupLocalAuth();
  await setupLdapAuth();
  await setupSamlAuth();
  console.log('[auth] All authentication strategies initialized');
}
