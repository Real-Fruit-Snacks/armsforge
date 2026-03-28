import { describe, it, expect } from 'vitest';
import { colors, c, formatStatus, formatTitle, formatSection, generateColorHints } from '../src/theme/catppuccin.js';

describe('Catppuccin Theme', () => {
  it('should have all required colors defined', () => {
    expect(colors.base).toBe('#1e1e2e');
    expect(colors.mauve).toBe('#cba6f7');
    expect(colors.red).toBe('#f38ba8');
    expect(colors.green).toBe('#a6e3a1');
    expect(colors.yellow).toBe('#f9e2af');
    expect(colors.blue).toBe('#89b4fa');
  });

  it('should format status messages correctly', () => {
    const successMsg = formatStatus('success', 'Test passed');
    const errorMsg = formatStatus('error', 'Test failed');
    const warningMsg = formatStatus('warning', 'Test warning');
    const infoMsg = formatStatus('info', 'Test info');

    expect(successMsg).toContain('✓');
    expect(errorMsg).toContain('✗');
    expect(warningMsg).toContain('⚠');
    expect(infoMsg).toContain('ℹ');
  });

  it('should format titles with decorative borders', () => {
    const title = formatTitle('Test Title');
    expect(title).toContain('═══');
    expect(title).toContain('Test Title');
  });

  it('should format sections with appropriate styling', () => {
    const section = formatSection('Test Section');
    expect(section).toContain('──');
    expect(section).toContain('Test Section');
  });

  it('should generate color hints for different languages', () => {
    const pythonHints = generateColorHints('python');
    const csharpHints = generateColorHints('csharp');

    expect(pythonHints).toContain('# Catppuccin Mocha theme hints');
    expect(pythonHints).toContain(colors.overlay0);
    expect(csharpHints).toContain('// Catppuccin Mocha theme hints');
    expect(csharpHints).toContain(colors.mauve);
  });

  it('should have chalk color functions defined', () => {
    expect(c.success).toBeDefined();
    expect(c.error).toBeDefined();
    expect(c.warning).toBeDefined();
    expect(c.brand).toBeDefined();
    expect(c.exploit).toBeDefined();
  });
});