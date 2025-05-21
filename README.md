# GitHub Bot

A GitHub bot built with Probot that helps manage repositories by automating common tasks.

## Features

1. **Issue Comments**: Automatically comments on new issues to acknowledge receipt.
2. **PR Comments**: Automatically comments on new pull requests to acknowledge receipt.
3. **PR Title Validation**: Validates pull request titles to ensure they reference a valid issue number.

## Setup

### Prerequisites

- Node.js (version 16 or above)
- npm or yarn
- A GitHub account

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/fabricio-entringer/entringer-github-bot.git
   cd entringer-github-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   APP_ID=<your-app-id>
   PRIVATE_KEY=<your-private-key>
   WEBHOOK_SECRET=<your-webhook-secret>
   ```

### Creating a GitHub App

1. Go to your GitHub account settings
2. Navigate to "Developer settings" > "GitHub Apps" > "New GitHub App"
3. Fill in the required information:
   - GitHub App name: Your choice (e.g., "Issue and PR Bot")
   - Homepage URL: Can be the repository URL
   - Webhook URL: Your bot's URL or use a proxy like Smee.io for development
   - Webhook secret: Create a random string and save it
   - Permissions needed:
     - Issues: Read & Write
     - Pull requests: Read & Write
   - Subscribe to events:
     - Issues
     - Pull request
4. After creating the app, generate a private key and update your `.env` file

## Development

Start the bot in development mode:

```bash
npm run dev
```

For local development, you can use [Smee.io](https://smee.io/) to forward webhooks to your local machine.

## Testing

Run tests:

```bash
npm test
```

## Deployment

This bot can be deployed to various platforms:

- Heroku
- Azure
- AWS
- GitHub Actions

Follow the Probot deployment documentation for detailed instructions on each platform.

## License

ISC
