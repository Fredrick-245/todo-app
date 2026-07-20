import { AppShell } from "@/components/app-shell";
import { AuthForm } from "@/components/auth-form";
import { signUp } from "@/actions/auth";

export default function SignupPage() {
  return (
    <AppShell>
      <AuthForm
        mode="signup"
        action={signUp}
        requireInvite={Boolean(process.env.APP_INVITE_CODE)}
      />
    </AppShell>
  );
}
