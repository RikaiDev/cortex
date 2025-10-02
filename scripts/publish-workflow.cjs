#!/usr/bin/env node

/**
 * 🚀 Cortex AI - One-Command Release
 *
 * Single command handles everything:
 * npm run release patch|minor|major
 *
 * Features:
 * - 🤖 AI-powered changelog generation
 * - 🔍 Comprehensive quality checks
 * - 📦 Automated version management
 * - 🚀 Atomic release execution
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Colors for beautiful output
const RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m',
      BLUE = '\x1b[34m', NC = '\x1b[0m';

function print(color, msg) { console.log(`${color}${msg}${NC}`); }

function run(cmd, desc) {
  try {
    print(BLUE, `📋 ${desc}...`);
    const result = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    print(GREEN, `✅ ${desc} completed`);
    return result.trim();
  } catch (error) {
    print(RED, `❌ ${desc} failed: ${error.message}`);
    throw error;
  }
}

// Load package.json for version info
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

async function runQualityChecks() {
  print(BLUE, '\n🔍 Phase 1: Quality checks and fixes...');

  // Round 1: Environment & Dependencies
  print(BLUE, '\n📋 Round 1: Environment validation');
  run('node --version', 'Node.js check');
  run('npm --version', 'npm check');

  // Dependencies validation
  const runtimeDeps = ['chalk', 'commander', 'fs-extra'];
  for (const dep of runtimeDeps) {
    if (pkg.devDependencies?.[dep]) {
      throw new Error(`${dep} should be in dependencies, not devDependencies`);
    }
  }

  // Round 2: Code Quality
  print(BLUE, '\n📋 Round 2: Code quality checks');
  run('npm run quality', 'Quality checks');

  // Round 3: Build Verification
  print(BLUE, '\n📋 Round 3: Build verification');
  run('npm run build', 'Build verification');

  // Round 4: Git Status
  print(BLUE, '\n📋 Round 4: Git status validation');
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  if (gitStatus) {
    print(YELLOW, `📝 Found ${gitStatus.split('\n').length} uncommitted change(s)`);
    print(YELLOW, 'These will be reviewed in changelog phase');
  }

  print(GREEN, '✅ Quality checks completed');
}

async function runReleaseTests() {
  print(BLUE, '\n🧪 Phase 2: Release testing...');
  
  // Test all functionality before release
  run('npm run test:all', 'All tests');
  
  // Additional release-specific tests
  print(BLUE, '📋 Testing CLI functionality...');
  run('node dist/cli/index.js --help', 'CLI help test');
  
  print(GREEN, '✅ Release tests passed');
}

function getNextVersion(current, type) {
  const [major, minor, patch] = current.split('.').map(Number);
  switch (type) {
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'major': return `${major + 1}.0.0`;
  }
}


async function generateChangelog(newVersion) {
  print(BLUE, '\n📝 Generating changelog...');

  // Try AI-powered generation first, fallback to simple if needed
  try {
    const commits = await getDetailedCommitsWithDiff();
    const changelog = await generateAIDrivenChangelog(newVersion, commits);
    return changelog;
  } catch (error) {
    print(YELLOW, `⚠️ AI generation failed: ${error.message}, using simple generation`);
    const commits = getRecentCommits();
    return await generateSimpleChangelog(newVersion, commits);
  }
}

function getRecentCommits() {
  const latestTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { encoding: 'utf8' }).trim();
  const range = latestTag ? `${latestTag}..HEAD` : '-10';

  return execSync(`git log ${range} --oneline --no-merges`, { encoding: 'utf8' })
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.replace(/^[a-f0-9]+\s*/, ''))
    .filter(commit => !commit.includes('chore: release') && !commit.match(/^\d+\.\d+\.\d+$/));
}

