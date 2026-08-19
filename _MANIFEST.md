# HTML_Apps_Workspace

## Intent
Central workspace for HTML-based web applications following the **Cognitive Architecture Protocol (CAP)**. This workspace prioritizes Zero-Entropy organization for seamless navigation by humans and AI agents.

## Structure Overview
```
├── _orphans/          # Files pending review (moved from root)
├── config/            # Shared configuration (design tokens, constants)
├── docs/context/      # AI-specific context files
├── documentation/     # Project documentation and meta prompts
├── projects/          # Individual web applications
├── scripts/           # Automation and tooling
├── templates/         # Project templates
├── tests/             # Test files mirroring project structure
└── .agent/workflows/  # Agent workflow definitions
```

## Quick Navigation
| If you want to... | Go to... |
|-------------------|----------|
| Create a new project | `templates/new-project-template/` |
| View active projects | `projects/_MANIFEST.md` |
| Manage GitHub docs | `documentation/GITHUB_DOC_MANAGER.md` |
| Run agent workflows | `.agent/workflows/` |

## CAP Invariants
1. **Fractal Directory Standard** - Max 7 files per folder, semantic hierarchy
2. **Semantic Naming** - Descriptive filenames, no generics (`utils.js`, `temp`)
3. **Context Anchors** - Every directory has `_MANIFEST.md`
4. **Single Source of Truth** - Centralized config, no hardcoding
5. **Self-Correction** - Delete dead code, don't comment out

## Repository
- GitHub: [emmanuelcabrera1/minimalist-todo](https://github.com/emmanuelcabrera1/minimalist-todo)
