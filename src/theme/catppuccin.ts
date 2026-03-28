/**
 * Catppuccin Mocha Color Theme for Armsforge
 * A sophisticated dark theme for offensive security tooling
 */
import chalk from "chalk";

// Catppuccin Mocha Color Palette
export const colors = {
  // Base colors
  base: "#1e1e2e",
  mantle: "#181825",
  crust: "#11111b",

  // Surface colors
  surface0: "#313244",
  surface1: "#45475a",
  surface2: "#585b70",

  // Overlay colors
  overlay0: "#6c7086",
  overlay1: "#7f849c",
  overlay2: "#9399b2",

  // Text colors
  text: "#cdd6f4",
  subtext1: "#bac2de",
  subtext0: "#a6adc8",

  // Accent colors
  rosewater: "#f5e0dc",
  flamingo: "#f2cdcd",
  pink: "#f5c2e7",
  mauve: "#cba6f7",
  red: "#f38ba8",
  maroon: "#eba0ac",
  peach: "#fab387",
  yellow: "#f9e2af",
  green: "#a6e3a1",
  teal: "#94e2d5",
  sky: "#89dceb",
  sapphire: "#74c7ec",
  blue: "#89b4fa",
  lavender: "#b4befe"
} as const;

// Color scheme for different contexts
export const scheme = {
  // Status colors
  success: colors.green,
  warning: colors.yellow,
  error: colors.red,
  info: colors.blue,

  // Security context colors
  exploit: colors.red,
  payload: colors.mauve,
  loader: colors.pink,
  opsec: colors.yellow,
  privesc: colors.peach,
  detection: colors.red,
  evasion: colors.green,

  // UI elements
  primary: colors.mauve,
  secondary: colors.surface1,
  accent: colors.lavender,
  muted: colors.overlay0,

  // Code highlighting hints
  comment: colors.overlay0,
  keyword: colors.mauve,
  string: colors.green,
  number: colors.peach,
  function: colors.blue,
  variable: colors.text,
  type: colors.yellow,
  constant: colors.peach
} as const;

// Chalk color functions for terminal output
export const c = {
  // Status colors
  success: chalk.hex(colors.green),
  warning: chalk.hex(colors.yellow),
  error: chalk.hex(colors.red),
  info: chalk.hex(colors.blue),

  // Security context styling
  exploit: chalk.hex(colors.red).bold,
  payload: chalk.hex(colors.mauve).bold,
  loader: chalk.hex(colors.pink).bold,
  opsec: chalk.hex(colors.yellow).bold,
  privesc: chalk.hex(colors.peach).bold,
  detection: chalk.hex(colors.red).italic,
  evasion: chalk.hex(colors.green).italic,

  // Text hierarchy
  title: chalk.hex(colors.mauve).bold.underline,
  subtitle: chalk.hex(colors.lavender).bold,
  header: chalk.hex(colors.blue).bold,
  subheader: chalk.hex(colors.sapphire),
  text: chalk.hex(colors.text),
  muted: chalk.hex(colors.overlay0),
  dim: chalk.hex(colors.subtext0),

  // UI elements
  prompt: chalk.hex(colors.green).bold,
  input: chalk.hex(colors.blue),
  output: chalk.hex(colors.text),
  filename: chalk.hex(colors.yellow),
  path: chalk.hex(colors.overlay1),

  // Code elements
  code: chalk.hex(colors.text).bgHex(colors.surface0),
  keyword: chalk.hex(colors.mauve).bold,
  string: chalk.hex(colors.green),
  number: chalk.hex(colors.peach),
  comment: chalk.hex(colors.overlay0).italic,

  // Brand colors
  brand: chalk.hex(colors.mauve).bold,
  logo: chalk.hex(colors.lavender).bold,

  // Backgrounds (for highlighting)
  bgBase: chalk.bgHex(colors.base),
  bgSurface: chalk.bgHex(colors.surface0),
  bgAccent: chalk.bgHex(colors.mauve).hex(colors.base)
} as const;

// Status icons with colors
export const icons = {
  success: c.success("✓"),
  warning: c.warning("⚠"),
  error: c.error("✗"),
  info: c.info("ℹ"),
  bullet: c.muted("•"),
  arrow: c.muted("→"),
  chevron: c.muted("›"),
  star: c.brand("★"),
  target: c.exploit("⊗"),
  shield: c.evasion("🛡"),
  key: c.privesc("🔑"),
  eye: c.opsec("👁")
} as const;

