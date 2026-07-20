import { AuthForm } from "@/components/auth-form";
import { signIn } from "@/actions/auth";

export default function LoginPage() {
  return <AuthForm mode="login" action={signIn} />;
}
