/**
 * Handler for checking version changes in PRs targeting master branch
 * @param {import('probot').Context} context 
 */
async function handleMasterPRVersionCheck(context) {
  const pr = context.payload.pull_request;
  
  // Only proceed if the target branch is master or main
  const targetBranch = pr.base.ref;
  if (targetBranch !== 'master' && targetBranch !== 'main') {
    return;
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
      // Version hasn't changed, create a comment
      const errorComment = context.issue({
        body: `🤖 *VERSION ERROR DETECTED!* ❌ 

**Entringer GitHub Bot** has detected that the version in \`package.json\` has not been updated in this PR targeting the ${targetBranch} branch.

Current version: \`${baseVersion}\`
PR version: \`${prVersion}\`

Please update the version according to semantic versioning:
- **Major version (x.0.0)**: Breaking changes
- **Minor version (0.x.0)**: New features, no breaking changes
- **Patch version (0.0.x)**: Bug fixes and minor changes

Update the version in your \`package.json\` file and push the changes to this PR.`,
      });
      return context.octokit.issues.createComment(errorComment);
    } else {
      // Version has been updated, create a success comment
      const successComment = context.issue({
        body: `🤖 *VERSION CHECK PASSED!* ✅ 

**Entringer GitHub Bot** has verified that the version in \`package.json\` has been properly updated.

Previous version: \`${baseVersion}\`
New version: \`${prVersion}\`

Thank you for maintaining good versioning practices, human!`,
      });
      return context.octokit.issues.createComment(successComment);
    }
  } catch (error) {
    // Handle errors (e.g., package.json not found)
    const errorComment = context.issue({
      body: `🤖 *SYSTEM ERROR!* ⚠️ 

**Entringer GitHub Bot** encountered an error while checking the package version:
\`\`\`
${error.message}
\`\`\`

Please ensure your repository has a valid \`package.json\` file in the root directory.`,
    });
    return context.octokit.issues.createComment(errorComment);
  }
}

module.exports = handleMasterPRVersionCheck;
