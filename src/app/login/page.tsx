import { Suspense } from "react";
import { LoginCard } from "@/components/layout/LoginCard";

function LoginContent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-8">
      <LoginCard />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
