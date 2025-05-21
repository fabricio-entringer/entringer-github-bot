/**
 * Handler for when pull requests are opened or edited
 * @param {import('probot').Context} context 
 */
async function handlePullRequest(context) {
  const pr = context.payload.pull_request;
  const title = pr.title;
  
  // Regular expression to match issue numbers - looking for patterns like #123
  const issueNumberMatch = title.match(/#(\d+)/);
  
  if (!issueNumberMatch) {
    // No issue number found in PR title
    const warningComment = context.issue({
      body: "🤖 *ALERT! ALERT!* ⚠️ **Entringer GitHub Bot** detected a missing issue reference! Pull request title should reference an issue number (e.g., #123).",
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
      body: `🤖 *COMPUTING SUCCESS!* ✅ **Entringer GitHub Bot** has successfully linked this pull request to issue #${issueNumber}. Excellent work, human!`,
    });
    return context.octokit.issues.createComment(successComment);
  } catch (error) {
    // Issue doesn't exist or other error
    const errorComment = context.issue({
      body: `🤖 *ERROR! ERROR!* ❌ **Entringer GitHub Bot** could not compute issue #${issueNumber}. This issue does not exist in my database. Please check and try again!`,
    });
    return context.octokit.issues.createComment(errorComment);
  }
}

module.exports = handlePullRequest;
