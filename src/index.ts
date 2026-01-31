#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// API Configuration
const API_BASE_URL = "https://api.xem.email/api/v1";

// Global configuration from environment variables or CLI args
let API_TOKEN: string | undefined;
let TEAM_ID: string | undefined;

// Types for API requests
interface SendEmailRequest {
  to: string;
  subject: string;
  html?: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  templateId?: string;
  scheduleAt?: string;
  provider?: string;
  test?: boolean;
  data?: number[];
}

interface CreateCampaignRequest {
  name: string;
  subject: string;
  html?: string;
  templateId?: string;
  listId: string;
  scheduleAt?: string;
  teamId?: string;
}

interface CreateContactListRequest {
  name: string;
  description?: string;
  teamId?: string;
}

interface AddContactsRequest {
  listId: string;
  contacts: Array<{
    email: string;
    name?: string;
    phone?: string;
    [key: string]: any;
  }>;
  teamId?: string;
}

interface ImportContactsRequest {
  listId: string;
  fileId: string;
  mappings: Record<string, string>;
  teamId?: string;
}

// Helper function to make API requests
async function apiRequest(
  endpoint: string,
  token: string,
  method: string = "GET",
  body?: any
): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return await response.json();
}

// Define available tools
const TOOLS: Tool[] = [
  {
    name: "send_email",
    description:
      "Send an email using the XEM Email API. Supports HTML content, templates, scheduling, and multiple recipients.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "XEM Email API authentication token (optional if set via environment variable)",
        },
        to: {
          type: "string",
          description: "Recipient email address",
        },
        subject: {
          type: "string",
          description: "Email subject line",
        },
        html: {
          type: "string",
          description: "HTML content of the email (optional if using templateId)",
        },
        cc: {
          type: "string",
          description: "CC email addresses (comma-separated)",
        },
        bcc: {
          type: "string",
          description: "BCC email addresses (comma-separated)",
        },
        replyTo: {
          type: "string",
          description: "Reply-to email address",
        },
        templateId: {
          type: "string",
          description: "Template ID to use for the email",
        },
        scheduleAt: {
          type: "string",
          description: "ISO 8601 timestamp to schedule the email",
        },
        provider: {
          type: "string",
          description: "Email provider (default: CUSTOM)",
          default: "CUSTOM",
        },
        test: {
          type: "boolean",
          description: "Whether this is a test email",
          default: false,
        },
        data: {
          type: "array",
          items: { type: "number" },
          description: "Additional data array",
        },
      },
      required: ["to", "subject"],
    },
  },
  {
    name: "create_campaign",
    description:
      "Create an email campaign that can be sent to a contact list.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "XEM Email API authentication token (optional if set via environment variable)",
        },
        name: {
          type: "string",
          description: "Campaign name",
        },
        subject: {
          type: "string",
          description: "Email subject line",
        },
        html: {
          type: "string",
          description: "HTML content of the campaign email",
        },
        templateId: {
          type: "string",
          description: "Template ID to use for the campaign",
        },
        listId: {
          type: "string",
          description: "Mailing list ID to send the campaign to",
        },
        scheduleAt: {
          type: "string",
          description: "ISO 8601 timestamp to schedule the campaign",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional if set via environment variable)",
        },
      },
      required: ["name", "subject", "listId"],
    },
  },
  {
    name: "create_contact_list",
    description: "Create a new contact list for organizing email recipients.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "XEM Email API authentication token (optional if set via environment variable)",
        },
        name: {
          type: "string",
          description: "Name of the contact list",
        },
        description: {
          type: "string",
          description: "Description of the contact list",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional if set via environment variable)",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "add_contacts",
    description: "Add contacts to a mailing list.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "XEM Email API authentication token (optional if set via environment variable)",
        },
        listId: {
          type: "string",
          description: "ID of the mailing list to add contacts to",
        },
        contacts: {
          type: "array",
          description: "Array of contact objects to add",
          items: {
            type: "object",
            properties: {
              email: {
                type: "string",
                description: "Contact email address (required)",
              },
              name: {
                type: "string",
                description: "Contact name",
              },
              phone: {
                type: "string",
                description: "Contact phone number",
              },
            },
            required: ["email"],
          },
        },
        teamId: {
          type: "string",
          description: "Team ID (optional if set via environment variable)",
        },
      },
      required: ["listId", "contacts"],
    },
  },
  {
    name: "import_contacts",
    description:
      "Import contacts from a CSV file to a mailing list using file upload.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "XEM Email API authentication token (optional if set via environment variable)",
        },
        listId: {
          type: "string",
          description: "ID of the mailing list to import contacts to",
        },
        fileId: {
          type: "string",
          description: "File ID from a previous file upload",
        },
        mappings: {
          type: "object",
          description:
            'Field mappings for CSV columns (e.g., {"name": "name", "email": "email"})',
          additionalProperties: { type: "string" },
        },
        teamId: {
          type: "string",
          description: "Team ID (optional if set via environment variable)",
        },
      },
      required: ["listId", "fileId", "mappings"],
    },
  },
  {
    name: "get_contact_lists",
    description: "Get all contact lists for a team.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "XEM Email API authentication token (optional if set via environment variable)",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional if set via environment variable)",
        },
        page: {
          type: "number",
          description: "Page number for pagination",
          default: 0,
        },
        limit: {
          type: "number",
          description: "Number of items per page",
          default: 10,
        },
      },
      required: [],
    },
  },
  {
    name: "get_contacts",
    description: "Get contacts from a specific mailing list.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "XEM Email API authentication token (optional if set via environment variable)",
        },
        listId: {
          type: "string",
          description: "ID of the mailing list",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional if set via environment variable)",
        },
        page: {
          type: "number",
          description: "Page number for pagination",
          default: 0,
        },
        limit: {
          type: "number",
          description: "Number of items per page",
          default: 10,
        },
      },
      required: ["listId"],
    },
  },
];

