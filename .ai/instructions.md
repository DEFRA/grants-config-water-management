# AI Prompt: Convert Repository into a Grant Configuration Repository

Use the current repository as the target repository and compare it with:

https://github.com/DEFRA/grants-config-bootstrap

## Working Rules

- Clone or fetch the latest version of the bootstrap repository for comparison.
- Preserve existing repository functionality unless explicitly instructed otherwise.
- When merging content:

  - Retain existing target-repository content.
  - Add bootstrap content where missing.
  - Avoid duplicate entries.
  - If a conflict exists, prefer bootstrap implementation unless repository-specific behaviour would be lost.

- Maintain the existing formatting and code style.
- Run validation steps after each major change where applicable.
- Record all modifications in git.

---

## 1. Create Working Branch

1. Checkout `main`
2. Pull the latest changes
3. Create a new feature branch named:

   feat/bootstrap-grant-configuration

---

## 2. Documentation Updates

### README

1. Compare:

   - `README.md`
   - `bootstrap/docs/README.md`

2. Merge content into the target `README.md` using the following rules:

   - Keep existing section links.
   - Add a new section link named **Grant Configuration**.
   - Add four child section links to **Grant Configuration**, named: **Create new**, **Update existing**, **Non-configuration changes** and **Hotfix release**.
   - Place **Grant Configuration** as the first section link.
   - Insert the Grant Configuration content immediately after the section links.
   - Preserve all existing repository-specific documentation.
   - Replace `Dependabot` and `SonarCloud` sections with the bootstrap version.

---

## 3. Package Configuration

### Dev Dependencies

Uninstall (will install the latest version shortly):

```bash
npm uninstall -D vitest @vitest/coverage-v8
```

Install:

```bash
npm install -D vitest @vitest/coverage-v8 @changesets/cli @changesets/changelog-github
```

### Runtime Dependency

Install:

```bash
npm install --min-release-age=0 @defra/grants-config-utils
```

### package.json Merge

Merge fields from:

```text
bootstrap/npm/package.json
```

Rules:

- Keep all existing scripts.
- Replace `$TARGET_REPO_NAME$` with the repository `name` field value.
- Append any new fields to the end of their respective sections.
- Do not remove repository-specific configuration.

---

## 4. Changesets

1. Initialise Changesets:

```bash
npx changeset init
```

2. Create an initial changeset by writing a markdown file into .changeset/ rather than running the interactive npx changeset command. Use the repository package name and set the release type to minor with the summary "Add grant configuration support to the repository"

3. Copy:

```text
bootstrap/changeset/pr-changeset-check.yml
```

to:

```text
.github/workflows/pr-changeset-check.yml
```

Rules:

- The changeset file created must follow naming conventions. Example: initial-boot-strap.md

---

## 5. Husky

1. Run:

```bash
npm run setup:husky
```

2. Merge bootstrap content from:

```text
bootstrap/husky/pre-commit
```

into:

```text
.husky/pre-commit
```

Rules:

- Avoid duplicate commands.
- Preserve existing hooks.
- Add new code after the existing code.

---

## 6. Release and Publishing

### Release Script

Copy:

```text
bootstrap/publish/release-it.sh
```

to:

```text
ci/release-it.sh
```

Then:

```bash
chmod +x ci/release-it.sh
```

### Publish Workflow

Merge bootstrap workflow content from:

```text
bootstrap/publish/publish.yml
```

into:

```text
.github/workflows/publish.yml
```

Rules:

- Keep the existing workflow name.
- Preserve repository-specific jobs.
- Pay close attention to the `uses`, bootstrap versions should be used
- Add any missing bootstrap jobs, steps, permissions, and environment variables.

### Publish Hotfix Workflow

Merge bootstrap workflow content from:

```text
bootstrap/publish/publish-hotfix.yml
```

into:

```text
.github/workflows/publish-hotfix.yml
```

Rules:

- Keep the existing workflow name.
- Preserve repository-specific jobs.
- Pay close attention to the `uses`, bootstrap versions should be used
- Add any missing bootstrap jobs, steps, permissions, and environment variables.

### Check Pull Request Workflow

Replace:

```text
.github/workflows/check-pull-request.yml
```

with:

```text
bootstrap/publish/check-pull-request.yml
```

---

## 7. Grant Configuration Code Changes

### Repository Structure

Create:

```text
configurations/
```

Copy:

```text
bootstrap/code-changes/REMOVE.txt
```

to:

```text
configurations/REMOVE.txt
```

### Remove Example Route

Delete:

```text
src/routes/example.js
```

Remove all references, imports, registrations, tests, and documentation related to this route.

### start-server.js

Merge:

```text
bootstrap/code-changes/start-server.js
```

into:

```text
src/common/start-server.js
```

Specifically add:

```text
storeConfigVersionAndInformBroker
```

and all required supporting code.

### start-server.test.js

Merge equivalent bootstrap test coverage from:

```text
bootstrap/code-changes/start-server.test.js
```

into:

```text
src/common/start-server.test.js
```

### logger-options.test.js

Copy:

```text
bootstrap/code-changes/logger-options.test.js
```

to:

```text
src/plugins/logger-options.test.js
```

Ensure all new functionality is tested.

### fail-action.test.js

Update uses of `Error()` to `new Error()`

### setup-proxy.js and setup-proxy.test.js

Update uses of `global` to `globalThis`

### vitest.config.js

Don't update vitest.config.js

---

## 8. Local Development Configuration

### AWS Environment

Update:

```text
aws.env
```

Replace:

```text
localhost
```

with:

```text
floci
```

for `AWS_ENDPOINT_URL`.

### Docker Compose

Merge bootstrap additions from:

```text
bootstrap/local-running/compose.yml
```

into:

```text
compose.yml
```

Rules:

- Treat `$TARGET_REPO_SPECIFIC$` as a repository-specific placeholder requiring implementation.
- Preserve existing services.

### Local AWS Resources

Update:

```text
10-setup-resources.sh
```

Add creation of:

```text
configs-bucket
```

### Dockerfile

Merge bootstrap amendments from:

```text
bootstrap/local-running/Dockerfile
```

into:

```text
Dockerfile
```

### Start Script

Copy:

```text
bootstrap/local-running/start
```

to:

```text
scripts/start
```

and make executable.

### Environment File

Copy:

```text
bootstrap/local-running/.env
```

to:

```text
.env
```

---

## 9. Code Health Configuration

### Sonar Configuration

Update:

```text
sonar-project.properties
```

Ensure exclusions include:

```text
src/index.js
src/routes/health.js
```

Rules:

- Add without spaces.

Update comment starting `To set up Sonar`, replace `howto` with `how-to`

### Dependabot Configuration

Copy:

```text
bootstrap/code-health/dependabot.yml
```

to:

```text
.github/dependabot.yml
```

then remove:

```text
.github/example.dependabot.yml
```

---

## 10. Validation

Run and fix any issues:

```bash
npm install
npm run lint:fix && npm run format
npm test
```

If available:

```bash
npm run test:coverage
```

Ensure all tests pass.

---

## 11. Stage, commit, and push to remote

1. Stage and commit all changes with a meaningful commit message.
2. Push the feature branch.

Suggested commit message:

```text
feat: add grant configuration support
```

## 12. Create GitHub PR

1. Create a pull request for this branch targeting `main` in GitHub.

Suggested PR title:

```text
feat: add grant configuration support
```

Include:

- Summary of migrated bootstrap features
- Configuration changes
- Testing performed
- Any manual follow-up actions that are required
