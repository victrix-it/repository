import { type Express } from "express";
import { storage } from "./storage";
import crypto from "crypto";

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Helper function to apply transformations
function applyTransform(value: any, transform: string | null | undefined): any {
  if (!transform || !value) return value;
  
  const str = String(value);
  switch (transform) {
    case 'uppercase':
      return str.toUpperCase();
    case 'lowercase':
      return str.toLowerCase();
    case 'trim':
      return str.trim();
    case 'severity_to_priority':
      // Map common severity levels to ticket priorities
      const severityMap: Record<string, string> = {
        'critical': 'critical',
        'high': 'high',
        'major': 'high',
        'warning': 'medium',
        'medium': 'medium',
        'minor': 'low',
        'low': 'low',
        'info': 'low',
        'informational': 'low',
      };
      return severityMap[str.toLowerCase()] || 'medium';
    default:
      return value;
  }
}

// Evaluate filter rule against alert payload
function evaluateFilterRule(rule: any, payload: any): boolean {
  const fieldValue = getNestedValue(payload, rule.fieldPath);
  
  switch (rule.operator) {
    case 'equals':
      return String(fieldValue) === String(rule.value);
    case 'not_equals':
      return String(fieldValue) !== String(rule.value);
    case 'contains':
      return String(fieldValue).includes(String(rule.value));
    case 'not_contains':
      return !String(fieldValue).includes(String(rule.value));
    case 'regex':
      try {
        const regex = new RegExp(rule.value);
        return regex.test(String(fieldValue));
      } catch {
        return false;
      }
    case 'greater_than':
      return Number(fieldValue) > Number(rule.value);
    case 'less_than':
      return Number(fieldValue) < Number(rule.value);
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;
    case 'not_exists':
      return fieldValue === undefined || fieldValue === null;
    default:
      return false;
  }
}

// Check if alert should create a ticket based on filter rules
async function shouldCreateTicket(integrationId: string, payload: any): Promise<boolean> {
  const rules = await storage.getFilterRulesByIntegration(integrationId);
  
  if (rules.length === 0) {
    // No rules defined, allow all alerts
    return true;
  }

  // Sort rules by priority (lower number = higher priority)
  const sortedRules = rules.sort((a, b) => (a.priority || 0) - (b.priority || 0));

  for (const rule of sortedRules) {
    if (rule.enabled !== 'true') continue;

    const matches = evaluateFilterRule(rule, payload);

    if (rule.filterType === 'exclude' && matches) {
      // Exclude rule matched - don't create ticket
      return false;
    }

    if (rule.filterType === 'include' && matches) {
      // Include rule matched - create ticket
      return true;
    }
  }

  // If we have only exclude rules and none matched, create ticket
  // If we have include rules and none matched, don't create ticket
  const hasIncludeRules = sortedRules.some(r => r.filterType === 'include' && r.enabled === 'true');
  return !hasIncludeRules;
}

// Extract ticket data from alert payload using field mappings
async function extractTicketData(integrationId: string, payload: any, integration: any): Promise<any> {
  const mappings = await storage.getFieldMappingsByIntegration(integrationId);
  
  const ticketData: any = {
    priority: integration.defaultPriority || 'medium',
    category: integration.defaultCategory || 'Other',
    status: 'open',
    tags: [],
  };

  // Apply field mappings
  for (const mapping of mappings) {
    const value = getNestedValue(payload, mapping.alertFieldPath);
    if (value !== undefined && value !== null) {
      const transformedValue = applyTransform(value, mapping.transform);
      ticketData[mapping.ticketField] = transformedValue;
    }
  }

  // Default values if not mapped
  if (!ticketData.title) {
    ticketData.title = `Alert from ${integration.sourceSystem || 'Monitoring System'}`;
  }
  
  if (!ticketData.description) {
    ticketData.description = JSON.stringify(payload, null, 2);
  }

  // Add metadata
  ticketData.tags = [
    ...(ticketData.tags || []),
    `source:${integration.sourceSystem || 'alert'}`,
    `integration:${integration.name}`,
  ];

  return ticketData;
}

// Register webhook routes for alert integrations
export function registerAlertWebhookRoutes(app: Express) {
  // Webhook endpoint to receive alerts
  app.post('/api/webhooks/alerts/:webhookId', async (req, res) => {
    try {
      const { webhookId } = req.params;
      const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
      const payload = req.body;

      // Find integration by webhook URL
      const integration = await storage.getAlertIntegrationByWebhookId(webhookId);
      
      if (!integration) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      // Check if integration is enabled
      if (integration.enabled !== 'true') {
        return res.status(403).json({ error: 'Integration is disabled' });
      }

      // Validate API key
      if (!apiKey || apiKey !== integration.apiKey) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      // Check filter rules to determine if ticket should be created
      const shouldCreate = await shouldCreateTicket(integration.id, payload);
      
      if (!shouldCreate) {
        return res.json({ 
          message: 'Alert filtered out by rules',
          ticketCreated: false,
        });
      }

      // Extract ticket data from payload
      const ticketData = await extractTicketData(integration.id, payload, integration);

      // Add team assignment if configured
      if (integration.autoAssignTeamId) {
        ticketData.assignedTeamId = integration.autoAssignTeamId;
      }

      // Create a system user ID for automated tickets (you'll need to create this)
      const systemUserId = await storage.getOrCreateSystemUser();

      // Create ticket
      const ticket = await storage.createTicket(ticketData, systemUserId);

      res.json({
        message: 'Ticket created successfully',
        ticketCreated: true,
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
      });

    } catch (error: any) {
      console.error('[webhook] Error processing alert:', error);
      res.status(500).json({ 
        error: 'Failed to process alert',
        message: error.message,
      });
    }
  });

  // Test webhook endpoint (for testing configuration)
  app.post('/api/webhooks/alerts/:webhookId/test', async (req, res) => {
    try {
      const { webhookId } = req.params;
      const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

      const integration = await storage.getAlertIntegrationByWebhookId(webhookId);
      
      if (!integration) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      if (!apiKey || apiKey !== integration.apiKey) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      res.json({
        message: 'Webhook configuration is valid',
        integration: {
          name: integration.name,
          sourceSystem: integration.sourceSystem,
          enabled: integration.enabled === 'true',
        },
      });

    } catch (error: any) {
      console.error('[webhook] Error testing webhook:', error);
      res.status(500).json({ error: 'Test failed', message: error.message });
    }
  });

  console.log('[webhook] Alert webhook routes registered');
}

// Generate a unique webhook ID
export function generateWebhookId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Generate a secure API key
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
