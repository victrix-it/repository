import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ensureDefaultAdminExists } from "./license-manager";
import { emailService } from "./email-service";
import { storage } from "./storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Ensure default admin account exists
  try {
    await ensureDefaultAdminExists();
  } catch (error) {
    console.error('Failed to ensure default admin exists:', error);
  }

  // Initialize email service
  try {
    const smtpHost = await storage.getSetting('smtp_host');
    const smtpPort = await storage.getSetting('smtp_port');
    const smtpUser = await storage.getSetting('smtp_user');
    const smtpPass = await storage.getSetting('smtp_pass');
    const smtpFrom = await storage.getSetting('smtp_from');
    const smtpSecure = await storage.getSetting('smtp_secure');

    if (smtpHost?.value && smtpPort?.value && smtpUser?.value && smtpPass?.value && smtpFrom?.value) {
      await emailService.initialize({
        host: smtpHost.value,
        port: parseInt(smtpPort.value, 10),
        secure: smtpSecure?.value === 'true',
        auth: {
          user: smtpUser.value,
          pass: smtpPass.value,
        },
        from: smtpFrom.value,
      });
    } else {
      console.log('[email] SMTP not configured, email notifications disabled');
    }
  } catch (error) {
    console.error('[email] Failed to initialize email service:', error);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
