# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of our systems seriously. If you believe you have found a security vulnerability in this workspace or any of its projects, please adhere to the following guidelines:

1.  **Do not disclose publicly.** Please do not publish the vulnerability on public forums, issue trackers, or social media until we have addressed it.
2.  **Report privately.** Email the security team (or the workspace owner) directly with details.
3.  **Provide context.** Include steps to reproduce the issue, the affected project/file, and the potential impact.

### Scope

This workspace includes standard HTML/JS applications.
- **In Scope**: Application logic, DOM-based vulnerabilities (XSS), misconfigurations in provided code.
- **Out of Scope**: Vulnerabilities in third-party CDNs (e.g., unpkg.com, googleapis.com) unless caused by our specific usage.

## Known Risks & Acceptable Use
- **LocalStorage**: Some apps use `localStorage` for persistence. This data is not encrypted and is accessible to any script running on the same origin. Do not store PII or sensitive secrets in these apps.
- **CDN Usage**: We load libraries (React, Babel) from CDNs for ease of development. In a high-security production environment, these should be bundled and self-hosted.

## Security Controls
- **Automated Scanning**: We run `npm run security-check` to scan for accidental core secrets committed to the repo.
- **CSP**: We implement Content Security Policy headers to mitigate XSS risks.
