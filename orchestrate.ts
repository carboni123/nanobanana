/**
 * NanoBanana Company Orchestrator
 *
 * Run agents with their defined identities to execute company workflows.
 * Uses Claude Agent SDK with Claude Max OAuth authentication.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Options } from "@anthropic-ai/claude-agent-sdk";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// Available agents
const AGENTS = {
  ceo: "ceo-agent",
  cto: "cto-agent",
  "tech-lead": "tech-lead-agent",
  qa: "qa-agent",
} as const;

type AgentKey = keyof typeof AGENTS;

interface RunOptions {
  agent: AgentKey;
  task: string;
  timeout?: number;
}

async function loadCredentials(): Promise<string> {
  const credPath = join(homedir(), ".claude", ".credentials.json");
  if (!existsSync(credPath)) {
    throw new Error("No Claude credentials found. Run: claude login");
  }

  const creds = JSON.parse(readFileSync(credPath, "utf-8"));
  if (!creds.claudeAiOauth?.accessToken) {
    throw new Error("No OAuth token found in credentials");
  }

  console.log(`Using ${creds.claudeAiOauth.subscriptionType} subscription`);
  return creds.claudeAiOauth.accessToken;
}

async function runAgent({ agent, task, timeout = 300 }: RunOptions): Promise<string> {
  const agentName = AGENTS[agent];
  console.log(`\n=== Running ${agentName} ===\n`);
  console.log(`Task: ${task.slice(0, 100)}${task.length > 100 ? "..." : ""}\n`);

  const token = await loadCredentials();
  process.env.CLAUDE_CODE_OAUTH_TOKEN = token;
  delete process.env.ANTHROPIC_API_KEY;

  const options: Options = {
    cwd: process.cwd(),
    agent: agentName,
    allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
  };

  let output = "";
  const startTime = Date.now();

  try {
    for await (const message of query({ prompt: task, options })) {
      const msgType = (message as { type?: string }).type;

      if (msgType === "assistant") {
        const msg = message as {
          message: { content: Array<{ type: string; text?: string }> };
        };
        for (const block of msg.message.content) {
          if (block.type === "text" && block.text) {
            output += block.text + "\n";
            // Stream output
            process.stdout.write(block.text);
          }
        }
      } else if (msgType === "result") {
        const msg = message as { result?: string };
        if (msg.result) {
          output = msg.result;
        }
      }

      // Check timeout
      if (Date.now() - startTime > timeout * 1000) {
        console.log("\n[Timeout reached]");
        break;
      }
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n=== ${agentName} completed in ${duration}s ===\n`);

  return output;
}

async function runWorkflow(tasks: Array<{ agent: AgentKey; task: string }>) {
  console.log("Starting NanoBanana workflow...\n");

  const results: Array<{ agent: string; output: string }> = [];

  for (const { agent, task } of tasks) {
    const output = await runAgent({ agent, task });
    results.push({ agent, output });
  }

  // Save workflow results
  const timestamp = new Date().toISOString().slice(0, 10);
  const reportPath = join(process.cwd(), "reports", `workflow-${timestamp}.md`);

  let report = `# Workflow Report - ${timestamp}\n\n`;
  for (const { agent, output } of results) {
    report += `## ${agent}\n\n${output}\n\n---\n\n`;
  }

  mkdirSync(join(process.cwd(), "reports"), { recursive: true });
  writeFileSync(reportPath, report);
  console.log(`\nWorkflow report saved to: ${reportPath}`);
}

// CLI
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
NanoBanana Company Orchestrator

Usage:
  npx ts-node orchestrate.ts <agent> <task>
  npx ts-node orchestrate.ts standup

Agents:
  ceo         - CEO/Business strategy
  cto         - CTO/Product Owner
  tech-lead   - Tech Lead/Implementation
  qa          - QA Engineer/Quality

Examples:
  npx ts-node orchestrate.ts tech-lead "Implement user registration endpoint"
  npx ts-node orchestrate.ts qa "Review the auth implementation"
  npx ts-node orchestrate.ts standup
`);
  process.exit(0);
}

async function main() {
  if (args[0] === "standup") {
    // Run daily standup for all agents
    await runWorkflow([
      {
        agent: "ceo",
        task: "Read your agent definition and write a brief standup report to reports/ceo.md. Include: what you're working on, priorities, and any blockers.",
      },
      {
        agent: "cto",
        task: "Read your agent definition and check the sprint status in AGENTS.md. Write a standup report to reports/cto.md with: sprint progress, technical decisions needed, and any blockers.",
      },
      {
        agent: "tech-lead",
        task: "Read your agent definition and check your assigned tasks in AGENTS.md. Write a standup report to reports/tech-lead.md with: what you completed, what you're working on, and any blockers.",
      },
      {
        agent: "qa",
        task: "Read your agent definition. Write a standup report to reports/qa.md with: what needs review, quality concerns, and any blockers.",
      },
    ]);
  } else if (args[0] in AGENTS) {
    // Run single agent with task
    const agent = args[0] as AgentKey;
    const task = args.slice(1).join(" ");

    if (!task) {
      console.error("Error: No task provided");
      process.exit(1);
    }

    await runAgent({ agent, task });
  } else {
    console.error(`Unknown agent: ${args[0]}`);
    console.log("Available agents:", Object.keys(AGENTS).join(", "));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
