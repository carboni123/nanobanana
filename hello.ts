/**
 * Hello World Script
 *
 * A simple hello world script for the NanoBanana project.
 */

function greet(name: string = "World"): string {
  return `Hello, ${name}!`;
}

function main(): void {
  const args = process.argv.slice(2);
  const name = args[0];

  console.log(greet(name));
  console.log("\nWelcome to NanoBanana - Simple API for AI image generation!");
}

// Run if called directly
if (require.main === module) {
  main();
}

export { greet };
