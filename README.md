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
     - Repository metadata: Read-only (required for basic functionality)
     - Repository contents: Read-only (if your bot needs to read repository files)
   - Subscribe to events:
     - Issues
     - Issue comment
     - Pull request
     - Pull request review
     - Pull request review comment
4. After creating the app, navigate to the app settings
5. Scroll down to the "Private keys" section and click "Generate a private key"
   - This will download a `.pem` file to your computer
   - Keep this file secure as it contains sensitive credentials
6. Note your App ID which is displayed near the top of the page
7. Update your `.env` file with these values:

   ```env
   APP_ID=<your-app-id>
   PRIVATE_KEY=<contents-of-your-pem-file>
   WEBHOOK_SECRET=<your-webhook-secret>
   ```

   Note: For the PRIVATE_KEY, you'll need to open the .pem file and copy its contents, including the BEGIN and END lines

### Installing the GitHub App in a Repository

1. After creating your GitHub App, go to the "Install App" tab on your GitHub App's settings page
2. Choose the account where you want to install the app
3. Select either:
   - All repositories: To install the app on all repositories in the account
   - Only select repositories: To choose specific repositories
4. Click "Install"
5. If you want to install the app on additional repositories later:
   - Go to your GitHub account settings
   - Navigate to "Applications" > "GitHub Apps" > "Installed GitHub Apps"
   - Find your app and click "Configure"
   - Modify the repository access as needed

### Local Development with Smee.io

For local development, you'll need to forward GitHub's webhooks to your local machine:

1. Go to [Smee.io](https://smee.io/) and click "Start a new channel"
2. Copy the webhook proxy URL
3. Update your GitHub App's webhook URL with this Smee URL
4. Install the Smee client:

   ```bash
   npm install -g smee-client
   ```

5. Run the Smee client to forward webhooks to your local machine:

   ```bash
   smee --url https://smee.io/your-unique-url --target http://localhost:3000/api/github/webhooks
   ```

6. Start your bot in another terminal:

   ```bash
   npm run dev
   ```

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
