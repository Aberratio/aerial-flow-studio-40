# Contributing to IguanaFlow

First off, thank you for considering contributing to IguanaFlow! 🦎 It's people like you that make this project better.

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful, inclusive, and constructive in all interactions.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please open an issue using the bug report template. Include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Screenshots if applicable
- Your environment (browser, OS, etc.)

### Suggesting Features

We love new ideas! Use the feature request template to suggest improvements. Be as detailed as possible about:

- The problem you're trying to solve
- Your proposed solution
- Potential alternatives you've considered

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Submit a pull request** with a clear description

## Development Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd iguana-flow
```

2. Install dependencies:

```bash
npm install
# or
bun install
```

3. Set up environment variables (see `.env.example` if available)

4. Start the development server:

```bash
npm run dev
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow existing patterns and conventions
- Use meaningful variable and function names
- Add type annotations where helpful

### React

- Use functional components with hooks
- Prefer arrow functions for components
- Keep components small and focused
- Use proper prop types/interfaces

### Code Style

- Use ESLint (run `npm run lint` before committing)
- Follow the existing code formatting
- Use meaningful commit messages
- Keep functions focused on a single responsibility

### File Structure

- Components go in `src/components/`
- Pages go in `src/pages/`
- Hooks go in `src/hooks/`
- Utilities go in `src/lib/`
- Types go in `src/types/`

## Commit Messages

Write clear, descriptive commit messages:

```
feat: Add new challenge filter component
fix: Resolve authentication token refresh issue
docs: Update README with new features
style: Format code with Prettier
refactor: Simplify exercise search logic
test: Add tests for user profile component
```

## Testing

- Test your changes manually in the browser
- Check for console errors
- Verify the feature works on different screen sizes
- Test edge cases and error scenarios

## Documentation

- Update README.md if you add new features
- Add JSDoc comments for complex functions
- Update technical documentation if architecture changes

## Questions?

Not sure about something? Feel free to:

- Open an issue with the question template
- Reach out via [hello@iguanaflow.com](mailto:hello@iguanaflow.com)
- Check existing issues and discussions

## Recognition

Contributors will be recognized in the project (if they wish). Thank you for helping make IguanaFlow better! 🎉
