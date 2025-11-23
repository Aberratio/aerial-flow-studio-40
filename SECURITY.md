# Security Policy

## Supported Versions

We actively support the following versions of IguanaFlow:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest| :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### 1. **Do NOT** open a public issue

Please do not report security vulnerabilities through public GitHub issues. This helps protect users while we work on a fix.

### 2. Report privately

Please email security details to: **[hello@iguanaflow.com](mailto:hello@iguanaflow.com)**

Include the following information:
- Type of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

### 3. Response timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix timeline**: Depends on severity, but we aim to address critical issues as quickly as possible

### 4. Disclosure

We will:
- Acknowledge receipt of your report
- Keep you informed of our progress
- Credit you in our security advisories (if you wish)
- Notify you when the vulnerability is fixed

## Security Best Practices

### For Users

- Keep your password strong and unique
- Don't share your account credentials
- Enable two-factor authentication if available
- Report suspicious activity immediately

### For Developers

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Keep dependencies up to date
- Follow secure coding practices
- Review code changes carefully

## Known Security Measures

IguanaFlow implements several security measures:

- **Authentication**: Secure user authentication via Supabase
- **Data Encryption**: All data in transit is encrypted (HTTPS)
- **Input Validation**: Server-side validation for all user inputs
- **SQL Injection Protection**: Using parameterized queries via Supabase
- **XSS Protection**: React's built-in XSS protection
- **CORS**: Properly configured CORS policies
- **Rate Limiting**: API rate limiting to prevent abuse

## Security Updates

Security updates will be:
- Released as soon as possible after discovery
- Documented in release notes
- Communicated to users when necessary

## Questions?

If you have questions about security, please contact us at [hello@iguanaflow.com](mailto:hello@iguanaflow.com)

Thank you for helping keep IguanaFlow secure! 🔒

