// Runs once when the server starts.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getEnvironmentProblems } = await import("@/lib/env");
  const problems = getEnvironmentProblems();
  if (problems.length) {
    console.error(`[CONFIG] The server is misconfigured; affected features will fail:\n- ${problems.join("\n- ")}`);
  }
}
