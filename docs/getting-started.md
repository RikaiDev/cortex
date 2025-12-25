# Getting Started with Cortex AI

Welcome to Cortex AI! This guide will help you get up and running with the Stable Workflow System for reliable, quality-driven AI-assisted development.

---

## Quick Installation

### Option 1: Global Installation (Recommended)

```bash
npm install -g @rikaidev/cortex
```

Benefits:
- Tool stays installed and available everywhere
- No need to prefix commands with `npx`
- Faster execution (no download on each use)

### Option 2: npx (No Installation)

```bash
npx @rikaidev/cortex init
```

Good for:
- One-time usage
- Testing before committing to installation
- CI/CD environments

---

## Setup MCP Client

Cortex AI uses MCP (Model Context Protocol) to integrate with AI assistants.

### Cursor

1. Open **Cursor Settings**
2. Navigate to **MCP** section
3. Add new server configuration:

```json
{
  "mcpServers": {
    "cortex-ai": {
      "command": "npx",
      "args": ["-y", "@rikaidev/cortex@latest", "start"]
    }
  }
}
```

4. Restart Cursor
5. Verify by typing `/cortex.` in chat - you should see available commands

### Claude Code

```bash
claude mcp add cortex npx -y @rikaidev/cortex@latest start
```

Verify:
```bash
claude mcp list  # Should show cortex-ai
```

### VS Code

If using MCP extension for VS Code:

```bash
code --add-mcp '{"name":"cortex-ai","command":"npx","args":["-y","@rikaidev/cortex@latest","start"]}'
```

Or manually add to VS Code MCP settings.

---

## Your First Feature

Let's walk through creating a complete feature using the Stable Workflow System.

### Step 1: Initialize Project

```bash
cd your-project
cortex init
```

**What this does**:
- Creates `.cortex/` directory
- Copies templates (spec, plan, tasks, etc.)
- Initializes memory system
- Sets up constitution template

**You'll see**:
```
✓ Cortex workspace initialized
✓ Templates copied to .cortex/templates/
✓ Memory system initialized
✓ Ready for development

Next steps:
1. Review .cortex/constitution.md
2. Start your first feature with: cortex spec "<description>"
```

### Step 2: Setup Constitution (Optional but Recommended)

The constitution defines your project's principles and quality standards.

```bash
# In your AI assistant (Cursor/Claude/etc.)
/cortex.constitution Create principles for code quality, testing standards, and performance requirements
```

**What happens**:
- AI loads the constitution template
- Fills in project-specific principles
- Saves to `.cortex/constitution.md`
- These principles apply to ALL future workflows

**Example output**:
```markdown
# Project Constitution

## Principles

### Code Quality
- Use TypeScript with strict mode
- No `any` types without justification
- Comprehensive error handling

### Testing
- Test-first development
- Integration tests for all features
- Minimum 80% coverage

### Performance
- Page load < 2 seconds
- API response < 500ms
- ...
```

### Step 3: Create Specification

```bash
cortex spec "Add user authentication with email and password login"
```

**What happens**:
1. Workflow created with ID: `001-add-user-authentication`
2. AI loads spec template and command
3. AI generates structured specification
4. Requirements checklist auto-generated
5. File saved to `.cortex/workflows/001-add-user-authentication/spec.md`

**Output**:
```
✓ Workflow 001-add-user-authentication created

Files generated:
- .cortex/workflows/001-add-user-authentication/spec.md
- .cortex/workflows/001-add-user-authentication/checklists/requirements.md

Next steps:
- Review spec.md to verify requirements
- If unclear, run: cortex clarify 001-add-user-authentication
- If clear, run: cortex plan 001-add-user-authentication
```

### Step 4: Clarify (Optional)

If requirements are ambiguous or incomplete, use clarify:

```bash
cortex clarify 001-add-user-authentication
```

**What happens**:
1. AI scans spec.md across 11 ambiguity categories
2. AI asks up to 5 targeted questions (one at a time)
3. You answer each question
4. AI updates spec.md with clarifications
5. Clarifications saved to `clarifications.md`

**Example Q&A**:
```
AI: "Should password reset be supported in MVP?"
You: "Yes, via email link with 24-hour expiration"

AI: "What authentication method - JWT or session-based?"
You: "JWT with 7-day refresh tokens"

✓ Spec updated with clarifications
✓ Clarifications saved to clarifications.md
```

