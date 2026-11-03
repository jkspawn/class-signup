"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthClient } from "@/lib/supabase-server";

export type AuthState = {
  status: "idle" | "info" | "error";
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Supabase 오류 코드 → 화면 문구
const MESSAGES: Record<string, string> = {
  invalid_credentials: "이메일 또는 비밀번호가 맞지 않아요.",
  email_not_confirmed: "아직 메일 확인 전이에요. 받은 메일의 링크를 먼저 눌러 주세요.",
  user_already_exists: "이미 가입한 이메일이에요. 로그인해 주세요.",
  weak_password: "비밀번호가 너무 쉬워요. 6자 이상으로 적어 주세요.",
  over_email_send_rate_limit: "메일을 너무 자주 보냈어요. 잠시 뒤 다시 해 주세요.",
  over_request_rate_limit: "요청이 너무 많아요. 잠시 뒤 다시 해 주세요.",
};

export async function authenticate(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const intent = formData.get("intent") === "signup" ? "signup" : "login";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "이메일 주소를 확인해 주세요." };
  }
  if (password.length < 6) {
    return { status: "error", message: "비밀번호는 6자 이상으로 적어 주세요." };
  }

  const supabase = await getAuthClient();

  if (intent === "login") {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return fail("signIn", error);
    redirect("/");
  }

  // 메일 확인이 켜져 있으면 링크가 /auth/callback 으로 돌아온다
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return fail("signUp", error);
  if (data.session) redirect("/"); // 메일 확인을 끈 프로젝트는 바로 로그인된다

  return {
    status: "info",
    message: `${email}로 확인 메일을 보냈어요. 메일의 링크를 누르면 로그인돼요.`,
  };
}

function fail(step: string, error: { code?: string; message: string }): AuthState {
  const message = error.code ? MESSAGES[error.code] : undefined;
  if (!message) console.error(`${step} failed:`, error);
  return {
    status: "error",
    message: message ?? "잠시 문제가 생겼어요. 다시 시도해 주세요.",
  };
}

export async function signOut() {
  await (await getAuthClient()).auth.signOut();
  redirect("/login");
}
