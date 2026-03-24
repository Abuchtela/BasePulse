# AGENTS Improvement Spec

Audit date: 2025-03-24  
Auditor: Ona agent

---

## Audit Summary

### Files inspected

| Path | Status |
|---|---|
| `AGENTS.md` | Missing — created during this audit |
| `.devcontainer/devcontainer.json` | Present, partially misconfigured |
| `.ona/review/comments.json` | Present, empty, structurally valid |
| `.ona/skills/` | Missing |
| `.cursor/rules/` | Missing |
| `automations.yaml` | Missing |
| `.gitignore` | Missing |

---

## What's Good

1. **Pinned devcontainer image** — `mcr.microsoft.com/devcontainers/universal:4.0.1-noble`
   uses an explicit tag, ensuring reproducible environment builds.

2. **Ona review tooling wired up** — `.ona/review/comments.json` exists with the correct
   schema (`version`, `comments`, `dismissedAnnotations`), so inline agent review comments
   will persist correctly.

3. **Commented examples in devcontainer** — alternative images, Dockerfile build option,
   and features block are all documented inline, reducing friction when the project grows.

---

## What's Missing

### M1 — `.gitignore`

**Risk:** High. No `.gitignore` exists. The first `npm install`, `pip install`, or similar
command will produce dependency directories that could be accidentally committed.

**Fix:** Create a `.gitignore` before any dependency installation. At minimum include:

```
# Dependencies
node_modules/
venv/
.venv/
__pycache__/

# Build output
dist/
build/
*.egg-info/

# Environment
.env
.env.*
!.env.example

# IDE
.vscode/
.idea/
.DS_Store
```

Update with language-specific patterns once the project stack is chosen.

---

### M2 — `automations.yaml`

**Risk:** Medium. No tasks or services are defined, so agents and developers must run
setup steps manually on every environment start.

**Fix:** Create `.ona/automations.yaml` (or `automations.yaml` at repo root) with at
minimum a `postStart` task that installs dependencies and a `dev` service that starts
the development server. Example skeleton:

```yaml
tasks:
  install:
    name: Install dependencies
    command: echo "No install step configured yet"

services:
  dev:
    name: Dev server
    command: echo "No dev server configured yet"
    ready-on: { port: 3000 }
```

---

### M3 — `devcontainer.json` — `postCreateCommand`

**Risk:** Medium. Without a `postCreateCommand`, every new environment requires manual
setup. Agents cannot assume tools are installed.

**Fix:** Add a `postCreateCommand` that runs the install step:

```json
"postCreateCommand": "echo 'Add your install command here'"
```

Replace the placeholder once the project stack is known.

---

### M4 — `devcontainer.json` — `remoteUser`

**Risk:** Low–Medium. Without `remoteUser`, some container runtimes default to root,
which is a security concern and can cause file permission issues on bind mounts.

**Fix:** Add:

```json
"remoteUser": "codespace"
```

The universal image ships with a `codespace` user. Adjust if using a different base image.

---

### M5 — `devcontainer.json` — VS Code extensions

**Risk:** Low. Agents and developers must install extensions manually, leading to
inconsistent tooling across environments.

**Fix:** Add a `customizations.vscode.extensions` block with at minimum:

```json
"customizations": {
  "vscode": {
    "extensions": []
  }
}
```

Populate with language-specific extensions once the stack is chosen (e.g.,
`"esbenp.prettier-vscode"`, `"ms-python.python"`, `"golang.go"`).

---

### M6 — `.ona/skills/`

**Risk:** Low. No custom agent skills are defined. Agents fall back to built-in
behaviours, which may not match project-specific workflows.

**Fix:** Create `.ona/skills/` and add skill files for recurring workflows. Start with:

- `setup.md` — how to initialise the project from scratch
- `deploy.md` — deployment steps and environment variables required

---

### M7 — Agent guidance in `AGENTS.md` is generic

**Risk:** Low. The newly created `AGENTS.md` covers only structural conventions because
no source code exists yet. It will become stale if not updated as the project grows.

**Fix:** After each significant milestone (language chosen, framework added, CI
configured, first deployment), update `AGENTS.md` with:

- The chosen language and version
- Linting/formatting commands and config file paths
- Test command and coverage threshold
- CI pipeline location and required checks
- Deployment target and process

---

## What's Wrong

### W1 — `devcontainer.json` — commented-out `"build"` block would break JSON if uncommented

**Severity:** Low (latent). The file currently ends with:

```jsonc
"image": "mcr.microsoft.com/devcontainers/universal:4.0.1-noble"
// Use "build": ...
// "build": { ... }
```

If a developer uncomments the `"build"` block to switch to a Dockerfile, the `"image"`
property above it has no trailing comma, producing invalid JSON.

**Fix:** Add a trailing comma after the `"image"` line, or restructure the comment to
make the mutual-exclusivity of `"image"` and `"build"` explicit:

```jsonc
// Use ONE of the following:
// Option A — pre-built image (default):
"image": "mcr.microsoft.com/devcontainers/universal:4.0.1-noble",
// Option B — build from Dockerfile (remove the image line above and uncomment below):
// "build": {
//   "context": ".",
//   "dockerfile": "Dockerfile"
// }
```

---

## Implementation Order

| Priority | Item | Effort |
|---|---|---|
| 1 | M1 — Create `.gitignore` | < 5 min |
| 2 | W1 — Fix devcontainer JSON comment structure | < 5 min |
| 3 | M4 — Add `remoteUser` to devcontainer | < 2 min |
| 4 | M3 — Add `postCreateCommand` to devcontainer | < 5 min |
| 5 | M2 — Create `automations.yaml` skeleton | 15 min |
| 6 | M5 — Add VS Code extensions to devcontainer | 10 min |
| 7 | M6 — Create `.ona/skills/` with initial skill files | 30 min |
| 8 | M7 — Keep `AGENTS.md` updated as project grows | ongoing |

Items 1–4 should be done before any source code is added. Items 5–8 are best done
incrementally as the project stack is established.
