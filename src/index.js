/**
 * This is the main entry point for the Probot application
 * @param {import('probot').Probot} app
 */
const handleIssueOpened = require('./handlers/issueOpenedHandler');
const handlePullRequest = require('./handlers/pullRequestHandler');
const handleMasterPRVersionCheck = require('./handlers/masterPRVersionCheckHandler');

module.exports = (app) => {
  app.log.info("Entringer GitHub Bot is loaded!");

  // Handler for when issues are opened
  app.on("issues.opened", handleIssueOpened);

  // Handler for when PRs are opened or edited
  app.on(["pull_request.opened", "pull_request.edited"], handlePullRequest);
  
  // Handler for checking version in PRs targeting master
  app.on(["pull_request.opened", "pull_request.edited", "pull_request.synchronize"], handleMasterPRVersionCheck);
};
