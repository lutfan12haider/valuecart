import { Suspense } from "react";
import { LoginForm } from "@/components/AuthForms";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-center">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