// Create server instance
const server = new Server(
  {
    name: "xem-email-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (!args) {
      throw new Error("No arguments provided");
    }

    // Helper to get token and teamId from args or environment
    const getToken = (): string => {
      const token = (args.token as string) || API_TOKEN;
      if (!token) {
        throw new Error(
          "API token is required. Provide it via argument or XEM_API_TOKEN environment variable."
        );
      }
      return token;
    };

    const getTeamId = (): string | undefined => {
      return (args.teamId as string) || TEAM_ID;
    };

    switch (name) {
      case "send_email": {
        const token = getToken();
        const emailData: SendEmailRequest = {
          to: args.to as string,
          subject: args.subject as string,
          html: args.html as string | undefined,
          cc: args.cc as string | undefined,
          bcc: args.bcc as string | undefined,
          replyTo: args.replyTo as string | undefined,
          templateId: args.templateId as string | undefined,
          scheduleAt: args.scheduleAt as string | undefined,
          provider: (args.provider as string) || "CUSTOM",
          test: (args.test as boolean) || false,
          data: args.data as number[] | undefined,
        };

        const result = await apiRequest(
          "/email",
          token,
          "POST",
          emailData
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "create_campaign": {
        const token = getToken();
        const teamId = getTeamId();
        const campaignData: CreateCampaignRequest = {
          name: args.name as string,
          subject: args.subject as string,
          html: args.html as string | undefined,
          templateId: args.templateId as string | undefined,
          listId: args.listId as string,
          scheduleAt: args.scheduleAt as string | undefined,
          teamId: teamId,
        };

        const result = await apiRequest(
          "/campaigns",
          token,
          "POST",
          campaignData
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "create_contact_list": {
        const token = getToken();
        const teamId = getTeamId();
        const listData: CreateContactListRequest = {
          name: args.name as string,
          description: args.description as string | undefined,
          teamId: teamId,
        };

        const result = await apiRequest(
          "/mailing-list",
          token,
          "POST",
          listData
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "add_contacts": {
        const token = getToken();
        const teamId = getTeamId();
        const contactsData: AddContactsRequest = {
          listId: args.listId as string,
          contacts: args.contacts as AddContactsRequest["contacts"],
          teamId: teamId,
        };

        const result = await apiRequest(
          "/contacts",
          token,
          "POST",
          contactsData
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "import_contacts": {
        const token = getToken();
        const teamId = getTeamId();
        const importData: ImportContactsRequest = {
          listId: args.listId as string,
          fileId: args.fileId as string,
          mappings: args.mappings as Record<string, string>,
          teamId: teamId,
        };

        const result = await apiRequest(
          "/imports/contact",
          token,
          "POST",
          importData
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_contact_lists": {
        const token = getToken();
        const teamId = getTeamId();
        const page = (args.page as number) || 0;
        const limit = (args.limit as number) || 10;
        let endpoint = `/mailing-lists?page=${page}&limit=${limit}`;

        if (teamId) {
          endpoint += `&team_id=${teamId}`;
        }

        const result = await apiRequest(
          endpoint,
          token,
          "GET"
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_contacts": {
        const token = getToken();
        const teamId = getTeamId();
        const page = (args.page as number) || 0;
        const limit = (args.limit as number) || 10;
        let endpoint = `/contacts?list_id=${args.listId}&page=${page}&limit=${limit}`;

        if (teamId) {
          endpoint += `&team_id=${teamId}`;
        }

        const result = await apiRequest(
          endpoint,
          token,
          "GET"
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--token" && i + 1 < args.length) {
      API_TOKEN = args[i + 1];
      i++;
    } else if (args[i] === "--team-id" && i + 1 < args.length) {
      TEAM_ID = args[i + 1];
      i++;
    }
  }

  // Check environment variables
  if (!API_TOKEN) {
    API_TOKEN = process.env.XEM_API_TOKEN;
  }
  if (!TEAM_ID) {
    TEAM_ID = process.env.XEM_TEAM_ID;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("XEM Email MCP Server running on stdio");
  if (API_TOKEN) {
    console.error("API token configured from environment/args");
  }
  if (TEAM_ID) {
    console.error(`Team ID configured: ${TEAM_ID}`);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
