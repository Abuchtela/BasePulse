# Contributing to BasePulse

Thank you for your interest in contributing to BasePulse! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/basepulse-agent.git
   cd basepulse-agent
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Set up development environment**:
   ```bash
   pnpm install
   pnpm db:push
   pnpm dev
   ```

## Development Workflow

### Code Style

- Follow the existing code style and patterns
- Use TypeScript for all new code
- Format code with Prettier: `pnpm format`
- Check types: `pnpm check`

### Database Changes

If you modify the database schema:
1. Update `drizzle/schema.ts`
2. Run `pnpm db:push` to generate migrations
3. Test migrations locally
4. Commit both schema and migration files

### Testing

- Write tests for new features using Vitest
- Run tests: `pnpm test`
- Ensure all tests pass before submitting PR

### Commits

- Use clear, descriptive commit messages
- Reference issues when applicable: `Fixes #123`
- Keep commits focused on single features/fixes

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**: `pnpm test`
4. **Format code**: `pnpm format`
5. **Create a descriptive PR** with:
   - Clear title and description
   - Reference to related issues
   - Screenshots/videos if UI changes
6. **Respond to review feedback** promptly

## Reporting Issues

When reporting bugs, include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Relevant logs or error messages

## Feature Requests

For feature requests, describe:
- The problem you're trying to solve
- Proposed solution
- Alternative approaches considered
- Use cases and benefits

## Code Review Guidelines

- Be respectful and constructive
- Focus on code quality and design
- Ask questions rather than making demands
- Acknowledge good work and improvements

## Areas for Contribution

### High Priority
- Integration with real X/Farcaster APIs
- Unit tests for core modules
- Performance optimizations
- Security audits

### Medium Priority
- Additional documentation
- Dashboard improvements
- Error handling enhancements
- Monitoring and logging

### Lower Priority
- UI/UX improvements
- Example configurations
- Community tools and utilities

## Questions?

- Open an issue for questions
- Check existing documentation
- Review closed issues for similar topics

Thank you for contributing to BasePulse! 🚀
