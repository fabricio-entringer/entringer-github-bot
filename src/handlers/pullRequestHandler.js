/**
 * Handler for when pull requests are opened or edited
 * @param {import('probot').Context} context 
 */
async function handlePullRequest(context) {
  const pr = context.payload.pull_request;
  const title = pr.title;
  
  // Safely get head SHA if available, otherwise use a placeholder
  const headSha = pr.head && pr.head.sha ? pr.head.sha : 'missing-sha';
  
  // Regular expression to match issue numbers - looking for patterns like #123
  const issueNumberMatch = title.match(/#(\d+)/);
  
  // Only create a check run if we have a valid SHA
  let check = null;
  if (headSha !== 'missing-sha') {
    // Start a Check Run
    const checkParams = context.repo({
      name: 'Entringer Bot Issue Reference Check',
      head_sha: headSha,
      status: 'in_progress',
    });
    
    // Create the check run
    check = await context.octokit.checks.create(checkParams);
  }
  
  if (!issueNumberMatch) {
    // No issue number found in PR title
    
    // Update check if available
    if (check) {
      const failureParams = context.repo({
        check_run_id: check.data.id,
        status: 'completed',
        conclusion: 'failure',
        output: {
          title: 'Missing Issue Reference',
          summary: '🤖 *ALERT! ALERT!* ⚠️ **Entringer GitHub Bot** detected a missing issue reference! Pull request title should reference an issue number (e.g., #123).',
          text: 'My sensors indicate that your pull request title does not contain a reference to an issue number. Please update the title to include a reference to an issue (e.g., "Fix login bug #123").'
        }
      });
      
      await context.octokit.checks.update(failureParams);
    }
    
    // Also leave a comment for visibility
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
    
    // Issue exists, mark check as successful if available
    if (check) {
      const successParams = context.repo({
        check_run_id: check.data.id,
        status: 'completed',
        conclusion: 'success',
        output: {
          title: 'Issue Reference Verified',
          summary: `🤖 *COMPUTING SUCCESS!* ✅ **Entringer GitHub Bot** has successfully linked this pull request to issue #${issueNumber}. Excellent work, human!`,
          text: `My circuits are humming with satisfaction! This pull request has been properly linked to issue #${issueNumber}. Thank you for following proper protocol, human collaborator!`
        }
      });
      
      await context.octokit.checks.update(successParams);
    }
    
    // Also leave a success comment
    const successComment = context.issue({
      body: `🤖 *COMPUTING SUCCESS!* ✅ **Entringer GitHub Bot** has successfully linked this pull request to issue #${issueNumber}. Excellent work, human!`,
    });
    return context.octokit.issues.createComment(successComment);
  } catch (error) {
    // Issue doesn't exist or other error
    
    // Update check if available
    if (check) {
      const errorParams = context.repo({
        check_run_id: check.data.id,
        status: 'completed',
        conclusion: 'failure',
        output: {
          title: 'Referenced Issue Not Found',
          summary: `🤖 *ERROR! ERROR!* ❌ **Entringer GitHub Bot** could not compute issue #${issueNumber}. This issue does not exist in my database.`,
          text: `My scanners have detected a reference to issue #${issueNumber}, but I cannot locate this issue in the repository database. Please verify the issue number exists and try again.`
        }
      });
      
      await context.octokit.checks.update(errorParams);
    }
    
    // Also leave an error comment
    const errorComment = context.issue({
      body: `🤖 *ERROR! ERROR!* ❌ **Entringer GitHub Bot** could not compute issue #${issueNumber}. This issue does not exist in my database. Please check and try again!`,
    });
    return context.octokit.issues.createComment(errorComment);
  }
}

module.exports = handlePullRequest;
