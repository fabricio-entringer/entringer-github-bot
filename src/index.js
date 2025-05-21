/**
 * This is the main entry point for the Probot application
 * @param {import('probot').Probot} app
 */
module.exports = (app) => {
  app.log.info("Entringer GitHub Bot is loaded!");

  // Handler for when issues are opened
  app.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue! Entringer GitHub Bot here - our team will review your issue shortly.",
    });
    return context.octokit.issues.createComment(issueComment);
  });

  // Handler for when PRs are opened or edited
  app.on(["pull_request.opened", "pull_request.edited"], async (context) => {
    const pr = context.payload.pull_request;
    const title = pr.title;
    
    // Regular expression to match issue numbers - looking for patterns like #123
    const issueNumberMatch = title.match(/#(\d+)/);
    
    if (!issueNumberMatch) {
      // No issue number found in PR title
      const warningComment = context.issue({
        body: "⚠️ [Entringer GitHub Bot] Pull request title should reference an issue number (e.g., #123).",
      });
      return context.octokit.issues.createComment(warningComment);
    }
    
    const issueNumber = parseInt(issueNumberMatch[1], 10);
    
    try {
      // Check if the issue exists in the repository
      await context.octokit.issues.get(context.repo({
        issue_number: issueNumber
      }));
      
      // Issue exists, add a success comment
      const successComment = context.issue({
        body: `✅ [Entringer GitHub Bot] Pull request successfully linked to issue #${issueNumber}.`,
      });
      return context.octokit.issues.createComment(successComment);
    } catch (error) {
      // Issue doesn't exist or other error
      const errorComment = context.issue({
        body: `❌ [Entringer GitHub Bot] Referenced issue #${issueNumber} does not exist in this repository.`,
      });
      return context.octokit.issues.createComment(errorComment);
    }
  });
};
