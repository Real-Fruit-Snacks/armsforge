// Hook: UserPromptSubmit — detects offensive dev keywords and suggests skills
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
  overlay0: "#6c7086"
};

const c = {
  brand: chalk.hex(colors.mauve).bold,
  exploit: chalk.hex(colors.red),
  payload: chalk.hex(colors.mauve),
  loader: chalk.hex(colors.pink),
  opsec: chalk.hex(colors.yellow),
  privesc: chalk.hex(colors.peach),
  methodology: chalk.hex(colors.blue),
  questioner: chalk.hex(colors.lavender),
  "qa-loop": chalk.hex("#a6e3a1"), // green
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

const keywords = {
  exploit: ["write an exploit", "exploit for", "buffer overflow", "bof exploit", "format string", "deserialization exploit"],
  payload: ["generate payload", "create shellcode", "build a stager", "shellcode for", "msfvenom alternative"],
  loader: ["build a loader", "shellcode runner", "dropper", "build loader", "process injection", "shellcode loader"],
  "opsec-review": ["opsec check", "will edr catch", "check for detection", "opsec review", "detection risk", "will this get caught", "av evasion review"],
  privesc: ["privesc", "privilege escalation", "get root", "get system", "escalate privileges"],
  methodology: ["exam methodology", "oscp checklist", "osep checklist", "what haven't i tried", "exam approach"],
  questioner: ["clarify requirements", "need more details", "what information do you need", "help me plan", "unclear objectives", "complex project"],
  "qa-loop": ["test this tool", "validate exploit", "check if it works", "iterative testing", "quality assurance", "fix and retry"],
};

// Security context icons
const icons = {
  exploit: "⊗",
  payload: "🎯",
  loader: "📦",
  "opsec-review": "👁",
  privesc: "🔑",
  methodology: "📋",
  questioner: "❓",
  "qa-loop": "🔄"
};

let detected = null;
for (const [skill, triggers] of Object.entries(keywords)) {
  if (triggers.some((t) => message.includes(t))) {
    detected = skill;
    break;
  }
}

if (detected) {
  const icon = icons[detected] || "•";
  const coloredSkill = c[detected] || c.brand;
  const skillName = c.brand(`/armsforge:${detected}`);

  const output = {
    continue: true,
    message: `hook additional context: ${c.muted("[")}${c.brand("ARMSFORGE")}${c.muted("]")} ${icon} Detected ${coloredSkill(`"${detected}"`)} intent. Consider using ${skillName} skill for structured workflow.`,
  };
  process.stdout.write(JSON.stringify(output));
} else {
  process.stdout.write(JSON.stringify({ continue: true }));
}
