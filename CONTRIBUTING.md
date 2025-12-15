# Contributing to Ditto

First off, thank you for considering contributing to Ditto! It's people like you that make Ditto such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps which reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed after following the steps**
- **Explain which behavior you expected to see instead and why**
- **Include screenshots if possible**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain which behavior you expected to see instead**
- **Explain why this enhancement would be useful**

### Pull Requests

- Fill in the required template
- Do not include issue numbers in the PR title
- Follow the TypeScript styleguide
- Include screenshots and animated GIFs in your pull request whenever possible
- End all files with a newline
- Avoid platform-dependent code

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### TypeScript Styleguide

- Use TypeScript for all new code
- Follow existing code style (enforced by Prettier and ESLint)
- Write meaningful variable and function names
- Add JSDoc comments for complex functions
- Use proper types, avoid `any` when possible

### Component Guidelines

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types with TypeScript interfaces
- Follow Shadcn UI patterns for UI components

## Development Setup

1. Fork the repo
2. Clone your fork
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b my-feature`
5. Make your changes
6. Run tests: `npm run lint && npm run type-check`
7. Commit your changes: `git commit -m 'Add some feature'`
8. Push to your fork: `git push origin my-feature`
9. Submit a pull request

## Project Structure

Understanding the project structure will help you contribute effectively:

\`\`\`
app/ - Next.js app directory (pages and layouts)
components/ - React components
lib/ - Utility functions and configurations
store/ - State management (Zustand)
types/ - TypeScript type definitions
messages/ - i18n translation files
\`\`\`

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing! 🎉