### Step 5: Create Implementation Plan

```bash
cortex plan 001-add-user-authentication
```

**What happens**:
1. AI loads plan template and command
2. AI reads spec.md for requirements
3. AI generates technical design with architecture decisions
4. **Automatic actions**:
   - Context memory updated → `CONTEXT.md`
   - Design checklist generated → `checklists/design.md`
5. File saved to `plan.md`

**Output**:
```
✓ Plan created for 001-add-user-authentication

Files generated:
- plan.md
- CONTEXT.md (auto-updated with tech stack)
- checklists/design.md

Automatic actions completed:
✓ Tech stack extracted: Node.js, TypeScript, PostgreSQL, JWT
✓ Context memory updated
✓ Design checklist generated (12 items)

Next steps:
- Review plan.md for technical approach
- Optional: cortex review 001-add-user-authentication
- Or proceed: cortex tasks 001-add-user-authentication
```

### Step 6: Technical Review (Optional but Recommended)

For complex or risky changes, run a technical review:

```bash
cortex review 001-add-user-authentication
```

**What happens**:
1. AI performs 6-category review:
   - Architecture (component design, boundaries)
   - Security (auth, data protection, vulnerabilities)
   - Performance (bottlenecks, caching, scaling)
   - Maintainability (code organization, documentation)
   - Data Model (schema design, migrations)
   - Integration (API contracts, error handling)
2. AI categorizes findings: Must Fix / Should Fix / Consider
3. AI makes decision: Approved / Approved with Changes / Needs Major Revision
4. Review saved to `review.md`

**Output**:
```
✓ Technical review completed

Decision: APPROVED WITH CHANGES

Must Fix (2):
- Add rate limiting for login endpoint
- Implement CSRF protection

Should Fix (1):
- Consider password complexity requirements

Review saved to: review.md

Next steps:
- Address "Must Fix" items in plan.md
- Update plan and re-review if needed
- Or proceed: cortex tasks 001-add-user-authentication
```

### Step 7: Generate Task Breakdown

```bash
cortex tasks 001-add-user-authentication
```

**What happens**:
1. AI loads tasks template and command
2. AI reads plan.md and spec.md
3. AI breaks down into specific, actionable tasks
4. AI marks parallelizable tasks with `[P]`
5. AI includes test tasks (marked "FIRST")
6. **Automatic actions**:
   - Tasks checklist generated → `checklists/tasks.md`
7. File saved to `tasks.md`

**Output**:
```
✓ Tasks generated for 001-add-user-authentication

Files generated:
- tasks.md (42 tasks across 3 user stories)
- checklists/tasks.md

Task Summary:
- Foundation: 8 tasks
- User Story 1 (Login): 15 tasks (5 parallel)
- User Story 2 (Registration): 12 tasks (4 parallel)
- User Story 3 (Password Reset): 7 tasks

Automatic actions completed:
✓ Tasks checklist generated (8 validation items)

Next steps:
- Review tasks.md for completeness
- Check checklists/tasks.md before implementing
- Ready: cortex implement 001-add-user-authentication
```

### Step 8: Execute Implementation

```bash
cortex implement 001-add-user-authentication
```

**What happens**:
1. **Pre-implementation checks**:
   - Gitignore files validated (based on tech stack)
   - `.dockerignore`, `.eslintignore`, etc. updated if needed
   - Implementation checklist generated
2. AI loads tasks.md
3. AI executes tasks in order:
   - Foundation tasks first
   - Test tasks before implementation
   - Parallel tasks executed simultaneously where possible
4. AI validates at checkpoints
5. Execution logs saved to `execution/`

**Output**:
```
✓ Pre-implementation checks completed
✓ Gitignore validated and updated
✓ Implementation checklist generated

Executing Foundation Phase (8 tasks)...
[T001] ✓ Create user model
[T002] ✓ Setup database schema
[T003] [P] ✓ Configure JWT library
[T004] [P] ✓ Setup email service
...

Checkpoint: Foundation Ready ✓

Executing User Story 1: Login (15 tasks)...
[T009] ✓ Write login endpoint tests (FIRST)
[T010] ✓ Implement login endpoint
[T011] ✓ Add password hashing
...

Feature Complete ✓

Files modified: 23
Tests added: 12
All tests passing: ✓

Execution logs: .cortex/workflows/001-add-user-authentication/execution/
```

