"use server";

import { refresh } from "next/cache";
import { getAuthClient, getCurrentUser, getSupabase } from "@/lib/supabase-server";

export type ApplyState = {
  status: "idle" | "success" | "full" | "error";
  message: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function apply(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const classId = String(formData.get("classId") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!UUID_RE.test(classId)) {
    return { status: "error", message: "잘못된 요청입니다." };
  }
  if (name.length < 1 || name.length > 30) {
    return { status: "error", message: "이름은 1~30자로 적어 주세요." };
  }

  // 화면을 거치지 않고 액션만 호출해도 막히도록 여기서도 로그인을 확인한다
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "로그인이 끝났어요. 다시 로그인해 주세요." };
  }

  // 정원 확인과 저장은 DB 함수 안에서 잠금과 함께 한 번에 처리한다.
  const { data, error } = await getSupabase().rpc("apply_to_class", {
    p_class_id: classId,
    p_user_id: user.id,
    p_name: name,
  });

  if (error) {
    console.error("apply_to_class failed:", error);
    return {
      status: "error",
      message: "신청을 저장하지 못했어요. 잠시 뒤 다시 눌러 주세요.",
    };
  }

  const result = data as { ok: boolean; reason?: string; remaining?: number };
  refresh(); // 남은 자리 / 마감 표시를 최신으로

  if (result.ok) {
    return { status: "success", message: `${name}님, 신청했어요. 클래스에서 만나요!` };
  }
  if (result.reason === "already") {
    return { status: "error", message: "이미 이 클래스를 신청했어요." };
  }
  if (result.reason === "full") {
    return { status: "full", message: "방금 자리가 모두 찼어요. 신청되지 않았어요." };
  }
  return { status: "error", message: "이 클래스를 찾을 수 없어요. 새로고침해 주세요." };
}

export type CancelState = { status: "idle" | "error"; message: string };

export async function cancel(
  _prev: CancelState,
  formData: FormData,
): Promise<CancelState> {
  const signupId = String(formData.get("signupId") ?? "");
  if (!UUID_RE.test(signupId)) {
    return { status: "error", message: "잘못된 요청입니다." };
  }

  // 로그인한 사용자의 세션으로 지운다: RLS 때문에 남의 신청은 지워지지 않는다(0행).
  const { data, error } = await (await getAuthClient())
    .from("signups")
    .delete()
    .eq("id", signupId)
    .select("id");

  if (error) {
    console.error("cancel signup failed:", error);
    return { status: "error", message: "취소하지 못했어요. 잠시 뒤 다시 눌러 주세요." };
  }
  refresh();
  if (data.length === 0) {
    return { status: "error", message: "취소할 신청을 찾지 못했어요. 새로고침해 주세요." };
  }
  return { status: "idle", message: "" };
}
