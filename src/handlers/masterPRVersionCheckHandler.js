/**
 * Handler for checking version changes in PRs targeting master branch
 * This handler creates a GitHub Check Run that can block PRs from being merged if the version hasn't been updated
 * @param {import('probot').Context} context 
 */
async function handleMasterPRVersionCheck(context) {
  const pr = context.payload.pull_request;
  
  // Check if we have all the necessary properties before proceeding
  if (!pr || !pr.base || !pr.base.ref || !pr.head || !pr.head.sha) {
    context.log.info('Skipping version check: missing required properties in pull request payload');
    return;
  }
  
  // Only proceed if the target branch is master or main
  const targetBranch = pr.base.ref;
  if (targetBranch !== 'master' && targetBranch !== 'main') {
    context.log.info(`Skipping version check: PR is not targeting master or main branch (found ${targetBranch})`);
    return;
  }
  
  context.log.info(`Starting version check for PR #${pr.number} targeting ${targetBranch}`);
  
  // Start a Check Run - This is what will block the PR from being merged if it fails
  const headSha = pr.head.sha;
  let check;
  
  try {
    const checkParams = context.repo({
      name: 'Entringer Bot Version Check',
      head_sha: headSha,
      status: 'in_progress',
    });
    
    // Create the check run
    check = await context.octokit.checks.create(checkParams);
    context.log.info(`Created check run with ID: ${check.data.id}`);
  } catch (error) {
    context.log.error(`Error creating check run: ${error.message}`);
    // If check creation fails, we'll still attempt to create a comment
    // but won't be able to update a check
  }
  
  try {
    // Get the package.json from PR head branch
    const prPackageJson = await context.octokit.repos.getContent({
      owner: context.repo().owner,
      repo: context.repo().repo,
      path: 'package.json',
      ref: pr.head.sha
    });
    
    // Decode content
    const prPackageContent = Buffer.from(prPackageJson.data.content, 'base64').toString();
    const prPackage = JSON.parse(prPackageContent);
    const prVersion = prPackage.version;
    
    // Get package.json from target branch (master/main)
    const basePackageJson = await context.octokit.repos.getContent({
      owner: context.repo().owner,
      repo: context.repo().repo,
      path: 'package.json',
      ref: targetBranch
    });
    
    // Decode content
    const basePackageContent = Buffer.from(basePackageJson.data.content, 'base64').toString();
    const basePackage = JSON.parse(basePackageContent);
    const baseVersion = basePackage.version;
    
    // Compare versions
    if (prVersion === baseVersion) {
      // Version hasn't changed, fail the check and create a comment
      const failureMessage = `🤖 *VERSION ERROR DETECTED!* ❌ 

**Entringer GitHub Bot** has detected that the version in \`package.json\` has not been updated in this PR targeting the ${targetBranch} branch.

Current version: \`${baseVersion}\`
PR version: \`${prVersion}\`

⛔ **THIS PR IS BLOCKED FROM MERGING** ⛔

Please update the version according to semantic versioning:
- **Major version (x.0.0)**: Breaking changes
- **Minor version (0.x.0)**: New features, no breaking changes
- **Patch version (0.0.x)**: Bug fixes and minor changes

Update the version in your \`package.json\` file and push the changes to this PR.`;

      // Update the check to failure if check was created
      if (check) {
        try {
          const failureParams = context.repo({
            check_run_id: check.data.id,
            status: 'completed',
            conclusion: 'failure',
            output: {
              title: 'Version Not Updated - PR Blocked',
              summary: failureMessage,
              text: 'My sensors indicate that the version in package.json has not been updated from the version in the master branch. According to my programming, all PRs to master must include a version increment. This PR is blocked from merging until the version is updated.'
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
        const errorComment = context.issue({
          body: failureMessage,
        });
        await context.octokit.issues.createComment(errorComment);
        context.log.info('Created failure comment on PR');
      } catch (error) {
        context.log.error(`Error creating comment: ${error.message}`);
      }
    } else {
      // Version has been updated, pass the check and create a success comment
      const successMessage = `🤖 *VERSION CHECK PASSED!* ✅ 

**Entringer GitHub Bot** has verified that the version in \`package.json\` has been properly updated.

Previous version: \`${baseVersion}\`
New version: \`${prVersion}\`

Thank you for maintaining good versioning practices, human!`;

      // Update the check to success if check was created
      if (check) {
        try {
          const successParams = context.repo({
            check_run_id: check.data.id,
            status: 'completed',
            conclusion: 'success',
            output: {
              title: 'Version Correctly Updated',
              summary: successMessage,
              text: 'My circuits are pleased! The version in package.json has been properly updated from the version in the master branch. This PR is good to go from a versioning perspective.'
            }
          });
          
          await context.octokit.checks.update(successParams);
          context.log.info(`Updated check run ${check.data.id} with success conclusion`);
        } catch (error) {
          context.log.error(`Error updating check run: ${error.message}`);
        }
      }
      
      // Also leave a comment for visibility
      try {
        const successComment = context.issue({
          body: successMessage,
        });
        await context.octokit.issues.createComment(successComment);
        context.log.info('Created success comment on PR');
      } catch (error) {
        context.log.error(`Error creating comment: ${error.message}`);
      }
    }
  } catch (error) {
    // Handle errors (e.g., package.json not found)
    const errorMessage = `🤖 *SYSTEM ERROR!* ⚠️ 

**Entringer GitHub Bot** encountered an error while checking the package version:
\`\`\`
${error.message}
\`\`\`

⛔ **THIS PR IS BLOCKED FROM MERGING** ⛔

Please ensure your repository has a valid \`package.json\` file in the root directory.`;

    // Update the check to error if check was created
    if (check) {
      try {
        const errorParams = context.repo({
          check_run_id: check.data.id,
          status: 'completed',
          conclusion: 'failure',
          output: {
            title: 'Error During Version Check - PR Blocked',
            summary: errorMessage,
            text: 'My circuits encountered an unexpected error while attempting to verify the package.json version. This PR is blocked from merging until the issue is resolved. Please check the error message and ensure your repository is properly configured.'
          }
        });
        
        await context.octokit.checks.update(errorParams);
        context.log.info(`Updated check run ${check.data.id} with error conclusion - PR is blocked from merging`);
      } catch (updateError) {
        context.log.error(`Error updating check run: ${updateError.message}`);
      }
    }
    
    // Also leave a comment for visibility
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
    context.log.error(`Original error during version check: ${error.message}`);
    context.log.error(error.stack);
  }
}

module.exports = handleMasterPRVersionCheck;