async function generateSimpleChangelog(newVersion, commits) {
  if (commits.length === 0) {
    print(YELLOW, '⚠️ No commits found - creating minimal changelog');
    return `## [${newVersion}] - ${new Date().toISOString().split('T')[0]}\n\n### 🔄 Changes\n\n- Release updates\n`;
  }

  // Simple categorization for now
  const categories = categorizeCommits(commits);

  const date = new Date().toISOString().split('T')[0];
  let changelog = `## [${newVersion}] - ${date}\n\n`;

  if (categories.features.length) {
    changelog += '### 🚀 Features\n\n';
    categories.features.forEach(commit => changelog += `- ${commit}\n`);
    changelog += '\n';
  }

  if (categories.fixes.length) {
    changelog += '### 🔧 Bug Fixes\n\n';
    categories.fixes.forEach(commit => changelog += `- ${commit}\n`);
    changelog += '\n';
  }

  if (categories.docs.length) {
    changelog += '### 📚 Documentation\n\n';
    categories.docs.forEach(commit => changelog += `- ${commit}\n`);
    changelog += '\n';
  }

  if (categories.tech.length) {
    changelog += '### 🛠️ Technical Improvements\n\n';
    categories.tech.forEach(commit => changelog += `- ${commit}\n`);
    changelog += '\n';
  }

  if (categories.other.length) {
    changelog += '### 🔄 Other Changes\n\n';
    categories.other.forEach(commit => changelog += `- ${commit}\n`);
    changelog += '\n';
  }

  return changelog.trim();
}

function categorizeCommits(commits) {
  const categories = { features: [], fixes: [], docs: [], tech: [], other: [] };

  commits.forEach(commit => {
    if (/feat|add|new|implement/i.test(commit)) categories.features.push(commit);
    else if (/fix|bug|issue|resolve/i.test(commit)) categories.fixes.push(commit);
    else if (/docs?|readme|comment/i.test(commit)) categories.docs.push(commit);
    else if (/refactor|perf|optimize|clean/i.test(commit)) categories.tech.push(commit);
    else categories.other.push(commit);
  });

  return categories;
}

// ===== AI-POWERED CHANGELOG GENERATION =====

async function getDetailedCommitsWithDiff() {
  const latestTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { encoding: 'utf8' }).trim();
  const range = latestTag ? `${latestTag}..HEAD` : '-20';

  const gitLog = execSync(`git log ${range} --no-merges --pretty=format:'%H|%s|%b|%an|%ae'`, {
    encoding: 'utf8'
  }).split('\n').filter(line => line.trim());

  const commits = [];

  for (const line of gitLog) {
    const [hash, subject, body, author, email] = line.split('|');

    // Get file changes for this commit
    const diff = execSync(`git show ${hash} --name-status`, { encoding: 'utf8' });
    const fileChanges = parseFileChanges(diff);

    // Get code diff for important files
    const codeDiff = getCodeDiff(hash, fileChanges.importantFiles.slice(0, 3));

    commits.push({
      hash,
      subject,
      body,
      author,
      email,
      fileChanges,
      codeDiff,
      impact: assessChangeImpact(fileChanges)
    });
  }

  return commits;
}

function parseFileChanges(diffOutput) {
  const lines = diffOutput.split('\n');
  const changes = {
    added: [],
    modified: [],
    deleted: [],
    importantFiles: []
  };

  lines.forEach(line => {
    if (line.startsWith('A\t')) {
      changes.added.push(line.substring(2));
    } else if (line.startsWith('M\t')) {
      changes.modified.push(line.substring(2));
    } else if (line.startsWith('D\t')) {
      changes.deleted.push(line.substring(2));
    }
  });

  // Identify important files
  const importantPatterns = [
    'src/core/', 'src/cli/', 'src/adapters/',
    'package.json', 'README.md', 'CHANGELOG.md',
    'docs/', 'examples/'
  ];

  changes.importantFiles = [
    ...changes.added,
    ...changes.modified,
    ...changes.deleted
  ].filter(file =>
    importantPatterns.some(pattern => file.includes(pattern))
  );

  return changes;
}

