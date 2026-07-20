import { AppShell } from "@/components/app-shell";
import { AuthForm } from "@/components/auth-form";
import { signIn } from "@/actions/auth";

export default function LoginPage() {
  return (
    <AppShell>
      <AuthForm mode="login" action={signIn} />
    </AppShell>
  );
}
