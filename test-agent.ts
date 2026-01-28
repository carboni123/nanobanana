/**
 * Test the SDK with NanoBanana agent identity
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Options } from "@anthropic-ai/claude-agent-sdk";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

async function main() {
  // Load OAuth credentials
  const credPath = join(homedir(), ".claude", ".credentials.json");
  if (!existsSync(credPath)) {
    console.error("No Claude credentials found. Run: claude login");
    process.exit(1);
  }

  const creds = JSON.parse(readFileSync(credPath, "utf-8"));
  process.env.CLAUDE_CODE_OAUTH_TOKEN = creds.claudeAiOauth?.accessToken;
  delete process.env.ANTHROPIC_API_KEY;

  console.log(`Using ${creds.claudeAiOauth?.subscriptionType} subscription`);
  console.log("Testing with tech-lead-agent identity...\n");

  const options: Options = {
    cwd: process.cwd(),
    // Use the tech-lead-agent from .claude/agents/
    agent: "tech-lead-agent",
    allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
  };

  const prompt = `
You are starting your work day at NanoBanana.

1. Read your agent definition from .claude/agents/tech-lead-agent.md
2. Check the project structure (list files in backend/)
3. Write a brief standup report to reports/tech-lead.md

Be concise. This is a test.
`;

  try {
    for await (const message of query({ prompt, options })) {
      const msgType = (message as { type?: string }).type;

      if (msgType === "assistant") {
        const msg = message as { message: { content: Array<{ type: string; text?: string }> } };
        for (const block of msg.message.content) {
          if (block.type === "text" && block.text) {
            console.log(block.text);
          }
        }
      } else if (msgType === "result") {
        const msg = message as { result?: string };
        console.log("\n--- Result ---");
        console.log(msg.result);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
