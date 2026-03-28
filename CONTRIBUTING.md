# Contributing to Armsforge

Guidelines for contributing templates, snippets, agents, and improvements to Armsforge.

## Code of Conduct

All contributors are expected to:

- Use Armsforge only for authorized security testing
- Respect the legal and ethical guidelines in SECURITY.md
- Treat other contributors with respect
- Maintain professionalism in all interactions
- Report security issues responsibly
- Follow open source best practices

---

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 9.0.0
- Git
- Basic TypeScript knowledge (for core changes)
- Security testing experience (for templates/snippets)

### Development Environment Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/armsforge.git
cd armsforge

# Install dependencies
npm install

# Verify setup
npm test

# Start development mode
npm run dev
```

### Project Structure

```
armsforge/
├── src/
│   ├── index.ts              # Main entry
│   ├── mcp/
│   │   └── server.ts         # MCP server implementation
│   └── theme/
│       └── catppuccin.ts     # Theme and formatting
├── templates/                # Exploit/loader/implant templates
├── snippets/                 # Reusable code patterns
├── data/                     # Detection reference JSON
├── agents/                   # Agent prompt definitions
├── skills/                   # Custom skills
├── test/                     # Test suite
├── dist/                     # Compiled output
└── package.json
```

---

## Contributing Templates

Templates are starter projects for common offensive tasks.

### Template Requirements

1. **Well-commented code**:
   ```python
   # @desc One-line description
   """
   Multi-line docstring explaining:
   - What the template does
   - How to use it
   - Prerequisites
   - Expected output
   """
   ```

2. **Clear configuration section**:
   ```python
   # === CONFIGURATION ===
   # All values that need customization
   # Each marked with TODO comment
   OFFSET = 0  # TODO: Find with pattern_offset
   ```

3. **Working code**:
   - Must compile/run without errors
   - Must work on target system
   - Error handling for common failures
   - Tested in lab environment

4. **Documentation**:
   - Usage instructions
   - Example invocation
   - Expected behavior
   - Troubleshooting tips

### Adding a New Template

1. **Create template file**:
   ```bash
   touch templates/my-template.py
   ```

2. **Write template with comments**:
   ```python
   #!/usr/bin/env python3
   # @desc Descriptive name and one-line purpose
   """
   Detailed docstring with:
   - What it does
   - How to customize
   - Build instructions
   - Usage example
   """

   # === CONFIGURATION ===
   TARGET = "localhost"  # TODO: Set your target

   # === IMPLEMENTATION ===
   # Core logic here

   if __name__ == "__main__":
       main()
   ```

3. **Test thoroughly**:
   ```bash
   # Test compilation/interpretation
   python3 templates/my-template.py --help

   # Test in lab environment
   # Verify all TODO sections are clear
   # Verify it actually works
   ```

4. **Submit for review**:
   - Create pull request
   - Describe what template does
   - Provide lab testing results
   - Include any special requirements

### Template Checklist

Before submitting a template:

- [ ] Has `@desc` comment with one-line description
- [ ] Has multi-line docstring explaining usage
- [ ] Has clear `=== CONFIGURATION ===` section
- [ ] All editable values marked with `TODO`
- [ ] Code is well-commented
- [ ] Tested to work on real target
- [ ] Error handling implemented
- [ ] No hardcoded credentials or IPs
- [ ] Follows project code style
- [ ] Compatible with Python/C#/Rust/Go conventions

---

## Contributing Snippets

Snippets are reusable code patterns for common tasks.

### Snippet Requirements

1. **Focused and reusable**:
   - Does one thing well
   - Can be copy-pasted into other code
   - Minimal dependencies
   - Clear purpose

2. **Well-documented**:
   ```csharp
   // @desc AES decryption helper for encrypted payloads
   // Usage:
   //   byte[] encrypted = File.ReadAllBytes("payload.bin");
   //   byte[] shellcode = DecryptAES(encrypted, KEY, IV);

   static byte[] DecryptAES(byte[] encrypted, byte[] key, byte[] iv)
   {
       // Implementation
   }
   ```

3. **Language consistency**:
   - Use language conventions
   - Proper error handling
   - Comments for non-obvious sections

4. **Tested**:
   - Works when integrated into templates
   - Compatible with standard libraries
   - Handles edge cases

### Adding a New Snippet

1. **Create snippet file**:
   ```bash
   touch snippets/my-snippet.cs
   ```

2. **Write with documentation**:
   ```csharp
   // @desc One-line description
   // Usage: How to use this snippet

   static byte[] MyFunction(byte[] input)
   {
       // Implementation
       return output;
   }
   ```

3. **Test integration**:
   ```
   - Copy into template
   - Verify compilation
   - Verify functionality
   - Verify no conflicts
   ```

4. **Submit pull request**:
   - Describe snippet purpose
   - Show integration example
   - List any dependencies
   - Include usage documentation

---

## Contributing Detection Data

Detection reference data helps understand what's monitored.

### Data File Format

```json
{
  "description": "What this data covers",
  "entries": [
    {
      "name": "Unique identifier",
      "risk": "low|medium|high|critical",
      "description": "Detailed explanation",
      "detection_patterns": ["Pattern 1", "Pattern 2"],
      "evasion_notes": "How to evade this detection"
    }
  ]
}
```

### Adding Detection Data

1. **Identify new detection pattern**:
   - New Sysmon rule ID
   - New API detection
   - New AMSI pattern
   - New ETW provider event

2. **Research thoroughly**:
   - Understand what triggers detection
   - Document detection mechanism
   - Identify evasion techniques
   - Test in lab if possible

3. **Add to appropriate file**:
   - `data/suspicious-apis.json` — Win32 API detection
   - `data/sysmon-rules.json` — Sysmon event IDs
   - `data/etw-providers.json` — ETW providers
   - `data/amsi-triggers.json` — AMSI patterns

4. **Submit pull request**:
   - Describe the detection pattern
   - Include source/reference
   - Provide evasion notes
   - Link to relevant research

### Data Quality Guidelines

- Use consistent formatting
- Include specific details (event IDs, API names)
- Provide actionable evasion guidance
- Reference sources when possible
- Keep entries concise but informative

---

## Contributing Agents

Agents are specialized Claude personalities for offensive tasks.

### Agent File Format

```markdown
---
name: agent-name
description: What this agent does
model: haiku|sonnet|opus
---

