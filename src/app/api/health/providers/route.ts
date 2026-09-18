import { NextResponse } from "next/server";

type ProviderCheck = {
  name: string;
  endpoint: string;
  status?: number;
  duration: number;
  state: "healthy" | "degraded" | "error";
  message: string;
};

const timeoutMs = 5000;

async function checkProvider(name: string, endpoint: string): Promise<ProviderCheck> {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const duration = Math.round(performance.now() - started);
    const state = response.status >= 200 && response.status < 500 ? "healthy" : response.status < 600 ? "degraded" : "error";
    const message =
      response.status >= 200 && response.status < 300
        ? "Operational"
        : response.status === 401 || response.status === 403
          ? "Reachable"
          : response.status >= 500
            ? "Provider error"
            : "Unexpected response";

    return { name, endpoint, status: response.status, duration, state, message };
  } catch (error) {
    return {
      name,
      endpoint,
      duration: Math.round(performance.now() - started),
      state: "error",
      message: error instanceof DOMException && error.name === "AbortError" ? "Timed out" : "Network error",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const checks = await Promise.all([
    checkProvider("Google OAuth", "https://accounts.google.com/.well-known/openid-configuration"),
    checkProvider("GitHub API", "https://api.github.com/zen"),
    supabaseUrl
      ? checkProvider("Supabase API", `${supabaseUrl.replace(/\/$/, "")}/rest/v1/`)
      : Promise.resolve({
          name: "Supabase API",
          endpoint: "NEXT_PUBLIC_SUPABASE_URL",
          duration: 0,
          state: "error" as const,
          message: "Supabase URL is not configured",
        }),
  ]);

  return NextResponse.json({ checks });
}