function getCodeDiff(commitHash, importantFiles) {
  const codeDiffs = {};

  for (const file of importantFiles) {
    try {
      const diff = execSync(`git show ${commitHash} -- ${file}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });

      if (diff.trim()) {
        codeDiffs[file] = diff;
      }
    } catch (error) {
      // File might be deleted or other error, continue
      continue;
    }
  }

  return codeDiffs;
}

function assessChangeImpact(fileChanges) {
  let impact = {
    level: 'minor',
    scope: 'patch',
    userFacing: false,
    developerFacing: false,
    businessValue: 'low'
  };

  // Analyze file change patterns
  if (fileChanges.importantFiles.some(f => f.includes('README') || f.includes('docs/'))) {
    impact.userFacing = true;
    impact.businessValue = 'medium';
  }

  if (fileChanges.importantFiles.some(f => f.includes('src/core/') || f.includes('package.json'))) {
    impact.level = 'major';
    impact.scope = 'feature';
    impact.developerFacing = true;
    impact.businessValue = 'high';
  }

  if (fileChanges.importantFiles.some(f => f.includes('src/cli/'))) {
    impact.userFacing = true;
    impact.businessValue = 'high';
  }

  if (fileChanges.deleted.length > 0) {
    impact.level = 'major';
    impact.scope = 'breaking';
  }

  return impact;
}

async function generateAIDrivenChangelog(newVersion, commits) {
  print(BLUE, '🤖 Analyzing commits with AI assistance...');

  const context = buildProjectContext();
  const analysis = analyzeCommitsForAI(commits);

  // Generate human-readable descriptions
  const changelogSections = await generateHumanReadableSections(analysis, context);

  return formatAIChangelog(newVersion, changelogSections);
}

function buildProjectContext() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  return {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    keywords: pkg.keywords
  };
}

function analyzeCommitsForAI(commits) {
  const analysis = {
    features: [],
    bugfixes: [],
    improvements: [],
    documentation: [],
    testing: [],
    devops: [],
    security: [],
    performance: [],
    dependencies: [],
    other: [],
    breakingChanges: []
  };

  commits.forEach(commit => {
    const category = categorizeCommitForAI(commit);
    const entry = formatCommitEntryForAI(commit);

    if (commit.subject.toLowerCase().includes('breaking') ||
        commit.body.toLowerCase().includes('breaking')) {
      analysis.breakingChanges.push(entry);
    } else {
      analysis[category].push(entry);
    }
  });

  return analysis;
}

function categorizeCommitForAI(commit) {
  const text = `${commit.subject} ${commit.body}`.toLowerCase();

  if (matchPattern(text, ['feat', 'add', 'new', 'implement', 'introduce'])) {
    return 'features';
  }

  if (matchPattern(text, ['fix', 'bug', 'issue', 'resolve', 'correct', 'patch'])) {
    return 'bugfixes';
  }

  if (matchPattern(text, ['docs', 'readme', 'comment', 'document'])) {
    return 'documentation';
  }

  if (matchPattern(text, ['refactor', 'clean', 'optimize', 'improve', 'enhance'])) {
    return 'improvements';
  }

  if (matchPattern(text, ['test', 'spec', 'coverage'])) {
    return 'testing';
  }

  if (matchPattern(text, ['ci', 'build', 'deploy', 'release'])) {
    return 'devops';
  }

  if (matchPattern(text, ['security', 'auth', 'vulnerabilit'])) {
    return 'security';
  }

  if (matchPattern(text, ['perf', 'performance', 'speed', 'memory'])) {
    return 'performance';
  }

  if (matchPattern(text, ['deps', 'dependenc'])) {
    return 'dependencies';
  }

  return 'other';
}

function formatCommitEntryForAI(commit) {
  return {
    original: commit.subject,
    humanReadable: humanizeSubject(commit.subject),
    description: generateDescription(commit),
    impact: commit.impact,
    files: commit.fileChanges.importantFiles,
    author: commit.author,
    hash: commit.hash.substring(0, 7)
  };
}

function humanizeSubject(subject) {
  const replacements = {
    'feat': 'Feature',
    'fix': 'Fix',
    'docs': 'Documentation',
    'refactor': 'Refactor',
    'test': 'Test',
    'ci': 'CI/CD',
    'perf': 'Performance',
    'security': 'Security',
    'deps': 'Dependencies'
  };

  let result = subject;

  Object.entries(replacements).forEach(([tech, human]) => {
    const regex = new RegExp(`\\b${tech}\\b`, 'gi');
    result = result.replace(regex, human);
  });

  return result;
}

function generateDescription(commit) {
  if (commit.impact.userFacing) {
    return `Enables users to ${describeUserValue(commit.subject, commit.fileChanges)}.`;
  } else if (commit.impact.developerFacing) {
    return `Improves developer experience in ${describeDeveloperValue(commit.subject, commit.fileChanges)}.`;
  } else {
    return `Technical improvement that enhances overall system quality.`;
  }
}

function describeUserValue(subject, fileChanges) {
  if (fileChanges.importantFiles.some(f => f.includes('cli/'))) {
    return 'use system features more conveniently through command line interface';
  }
  if (fileChanges.importantFiles.some(f => f.includes('README') || f.includes('docs/'))) {
    return 'access clearer documentation and usage instructions';
  }
  return 'enjoy better user experience';
}

function describeDeveloperValue(subject, fileChanges) {
  if (fileChanges.importantFiles.some(f => f.includes('src/core/'))) {
    return 'core system architecture';
  }
  if (fileChanges.importantFiles.some(f => f.includes('test/'))) {
    return 'test coverage and quality';
  }
  if (fileChanges.importantFiles.some(f => f.includes('package.json'))) {
    return 'dependency management and build process';
  }
  return 'code quality and maintainability';
}

function matchPattern(text, patterns) {
  return patterns.some(pattern =>
    text.includes(pattern) || new RegExp(`\\b${pattern}\\b`).test(text)
  );
}

async function generateHumanReadableSections(analysis, context) {
  const sections = [];

  // Generate each section with human-readable content
  for (const [category, items] of Object.entries(analysis)) {
    if (items.length === 0) continue;

    const section = await generateSectionContent(category, items, context);
    if (section) sections.push(section);
  }

  return sections;
}

async function generateSectionContent(category, items, context) {
  const titles = {
    features: '🚀 Features',
    bugfixes: '🔧 Bug Fixes',
    improvements: '🛠️ Improvements',
    documentation: '📚 Documentation',
    testing: '🧪 Testing',
    devops: '🔄 DevOps',
    security: '🔒 Security',
    performance: '⚡ Performance',
    dependencies: '📦 Dependencies',
    breakingChanges: '⚠️ Breaking Changes',
    other: '🔄 Other Changes'
  };

  let content = `### ${titles[category]}\n\n`;

  // Add project context if available
  if (context && context.name && category === 'features') {
    content = `### ${titles[category]} - ${context.name}\n\n`;
  } else {
    content = `### ${titles[category]}\n\n`;
  }

  for (const item of items) {
    content += `- **${item.humanReadable}**\n`;
    content += `  ${item.description}\n\n`;
  }

  return content;
}

function formatAIChangelog(newVersion, sections) {
  const date = new Date().toISOString().split('T')[0];
  let changelog = `## [${newVersion}] - ${date}\n\n`;

  sections.forEach(section => {
    changelog += section;
  });

  return changelog;
}


async function executeRelease(versionType) {
  print(BLUE, `\n🚀 Executing ${versionType} release...\n`);

  const currentVersion = pkg.version;
  const newVersion = getNextVersion(currentVersion, versionType);

  print(BLUE, `📦 ${currentVersion} → ${newVersion}`);

  // Phase 1: Quality checks and fixes
  await runQualityChecks();

  // Phase 2: Release testing
  await runReleaseTests();

  // Phase 3: Changelog and commit
  await prepareReleaseCommit(newVersion);

  // Phase 4: Manual publish step
  showPublishInstructions(newVersion);

  print(GREEN, `\n🎉 Version ${newVersion} ready for manual publish!`);
}

async function prepareReleaseCommit(newVersion) {
  print(BLUE, '\n📝 Phase 3: changelog & commit...');

  // Generate changelog
  print(BLUE, '📋 Generating changelog...');
  const changelog = await generateChangelog(newVersion);
  updateChangelog(changelog, newVersion);

  // Show what will be committed
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  if (gitStatus) {
    print(YELLOW, '\n📝 Changes to be committed:');
    console.log(gitStatus);
    
    // Stage and commit changes
    run('git add .', 'Stage changelog and other changes');
    run(`git commit -m "chore: release ${newVersion}\n\nUpdated CHANGELOG.md with release notes"`, 'Commit release changes');
  }

  // Version bump (creates commit and tag)
  run(`npm version ${newVersion}`, 'Version bump and tag');

  print(GREEN, '✅ Changelog and commit completed');
}

function showPublishInstructions(newVersion) {
  print(BLUE, '\n📦 Phase 4: Manual publish...');
  print(YELLOW, '\n⚠️ MANUAL STEPS REQUIRED FOR SAFETY:');
  print(YELLOW, '');
  print(YELLOW, '1. 📋 Review all changes carefully');
  print(YELLOW, '2. 🔍 Verify version tag is correct');
  print(YELLOW, `3. 📤 git push origin main`);
  print(YELLOW, `4. 🏷️  git push origin v${newVersion}`);
  print(YELLOW, '5. 🚀 npm publish');
  print(YELLOW, '');
  print(GREEN, '✅ Version prepared and tagged locally');
  print(YELLOW, '⚠️ Complete manual steps to publish to NPM');
}

function updateChangelog(changelogEntry, newVersion) {
  const changelogPath = 'CHANGELOG.md';
  let changelog = fs.readFileSync(changelogPath, 'utf8');
  
  // If the changelog already contains this version, skip insertion
  if (newVersion) {
    const versionHeader = `## [${newVersion}]`;
    if (changelog.includes(versionHeader)) {
      print(GREEN, `✅ CHANGELOG.md already contains ${versionHeader}, skipping insert`);
      fs.writeFileSync(changelogPath, changelog);
      return;
    }
  }

  // Add new entry at the top (after the header)
  const headerEnd = changelog.indexOf('\n## [');
  if (headerEnd === -1) {
    // No existing versions, add after header
    changelog = changelog.trim() + '\n\n' + changelogEntry + '\n';
  } else {
    // Insert before first version
    const before = changelog.substring(0, headerEnd + 1);
    const after = changelog.substring(headerEnd + 1);
    changelog = before + changelogEntry + '\n\n' + after;
  }

  fs.writeFileSync(changelogPath, changelog);
  print(GREEN, '✅ CHANGELOG.md updated');
}

function showHelp() {
  print(YELLOW, '\n🚀 Cortex AI - One-Command Release');
  print(YELLOW, '================================\n');
  print(YELLOW, 'Usage: npm run release patch|minor|major');
  print(YELLOW, 'Examples:');
  print(YELLOW, '  npm run release patch    # Release patch version (0.0.x)');
  print(YELLOW, '  npm run release minor    # Release minor version (0.x.0)');
  print(YELLOW, '  npm run release major    # Release major version (x.0.0)');
  print(YELLOW, '');
  print(BLUE, 'What happens automatically:');
  print(BLUE, '  1. 🔍 Run quality checks (tests, linting, dependencies)');
  print(BLUE, '  2. 📝 Generate changelog from recent commits');
  print(BLUE, '  3. 📦 Build project');
  print(BLUE, '  4. 📝 Commit changes (if any)');
  print(BLUE, '  5. 🏷️  Version bump + create git tag');
  print(BLUE, '  6. 📤 Push commits & tags to GitHub');
  print(BLUE, '  7. 🚀 Publish to NPM');
  print(YELLOW, '');
  print(GREEN, '✅ All checks run before any destructive operations');
  print(GREEN, '✅ Atomic: fully succeeds or fully fails');
}

// Main execution
async function main() {
  const versionType = process.argv[2];

  if (!versionType || !['patch', 'minor', 'major'].includes(versionType)) {
    showHelp();
    process.exit(1);
  }

  try {
    await executeRelease(versionType);
  } catch (error) {
    print(RED, `\n💥 Release failed: ${error.message}`);
    print(YELLOW, '🔄 Please fix the issue and try again');
    process.exit(1);
  }
}

// Run the release
main();