// Utility functions
export function formatStatus(status: "success" | "warning" | "error" | "info", message: string): string {
  return `${icons[status]} ${c[status](message)}`;
}

export function formatTitle(title: string): string {
  return c.title(`\n═══ ${title} ═══\n`);
}

export function formatSection(section: string): string {
  return c.subtitle(`\n── ${section} ──\n`);
}

export function formatPath(path: string): string {
  return c.path(path);
}

export function formatCode(code: string): string {
  return c.code(` ${code} `);
}

export function formatSkill(skillName: string): string {
  return c.brand(`/armsforge:${skillName}`);
}

// Security context formatters
export function formatThreat(level: "low" | "medium" | "high" | "critical", message: string): string {
  const colors = {
    low: c.info,
    medium: c.warning,
    high: c.error,
    critical: c.error.bold.underline
  };
  const levelIcons = {
    low: "🟢",
    medium: "🟡",
    high: "🟠",
    critical: "🔴"
  };
  return `${levelIcons[level]} ${colors[level](message)}`;
}

export function formatDetection(detected: boolean, rule: string): string {
  if (detected) {
    return `${c.error("🚨")} ${c.detection(rule)}`;
  }
  return `${c.success("✓")} ${c.evasion(rule)}`;
}

// Template comment generators for syntax highlighting hints
export function generateColorHints(language: "python" | "csharp" | "cpp" | "javascript" | "powershell"): string {
  const hints = {
    python: `# Catppuccin Mocha theme hints for syntax highlighting:
# Comments: ${colors.overlay0}
# Keywords (def, class, import): ${colors.mauve}
# Strings: ${colors.green}
# Numbers: ${colors.peach}
# Functions: ${colors.blue}
# Variables: ${colors.text}`,

    csharp: `// Catppuccin Mocha theme hints for syntax highlighting:
// Comments: ${colors.overlay0}
// Keywords (using, class, public): ${colors.mauve}
// Strings: ${colors.green}
// Numbers: ${colors.peach}
// Methods: ${colors.blue}
// Types: ${colors.yellow}`,

    cpp: `// Catppuccin Mocha theme hints for syntax highlighting:
// Comments: ${colors.overlay0}
// Keywords (int, void, return): ${colors.mauve}
// Strings: ${colors.green}
// Numbers: ${colors.peach}
// Functions: ${colors.blue}
// Preprocessor: ${colors.pink}`,

    javascript: `// Catppuccin Mocha theme hints for syntax highlighting:
// Comments: ${colors.overlay0}
// Keywords (const, let, function): ${colors.mauve}
// Strings: ${colors.green}
// Numbers: ${colors.peach}
// Functions: ${colors.blue}
// Objects: ${colors.text}`,

    powershell: `# Catppuccin Mocha theme hints for syntax highlighting:
# Comments: ${colors.overlay0}
# Cmdlets: ${colors.blue}
# Parameters: ${colors.mauve}
# Strings: ${colors.green}
# Variables: ${colors.peach}
# Operators: ${colors.pink}`
  };

  return hints[language];
}

// CSS variables for documentation styling with caching optimization
let cachedCSSVariables: string | null = null;

export function generateCSSVariables(): string {
  // Return cached result if available (colors are static)
  if (cachedCSSVariables) {
    return cachedCSSVariables;
  }

  // Build CSS variables dynamically for better maintainability
  const colorVars = Object.entries(colors)
    .map(([key, value]) => `  --ctp-${key}: ${value};`)
    .join('\n');

  const semanticMappings = [
    '--bg-primary: var(--ctp-base)',
    '--bg-secondary: var(--ctp-surface0)',
    '--text-primary: var(--ctp-text)',
    '--text-secondary: var(--ctp-subtext1)',
    '--accent-primary: var(--ctp-mauve)',
    '--accent-secondary: var(--ctp-lavender)',
    '--success: var(--ctp-green)',
    '--warning: var(--ctp-yellow)',
    '--error: var(--ctp-red)',
    '--info: var(--ctp-blue)'
  ].map(mapping => `  ${mapping};`).join('\n');

  // Cache the result
  cachedCSSVariables = `:root {
  /* Catppuccin Mocha Theme Variables */
${colorVars}

  /* Semantic color mappings */
${semanticMappings}
}`;

  return cachedCSSVariables;
}