---

## Understanding the Workflow

### Workflow Phases

| Phase | Required | Purpose | Output |
|-------|----------|---------|--------|
| **Constitution** | Optional | Define project principles | constitution.md |
| **Spec** | ✓ | Define WHAT to build | spec.md, requirements checklist |
| **Clarify** | Optional | Resolve ambiguities | clarifications.md, updated spec |
| **Plan** | ✓ | Define HOW to build | plan.md, CONTEXT.md, design checklist |
| **Review** | Optional | Technical validation | review.md with findings |
| **Tasks** | ✓ | Break down into steps | tasks.md, tasks checklist |
| **Implement** | ✓ | Build the feature | Code files, execution logs |

### User Confirmation Checkpoints

| After Phase | Decision | Options |
|-------------|----------|---------|
| **Spec** | Is specification clear? | Proceed to plan / Run clarify / Revise spec |
| **Plan** | Is technical approach sound? | Proceed to tasks / Run review / Revise plan |
| **Tasks** | Is task breakdown complete? | Proceed to implement / Revise tasks |

**AI cannot proceed without explicit confirmation** - This prevents runaway AI and ensures alignment.

---

## Command Reference

### Phase Commands

| Command | Description | Example |
|---------|-------------|---------|
| `cortex spec` | Create specification | `cortex spec "Add dark mode toggle"` |
| `cortex clarify` | Resolve ambiguities | `cortex clarify 001-workflow-id` |
| `cortex plan` | Generate plan | `cortex plan 001-workflow-id` |
| `cortex review` | Technical review | `cortex review 001-workflow-id` |
| `cortex tasks` | Break down tasks | `cortex tasks 001-workflow-id` |
| `cortex implement` | Execute implementation | `cortex implement 001-workflow-id` |

### Status Commands

| Command | Description | Example |
|---------|-------------|---------|
| `cortex status` | Check workflow progress | `cortex status 001-workflow-id` |
| `cortex list` | List all workflows | `cortex list --limit 10` |

### Utility Commands

| Command | Description | Example |
|---------|-------------|---------|
| `cortex init` | Initialize project | `cortex init` |
| `cortex learn` | Extract lessons | `cortex learn 001-workflow-id` |
| `cortex context` | Search memory | `cortex context "authentication patterns"` |

---

## Advanced Usage

### Working with Multiple Workflows

```bash
# List all workflows
cortex list

# Check specific workflow
cortex status 001-user-auth
cortex status 002-admin-panel

# Work on different features in parallel
cortex spec "Add admin panel"  # Creates 002-admin-panel
cortex spec "Add email notifications"  # Creates 003-email-notifications
```

### Learning from Experience

```bash
# After completing a workflow
cortex learn 001-user-auth
```

**What this does**:
- Extracts patterns from implementation
- Saves to `.cortex/memory/`
- Future workflows reference these patterns
- Improves quality over time

### Searching Past Experience

```bash
# Find relevant past patterns
cortex context "How did we implement authentication before?"
cortex context "What security patterns have we used?"
```

**AI will**:
- Search `.cortex/memory/` for relevant experiences
- Include findings in current workflow
- Apply learned patterns automatically

### Customizing Templates

You can customize templates for your project:

```bash
# Edit templates
vi .cortex/templates/spec-template.md
vi .cortex/templates/plan-template.md

# Changes apply to all future workflows
cortex spec "Next feature"  # Uses custom template
```

---

## Best Practices

### 1. Always Start with Constitution

For new projects, define principles first:

```bash
/cortex.constitution Focus on: code quality, testing, security, performance
```

**Why**: Constitution guides all future decisions and validates every workflow phase.

### 2. Use Clarify for Vague Requirements

When requirements are unclear:

```bash
cortex clarify 001-feature-name
```

**Why**: Better to spend 5 minutes clarifying than hours building the wrong thing.

### 3. Use Review for Complex/Risky Changes

For security-critical or performance-sensitive features:

```bash
cortex review 001-feature-name
```

**Why**: Catches architectural issues before implementation, saving time.

### 4. Check Checklists Before Proceeding

