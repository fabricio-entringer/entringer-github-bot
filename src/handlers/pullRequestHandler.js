/**
 * Handler for when pull requests are opened or edited
 * This handler creates a GitHub Check Run that can block PRs from being merged if they don't reference a valid issue
 * @param {import('probot').Context} context 
 */
async function handlePullRequest(context) {
  const pr = context.payload.pull_request;
  const title = pr.title;
  
  // Safely get head SHA if available, otherwise use a placeholder
  const headSha = pr.head && pr.head.sha ? pr.head.sha : 'missing-sha';
  
  context.log.info(`Starting issue reference check for PR #${pr.number}`);
  
  // Regular expression to match issue numbers - looking for patterns like #123
  const issueNumberMatch = title.match(/#(\d+)/);
  
  // Only create a check run if we have a valid SHA
  let check = null;
  if (headSha !== 'missing-sha') {
    try {
      // Start a Check Run
      const checkParams = context.repo({
        name: 'Entringer Bot Issue Reference Check',
        head_sha: headSha,
        status: 'in_progress',
      });
      
      // Create the check run
      check = await context.octokit.checks.create(checkParams);
      context.log.info(`Created check run with ID: ${check.data.id}`);
    } catch (error) {
      context.log.error(`Error creating check run: ${error.message}`);
    }
  } else {
    context.log.warn('Missing head SHA, cannot create check run');
  }
  
  if (!issueNumberMatch) {
    // No issue number found in PR title
    const failureMessage = "🤖 *ALERT! ALERT!* ⚠️ \n\n**Entringer GitHub Bot** detected a missing issue reference! Pull request title should reference an issue number (e.g., #123).\n\n⛔ **THIS PR IS BLOCKED FROM MERGING** ⛔\n\nPlease update the title to include a reference to an issue.";
    
    // Update check if available
    if (check) {
      try {
        const failureParams = context.repo({
          check_run_id: check.data.id,
          status: 'completed',
          conclusion: 'failure',
          output: {
            title: 'Missing Issue Reference - PR Blocked',
            summary: failureMessage,
            text: 'My sensors indicate that your pull request title does not contain a reference to an issue number. This PR is blocked from merging until you update the title to include a reference to an issue (e.g., "Fix login bug #123").'
          }
        });
        
        await context.octokit.checks.update(failureParams);
        context.log.info(`Updated check run ${check.data.id} with failure conclusion - PR is blocked from merging`);
      } catch (error) {
        context.log.error(`Error updating check run: ${error.message}`);
      }
    }
    
    // Also leave a comment for visibility
    try {
      const warningComment = context.issue({
        body: failureMessage,
      });
      await context.octokit.issues.createComment(warningComment);
      context.log.info('Created failure comment on PR');
    } catch (error) {
      context.log.error(`Error creating comment: ${error.message}`);
    }
    
    return;
  }
  
  const issueNumber = parseInt(issueNumberMatch[1], 10);
  
  try {
    // Check if the issue exists in the repository
    await context.octokit.issues.get(context.repo({
      issue_number: issueNumber
    }));
    
    // Issue exists, mark check as successful if available
    const successMessage = `🤖 *COMPUTING SUCCESS!* ✅ \n\n**Entringer GitHub Bot** has successfully linked this pull request to issue #${issueNumber}. Excellent work, human!`;
    
    if (check) {
      try {
        const successParams = context.repo({
          check_run_id: check.data.id,
          status: 'completed',
          conclusion: 'success',
          output: {
            title: 'Issue Reference Verified',
            summary: successMessage,
            text: `My circuits are humming with satisfaction! This pull request has been properly linked to issue #${issueNumber}. Thank you for following proper protocol, human collaborator!`
          }
        });
        
        await context.octokit.checks.update(successParams);
        context.log.info(`Updated check run ${check.data.id} with success conclusion`);
      } catch (error) {
        context.log.error(`Error updating check run: ${error.message}`);
      }
    }
    
    // Also leave a success comment
    try {
      const successComment = context.issue({
        body: successMessage,
      });
      await context.octokit.issues.createComment(successComment);
      context.log.info('Created success comment on PR');
    } catch (error) {
      context.log.error(`Error creating comment: ${error.message}`);
    }
  } catch (error) {
    // Issue doesn't exist or other error
    const errorMessage = `🤖 *ERROR! ERROR!* ❌ \n\n**Entringer GitHub Bot** could not compute issue #${issueNumber}. This issue does not exist in my database.\n\n⛔ **THIS PR IS BLOCKED FROM MERGING** ⛔\n\nPlease check the issue number and try again!`;
    
    // Update check if available
    if (check) {
      try {
        const errorParams = context.repo({
          check_run_id: check.data.id,
          status: 'completed',
          conclusion: 'failure',
          output: {
            title: 'Referenced Issue Not Found - PR Blocked',
            summary: errorMessage,
            text: `My scanners have detected a reference to issue #${issueNumber}, but I cannot locate this issue in the repository database. This PR is blocked from merging until you reference a valid issue.`
          }
        });
        
        await context.octokit.checks.update(errorParams);
        context.log.info(`Updated check run ${check.data.id} with failure conclusion - PR is blocked from merging`);
      } catch (updateError) {
        context.log.error(`Error updating check run: ${updateError.message}`);
      }
    }
    
    // Also leave an error comment
    try {
      const errorComment = context.issue({
        body: errorMessage,
      });
      await context.octokit.issues.createComment(errorComment);
      context.log.info('Created error comment on PR');
    } catch (commentError) {
      context.log.error(`Error creating comment: ${commentError.message}`);
    }
    
    // Log the original error for debugging
    context.log.error(`Original error checking issue: ${error.message}`);
    context.log.error(error.stack);
  }
}

module.exports = handlePullRequest;
