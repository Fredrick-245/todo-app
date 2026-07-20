import { AuthForm } from "@/components/auth-form";
import { signUp } from "@/actions/auth";

export default function SignupPage() {
  return (
    <AuthForm
      mode="signup"
      action={signUp}
      requireInvite={Boolean(process.env.APP_INVITE_CODE)}
    />
  );
}