<Agent_Prompt>
  <Role>Description of agent role</Role>
  <Why_This_Matters>Why quality matters for this role</Why_This_Matters>
  <Success_Criteria>How to measure success</Success_Criteria>
  <Constraints>Important limitations</Constraints>
  <Workflow>Steps to accomplish the task</Workflow>
  <Tool_Usage>Which tools the agent uses</Tool_Usage>
</Agent_Prompt>
```

### Adding a New Agent

1. **Identify need**:
   - What specialized task is missing?
   - What expertise is required?
   - How would this improve Armsforge?

2. **Create agent file**:
   ```bash
   touch agents/your-agent.md
   ```

3. **Write detailed prompt**:
   - Clear role description
   - Why this specialization matters
   - Specific success criteria
   - Key constraints
   - Step-by-step workflow
   - Tool usage for the role
   - Common failure modes to avoid

4. **Test agent**:
   - Use in real workflows
   - Verify quality of output
   - Check expertise alignment
   - Refine as needed

5. **Submit pull request**:
   - Describe agent purpose
   - Show example usage
   - Explain why needed
   - Provide test results

---

## Code Changes

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test test/unit/my-test.ts

# Watch mode (re-run on changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Code Style

- TypeScript with strict mode enabled
- Use const/let (no var)
- Use async/await (no callbacks)
- Meaningful variable names
- Comments for complex logic
- Follow existing code style

### Making Code Changes

1. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes**:
   ```bash
   # Edit files
   npm run lint    # Check style
   npm run format  # Auto-format
   npm test        # Verify tests pass
   ```

3. **Commit changes**:
   ```bash
   git add .
   git commit -m "Clear description of change"
   ```

4. **Push and create pull request**:
   ```bash
   git push origin feature/your-feature
   # Create PR on GitHub
   ```

### Pull Request Requirements

- [ ] Tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Code formatted: `npm run format`
- [ ] Commit messages are clear
- [ ] Describes what changed and why
- [ ] Links to any related issues
- [ ] No breaking changes (or documented)

---

## Security Issues

### Reporting Security Vulnerabilities

**DO NOT** open public GitHub issues for security vulnerabilities.

Instead:

1. Email security@example.com with details
2. Include:
   - Vulnerability description
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if applicable)
3. Allow 30 days for patch before disclosure
4. We'll coordinate responsible disclosure

---

## Documentation

### Improving Documentation

1. **Fix typos/unclear sections**:
   - Edit relevant .md file
   - Submit pull request with changes

2. **Add examples**:
   - Show real-world usage
   - Include expected output
   - Document edge cases

3. **Improve clarity**:
   - Simplify complex explanations
   - Add visual diagrams where helpful
   - Reorganize for better flow

4. **Add troubleshooting**:
   - Document common issues
   - Provide solutions
   - Link to related docs

### Documentation Standards

- Use clear, accessible language
- Include code examples
- Provide working commands
- Test examples before submitting
- Keep formatting consistent
- Use descriptive headers

---

## Community Guidelines

### Being a Good Contributor

- Read existing code before contributing
- Follow established patterns and style
- Test your changes thoroughly
- Provide clear pull request descriptions
- Respond to review feedback
- Help review others' pull requests
- Be respectful in all interactions

### Getting Help

- Check existing issues and PRs
- Review documentation
- Ask questions in PRs or discussions
- Reference similar code/examples
- Provide context for questions

---

## Contributor License Agreement

By contributing to Armsforge, you agree that:

1. Your contributions are your own original work
2. You grant Armsforge a permanent license to use your code
3. You warrant you have the right to grant this license
4. You understand code is released under MIT license
5. Your contributions comply with SECURITY.md guidelines

---

## Review Process

### Code Review Checklist

Reviewers will check:

- [ ] Code quality and style
- [ ] Test coverage
- [ ] Documentation accuracy
- [ ] Security considerations
- [ ] Performance implications
- [ ] Breaking changes
- [ ] Commit message quality

### Timeline

- Initial review: 3-5 business days
- Follow-up after changes: 2-3 business days
- Merge after approval: 1 business day

---

## Release Process

### Version Numbers

Follows semantic versioning (MAJOR.MINOR.PATCH):

- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Release Steps

1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag
4. Publish to npm
5. Create GitHub release

---

## Recognition

Contributors are recognized in:

- CONTRIBUTORS.md file
- GitHub acknowledgments
- Release notes

Thank you for contributing to Armsforge!

---

## Questions?

- Check TROUBLESHOOTING.md
- Review existing PRs/issues
- Ask in discussions
- Email: contribute@example.com

---

**Last Updated**: March 2026
**Version**: 1.0

Happy contributing!
