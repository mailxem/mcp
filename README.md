# XEM Email MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with the XEM Email API. This server enables sending emails, managing campaigns, creating contact lists, and managing contacts.

## Features

- **Send Email**: Send individual emails with HTML content, templates, scheduling, and more
- **Create Campaign**: Create email campaigns for mailing lists
- **Create Contact List**: Create and manage contact lists
- **Add Contacts**: Add individual contacts to mailing lists
- **Import Contacts**: Import contacts from CSV files
- **Get Contact Lists**: Retrieve all contact lists with pagination
- **Get Contacts**: Retrieve contacts from a specific list with pagination

## Installation

```bash
npm install
npm run build
```

## Configuration

### Environment Variables

You can configure the API token and Team ID using environment variables:

- `XEM_API_TOKEN`: Your XEM Email API token (required)
- `XEM_TEAM_ID`: Your Team ID (optional, if applicable to your account)

### Command Line Arguments

Alternatively, pass credentials as command line arguments:

- `--token <token>`: XEM Email API token
- `--team-id <team-id>`: Team ID

## Usage

### As an MCP Server

#### Option 1: Using Environment Variables

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "xem-email": {
      "command": "node",
      "args": ["/path/to/mcp/build/index.js"],
      "env": {
        "XEM_API_TOKEN": "your-api-token-here",
        "XEM_TEAM_ID": "your-team-id-here"
      }
    }
  }
}
```

#### Option 2: Using Command Line Arguments

```json
{
  "mcpServers": {
    "xem-email": {
      "command": "node",
      "args": [
        "/path/to/mcp/build/index.js",
        "--token", "your-api-token-here",
        "--team-id", "your-team-id-here"
      ]
    }
  }
}
```

**Note**: When token and teamId are configured via environment variables or CLI args, you don't need to provide them in each tool call. If both are set, the tool argument takes precedence.

### Available Tools

#### 1. send_email

Send an email using the XEM Email API.

**Required Parameters:**
- `to` (string): Recipient email address
- `subject` (string): Email subject line

**Optional Parameters:**
- `token` (string): XEM Email API token (only if not set via environment/args)
- `html` (string): HTML content of the email
- `cc` (string): CC email addresses (comma-separated)
- `bcc` (string): BCC email addresses (comma-separated)
- `replyTo` (string): Reply-to email address
- `templateId` (string): Template ID to use for the email
- `scheduleAt` (string): ISO 8601 timestamp to schedule the email
- `provider` (string): Email provider (default: "CUSTOM")
- `test` (boolean): Whether this is a test email (default: false)
- `data` (array): Additional data array

**Example (assuming token is set via environment):**
```json
{
  "to": "user@example.com",
  "subject": "Welcome!",
  "html": "<h1>Hello World</h1>",
  "test": true
}
```

#### 2. create_campaign

Create an email campaign that can be sent to a contact list.

**Required Parameters:**
- `name` (string): Campaign name
- `subject` (string): Email subject line
- `listId` (string): Mailing list ID to send the campaign to

**Optional Parameters:**
- `token` (string): XEM Email API token (only if not set via environment/args)
- `teamId` (string): Team ID (only if not set via environment/args)
- `html` (string): HTML content of the campaign email
- `templateId` (string): Template ID to use for the campaign
- `scheduleAt` (string): ISO 8601 timestamp to schedule the campaign

#### 3. create_contact_list

Create a new contact list for organizing email recipients.

**Required Parameters:**
- `name` (string): Name of the contact list

**Optional Parameters:**
- `token` (string): XEM Email API token (only if not set via environment/args)
- `teamId` (string): Team ID (only if not set via environment/args)
- `description` (string): Description of the contact list

#### 4. add_contacts

Add contacts to a mailing list.

**Required Parameters:**
- `listId` (string): ID of the mailing list to add contacts to
- `contacts` (array): Array of contact objects

**Optional Parameters:**
- `token` (string): XEM Email API token (only if not set via environment/args)
- `teamId` (string): Team ID (only if not set via environment/args)

**Contact Object:**
- `email` (string, required): Contact email address
- `name` (string, optional): Contact name
- `phone` (string, optional): Contact phone number

**Example (assuming token/teamId set via environment):**
```json
{
  "listId": "list-123",
  "contacts": [
    {
      "email": "john@example.com",
      "name": "John Doe",
      "phone": "+1234567890"
    },
    {
      "email": "jane@example.com",
      "name": "Jane Smith"
    }
  ]
}
```

#### 5. import_contacts

Import contacts from a CSV file to a mailing list using file upload.

**Required Parameters:**
- `listId` (string): ID of the mailing list to import contacts to
- `fileId` (string): File ID from a previous file upload
- `mappings` (object): Field mappings for CSV columns

**Optional Parameters:**
- `token` (string): XEM Email API token (only if not set via environment/args)
- `teamId` (string): Team ID (only if not set via environment/args)

**Example (assuming token/teamId set via environment):**
```json
{
  "listId": "list-123",
  "fileId": "file-456",
  "mappings": {
    "name": "name",
    "email": "email",
    "phone": "phone"
  }
}
```

#### 6. get_contact_lists

Get all contact lists for a team.

**Optional Parameters:**
- `token` (string): XEM Email API token (only if not set via environment/args)
- `teamId` (string): Team ID (only if not set via environment/args)
- `page` (number): Page number for pagination (default: 0)
- `limit` (number): Number of items per page (default: 10)

#### 7. get_contacts

Get contacts from a specific mailing list.

**Required Parameters:**
- `listId` (string): ID of the mailing list

**Optional Parameters:**
- `token` (string): XEM Email API token (only if not set via environment/args)
- `teamId` (string): Team ID (only if not set via environment/args)
- `page` (number): Page number for pagination (default: 0)
- `limit` (number): Number of items per page (default: 10)

## API Authentication

All tools require an API token from XEM Email. You can obtain this token from your XEM Email account dashboard.

**Important**: Keep your API token secure and never commit it to version control.

## Development

### Build
```bash
npm run build
```

### Watch mode
```bash
npm run watch
```

## Project Structure

```
mcp/
├── src/
│   └── index.ts          # Main MCP server implementation
├── build/                # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- `@modelcontextprotocol/sdk`: MCP SDK for building MCP servers
- `typescript`: TypeScript compiler
- `@types/node`: Node.js type definitions

## License

MIT