Before moving to next phase:

```bash
# Review the checklist
cat .cortex/workflows/001-feature-name/checklists/design.md

# Mark items complete: - [X]
# Verify all items checked before implementing
```

**Why**: Checklists are quality gates - they prevent incomplete work from proceeding.

### 5. Review CONTEXT.md Regularly

```bash
cat .cortex/workflows/001-feature-name/CONTEXT.md
```

**Why**: Shows accumulated project knowledge - technologies, decisions, patterns.

---

## Troubleshooting

### "Workflow not found"

**Cause**: Invalid workflow ID or workflow doesn't exist

**Solution**:
```bash
cortex list  # Check available workflow IDs
```

### "Template not found"

**Cause**: `.cortex/templates/` directory missing or incomplete

**Solution**:
```bash
cortex init  # Re-initialize templates
```

### "Constitution validation failed"

**Cause**: Content violates project principles in `.cortex/constitution.md`

**Solution**:
1. Read the validation error message
2. Check `.cortex/constitution.md` for the violated principle
3. Either fix the content or update the constitution

### "Date placeholder copied"

**Cause**: AI copied `[DATE]` instead of using real date

**Solution**: This is now prevented - all command files enforce real date retrieval:
```bash
date +%Y-%m-%d  # Command executed automatically by AI
```

### Workflow seems stuck

**Check status**:
```bash
cortex status 001-feature-name
```

**Check logs**:
```bash
cat .cortex/workflows/001-feature-name/execution/*.log
```

---

## Common Workflows

### Greenfield Project

```bash
# 1. Initialize
cortex init

# 2. Setup principles
/cortex.constitution Create principles for quality and performance

# 3. First feature
cortex spec "Setup project structure and CI/CD"
cortex plan 001-project-setup
cortex tasks 001-project-setup
cortex implement 001-project-setup

# 4. Learn and continue
cortex learn 001-project-setup
cortex spec "Add user authentication"
# ... repeat workflow
```

### Adding Feature to Existing Project

```bash
# 1. Create spec
cortex spec "Add export to CSV functionality"
# → 042-export-csv created

# 2. Optional clarify (if requirements unclear)
cortex clarify 042-export-csv

# 3. Plan
cortex plan 042-export-csv
# → Automatically references past patterns from memory

# 4. Tasks and implement
cortex tasks 042-export-csv
cortex implement 042-export-csv

# 5. Extract lessons
cortex learn 042-export-csv
```

### Refactoring Existing Code

```bash
# 1. Specify refactoring goals
cortex spec "Refactor authentication system to use OAuth2"

# 2. Review is critical for refactoring
cortex plan 001-refactor-auth
cortex review 001-refactor-auth  # Catch breaking changes

# 3. Careful task breakdown
cortex tasks 001-refactor-auth
# Review tasks.md - ensure backward compatibility

# 4. Implement with caution
cortex implement 001-refactor-auth
```

---

## Next Steps

Now that you're up and running:

1. **Read [Architecture](architecture.md)** - Understand the technical details
2. **Check [Code Patterns](code-patterns.md)** - Learn development guidelines
3. **Explore `.cortex/workflows/`** - See generated files and structure
4. **Join the community** - [GitHub Discussions](https://github.com/RikaiDev/cortex/discussions)

---

## Quick Reference Card

```bash
# Setup
cortex init                              # Initialize project
/cortex.constitution <principles>        # Setup principles (in AI)

# Workflow
cortex spec "<description>"              # Create spec
cortex clarify <id>                      # Clarify (optional)
cortex plan <id>                         # Create plan
cortex review <id>                       # Review (optional)
cortex tasks <id>                        # Generate tasks
cortex implement <id>                    # Implement

# Status
cortex status <id>                       # Check progress
cortex list                              # List workflows

# Learning
cortex learn <id>                        # Extract lessons
cortex context "<query>"                 # Search memory
```

---

## Help & Support

- **Documentation**: [README](../README.md) | [Architecture](architecture.md) | [Code Patterns](code-patterns.md)
- **Issues**: [GitHub Issues](https://github.com/RikaiDev/cortex/issues)
- **Discussions**: [GitHub Discussions](https://github.com/RikaiDev/cortex/discussions)
- **Examples**: [Example Workflows](examples/)
