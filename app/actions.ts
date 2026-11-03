"use server";

import { refresh } from "next/cache";
import { getSupabase } from "@/lib/supabase-server";

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
    return { status: "error", message: "이름을 1~30자로 입력해 주세요." };
  }

  // 정원 확인과 저장은 DB 함수 안에서 잠금과 함께 한 번에 처리한다.
  const { data, error } = await getSupabase().rpc("apply_to_class", {
    p_class_id: classId,
    p_name: name,
  });

  if (error) {
    console.error("apply_to_class failed:", error);
    return {
      status: "error",
      message: "신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  const result = data as { ok: boolean; reason?: string; remaining?: number };
  refresh(); // 남은 자리 / 마감 표시를 최신으로

  if (result.ok) {
    return { status: "success", message: `${name}님, 신청이 완료되었습니다!` };
  }
  if (result.reason === "full") {
    return { status: "full", message: "아쉽게도 정원이 마감되었습니다." };
  }
  return { status: "error", message: "클래스를 찾을 수 없습니다." };
}
