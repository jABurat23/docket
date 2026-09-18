import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type WorkspaceProvider = "google" | "github";

export type WorkspaceIdentity = {
  provider: WorkspaceProvider;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

export async function getActiveWorkspace() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const identityProviders = new Set(
    (user.identities ?? []).map((identity) => identity.provider).filter((provider): provider is WorkspaceProvider => provider === "google" || provider === "github"),
  );
  const requestedProvider = cookies().get("docket-provider")?.value;
  const defaultProvider = user.app_metadata?.provider === "github" ? "github" : "google";
  const provider = requestedProvider && identityProviders.has(requestedProvider as WorkspaceProvider)
    ? requestedProvider as WorkspaceProvider
    : identityProviders.has(defaultProvider)
      ? defaultProvider
      : [...identityProviders][0];

  if (!provider) return null;

  const identity = (user.identities ?? []).find((item) => item.provider === provider);
  const identityData = (identity?.identity_data ?? {}) as Record<string, unknown>;
  const identityEmail = typeof identityData.email === "string" ? identityData.email : null;
  const identityName =
    (typeof identityData.full_name === "string" && identityData.full_name) ||
    (typeof identityData.name === "string" && identityData.name) ||
    (typeof identityData.user_name === "string" && identityData.user_name) ||
    (typeof identityData.login === "string" && identityData.login) ||
    null;
  const identityAvatar =
    (typeof identityData.avatar_url === "string" && identityData.avatar_url) ||
    (typeof identityData.picture === "string" && identityData.picture) ||
    null;

  const { data: workspace, error } = await supabase
    .from("docket_workspaces")
    .upsert({ user_id: user.id, provider }, { onConflict: "user_id,provider" })
    .select("id, user_id, provider")
    .single();

  if (error) throw new Error(`Unable to load ${provider} workspace: ${error.message}`);
  const activeIdentity: WorkspaceIdentity = {
    provider,
    email: identityEmail ?? user.email ?? null,
    name: identityName,
    avatarUrl: identityAvatar,
  };
  return { supabase, user, workspace, identity: activeIdentity };
}
