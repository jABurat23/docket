import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updates: { full_name?: string | null; avatar_url?: string | null } = {};

  if (body.full_name === null || typeof body.full_name === "string") {
    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
    if (fullName.length > 80) {
      return NextResponse.json({ error: "Name must be 80 characters or fewer" }, { status: 400 });
    }
    updates.full_name = fullName || null;
  }

  if (body.avatar_url === null || typeof body.avatar_url === "string") {
    const avatarUrl = typeof body.avatar_url === "string" ? body.avatar_url.trim() : "";
    if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
      return NextResponse.json({ error: "Avatar URL must start with http:// or https://" }, { status: 400 });
    }
    if (avatarUrl.length > 500) {
      return NextResponse.json({ error: "Avatar URL is too long" }, { status: 400 });
    }
    updates.avatar_url = avatarUrl || null;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No profile fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("id, full_name, avatar_url, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data });
}
