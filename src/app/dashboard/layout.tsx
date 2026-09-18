import { SpineNav } from "@/components/layout/SpineNav";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getActiveWorkspace();
  const supabase = context?.supabase ?? createClient();
  const user = context?.user;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user?.id)
    .single();
  const providers = [...new Set((user?.identities ?? []).map((identity) => identity.provider))];

  return (
    <ToastProvider>
      <div className="min-h-screen overflow-x-hidden">
        <div className="mx-auto flex min-h-screen max-w-[1400px]">
          <SpineNav />
          <main className="min-w-0 flex-1 px-4 pb-20 pt-5 sm:px-7 sm:pt-7 lg:px-10 xl:px-14">
            <div className="mx-auto max-w-[1100px]">
              <Header
                userEmail={context?.identity.email ?? user?.email ?? ""}
                fullName={context?.identity.name ?? profile?.full_name ?? user?.email ?? "Account"}
                avatarUrl={context?.identity.avatarUrl ?? profile?.avatar_url ?? null}
                providers={providers}
                activeProvider={context?.identity.provider}
              />
              <div className="space-y-8">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
