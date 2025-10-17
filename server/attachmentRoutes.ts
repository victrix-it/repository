import { type Express } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { insertAttachmentSchema } from "@shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export function registerAttachmentRoutes(app: Express) {
  // Upload attachment
  app.post('/api/attachments', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const { ticketId, changeRequestId, knowledgeBaseId } = req.body;

      // Validate that at least one ID is provided
      if (!ticketId && !changeRequestId && !knowledgeBaseId) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "Must specify ticketId, changeRequestId, or knowledgeBaseId" });
      }

      const attachmentData = {
        filename: req.file.filename,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        filePath: req.file.path,
        ticketId: ticketId || null,
        changeRequestId: changeRequestId || null,
        knowledgeBaseId: knowledgeBaseId || null,
      };

      const validatedData = insertAttachmentSchema.parse(attachmentData);
      const attachment = await storage.createAttachment(validatedData, userId);
      
      res.json(attachment);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      // Clean up file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({ message: error.message || "Failed to upload file" });
    }
  });

  // Get attachments for a ticket
  app.get('/api/tickets/:id/attachments', isAuthenticated, async (req, res) => {
    try {
      const attachments = await storage.getAttachmentsByTicket(req.params.id);
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });

  // Get attachments for a change request
  app.get('/api/changes/:id/attachments', isAuthenticated, async (req, res) => {
    try {
      const attachments = await storage.getAttachmentsByChange(req.params.id);
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });

  // Get attachments for a knowledge base article
  app.get('/api/knowledge/:id/attachments', isAuthenticated, async (req, res) => {
    try {
      const attachments = await storage.getAttachmentsByKB(req.params.id);
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });

  // Download attachment
  app.get('/api/attachments/:id/download', isAuthenticated, async (req, res) => {
    try {
      const attachment = await storage.getAttachment(req.params.id);
      
      if (!attachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }

      // Check if file exists
      if (!fs.existsSync(attachment.filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }

      res.download(attachment.filePath, attachment.originalFilename);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Delete attachment
  app.delete('/api/attachments/:id', isAuthenticated, async (req, res) => {
    try {
      const attachment = await storage.getAttachment(req.params.id);
      
      if (!attachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }

      // Delete file from disk
      if (fs.existsSync(attachment.filePath)) {
        fs.unlinkSync(attachment.filePath);
      }

      // Delete from database
      await storage.deleteAttachment(req.params.id);
      
      res.json({ message: "Attachment deleted successfully" });
    } catch (error) {
      console.error("Error deleting attachment:", error);
      res.status(500).json({ message: "Failed to delete attachment" });
    }
  });
}
