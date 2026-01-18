# Configuration

## Intent
Centralized configuration files shared across all projects. Enforces Single Source of Truth principle.

## Contents
- `design-tokens.css` - Shared CSS variables (colors, spacing, typography)

## Usage
Projects should `@import` from here rather than defining their own tokens.
