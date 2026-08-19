# Projects Directory

## Intent
Contains all individual web application projects. Each project is self-contained with its own assets and follows the workspace design system.

## Active Projects
| Project | Status | Description |
|---------|--------|-------------|
| `minimalist-todo/` | ✅ Active | Glassmorphism todo app, deployed to GitHub Pages |
| `experiments-web/` | ✅ Active | PWA experiments and prototypes |
| `memento-mori/` | ✅ Active | Life visualization app |
| `life-compass/` | ✅ Active | (Undocumented) Life compass application |

## Archived/Removed
- **2026-01-16**: Moved redundant projects to `_orphans/archived_projects_2026_01_16/`:
  - `simple-todo`, `premium-todo-app`, `world-class-todo`
  - `elegant-todo-list`, `todo-list`, `todo-list-app`
  - `first-elegant-app`, `test-design-system`
- **2026-01-10**: Initial cleanup attempt.

## Creating New Projects
1. Copy `templates/new-project-template/` to this directory
2. Rename to your project name
3. Add `_MANIFEST.md` to your project
4. Update this registry

## Dependencies
All projects should import shared tokens from `config/design-tokens.css`
