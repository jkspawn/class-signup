"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase-server";
import { deleteById, selectById, selectMine, type ProbeResult } from "./probes";

export type ProbeState = { history: ProbeResult[]; notice: string };

export async function probe(prev: ProbeState, formData: FormData): Promise<ProbeState> {
  if (!(await getCurrentUser())) redirect("/login");

  const intent = String(formData.get("intent") ?? "");
  const target = String(formData.get("target") ?? "").trim();

  let result: ProbeResult;
  if (intent === "mine") {
    result = await selectMine();
  } else if (!target) {
    return { ...prev, notice: "신청 ID를 넣어 주세요." };
  } else if (intent === "delete") {
    result = await deleteById(target);
    refresh(); // 지워졌다면 위의 내 신청 목록과 남은 자리도 다시 그린다
  } else {
    result = await selectById(target);
  }

  return { history: [result, ...prev.history].slice(0, 20), notice: "" };
}
