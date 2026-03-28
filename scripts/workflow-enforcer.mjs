// Hook: UserPromptSubmit — enforces QCDC workflow on ambiguous requests
import { readFileSync } from "fs";
import chalk from "chalk";

// Catppuccin Mocha colors for consistent theming
const colors = {
  mauve: "#cba6f7",
  red: "#f38ba8",
  pink: "#f5c2e7",
  yellow: "#f9e2af",
  peach: "#fab387",
  blue: "#89b4fa",
  lavender: "#b4befe",
  overlay0: "#6c7086",
  green: "#a6e3a1"
};

const c = {
  brand: chalk.hex(colors.mauve).bold,
  question: chalk.hex(colors.blue),
  check: chalk.hex(colors.green),
  warning: chalk.hex(colors.yellow),
  muted: chalk.hex(colors.overlay0)
};

let input;
try {
  input = JSON.parse(readFileSync("/dev/stdin", "utf-8"));
} catch (error) {
  // Handle malformed JSON or empty stdin - continue normally
  console.log(JSON.stringify({ "continue": true }));
  process.exit(0);
}

const message = (input.message || input.prompt || "").toLowerCase();

// Bypass conditions - don't trigger QCDC enforcement for these
const bypassPatterns = [
  // Explicit skill invocations
  "/armsforge:",

  // Follow-up/clarification messages (typically short)
  /^(yes|no|correct|right|wrong|exactly|ok|sure|thanks)(\s|$)/,

  // Already specific requests with clear parameters
  /\b(list|show|display|get|read|check)\s+(templates?|skills?|agents?|files?)\b/,

  // Help and informational requests
  /\b(help|info|status|version)\b/,

  // Commands with specific targets
  /\b(exploit|payload|loader|implant|stager)\s+for\s+\w+/,
];

// Ambiguity indicators that should trigger QCDC
const ambiguityPatterns = [
  // Vague action words without specifics
  /\b(build|create|make|generate|develop|write)\s+(something|anything|tool|code|exploit|payload|loader|implant)\b/,

  // Missing critical context
  /\b(build|create|make|generate)\s+.*\b(but|without|need|want|should)\b.*\b(not sure|don't know|unclear|help)\b/,

  // Generic requests without target specification
  /\b(build|create|make|generate)\s+(exploit|payload|loader|implant)(?!\s+for\s+\w+)/,

  // Open-ended research requests
  /\b(research|investigate|find|look into|explore)\b.*\b(options|possibilities|approaches|methods)\b/,

  // Requests with multiple undefined variables
  /\b(exploit|payload|loader|implant)\b.*\b(and|or|maybe|possibly|could|might)\b.*\b(exploit|payload|loader|implant)\b/,
];

// Check for bypass conditions first
const shouldBypass = bypassPatterns.some(pattern => {
  if (typeof pattern === "string") {
    return message.includes(pattern);
  } else {
    return pattern.test(message);
  }
});

if (shouldBypass) {
  // Allow message to continue without QCDC enforcement
  process.stdout.write(JSON.stringify({ continue: true }));
} else {
  // Check for ambiguity indicators
  const isAmbiguous = ambiguityPatterns.some(pattern => pattern.test(message));

  if (isAmbiguous) {
    const icon = "❓";
    const output = {
      continue: true,
      message: `hook additional context: ${c.muted("[")}${c.brand("QCDC-ENFORCER")}${c.muted("]")} ${icon} ${c.warning("Ambiguous request detected.")} Consider using ${c.brand("/armsforge:questioner")} to clarify requirements before proceeding, or provide specific details about target platform, objective, and constraints.`
    };
    process.stdout.write(JSON.stringify(output));
  } else {
    // Message seems specific enough, allow to continue
    process.stdout.write(JSON.stringify({ continue: true }));
  }
}