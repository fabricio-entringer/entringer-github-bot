/**
 * Handler for when issues are opened
 * @param {import('probot').Context} context 
 */
async function handleIssueOpened(context) {
  const issueComment = context.issue({
    body: "🤖 Beep boop! Thanks for opening this issue! **Entringer GitHub Bot** here - our team will review your issue shortly!",
  });
  return context.octokit.issues.createComment(issueComment);
}

module.exports = handleIssueOpened;
