import { SeatDoodles } from "./SeatDoodles";

// 클래스 제목·일시·남은 자리 (메인과 /demo가 함께 사용)
export function ClassInfo({
  title,
  when,
  capacity,
  taken,
}: {
  title: string;
  when: string;
  capacity: number;
  taken: number;
}) {
  const filled = Math.min(taken, capacity);
  const remaining = capacity - filled;
  const closed = remaining === 0;

  return (
    <>
      <header>
        <h1 className="font-hand text-[2.75rem] leading-none text-ink sm:text-5xl">
          {title}
        </h1>
        {/* 제목 밑에 연필로 쓱 그은 노란 밑줄 */}
        <svg
          viewBox="0 0 300 14"
          preserveAspectRatio="none"
          className="mt-1 h-2 w-3/5 text-pencil"
          aria-hidden
        >
          <path
            d="M3 9 C 60 4, 120 12, 180 7 S 270 5, 297 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
        <p className="mt-4 text-lg text-ink-soft">{when}</p>
      </header>

      <section
        aria-labelledby="seats-title"
        className="relative flex flex-col gap-3"
      >
        {closed && (
          <span className="hand-edge pointer-events-none absolute right-0 top-10 rotate-[-5deg] border-2 border-red bg-sheet/90 px-3 pt-1 pb-0.5 font-hand text-4xl leading-none text-red">
            마감
          </span>
        )}
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="seats-title" className="text-sm text-ink-soft">
            남은 자리
          </h2>
          <p className="font-hand text-3xl leading-none tabular-nums">
            <span className={closed ? "text-red" : "text-ink"}>{remaining}</span>
            <span className="text-ink-soft"> / {capacity}</span>
          </p>
        </div>
        <SeatDoodles capacity={capacity} taken={filled} />
        <p className="text-sm text-ink-soft">
          {closed ? "자리가 모두 찼어요." : "칠한 동그라미는 이미 찬 자리예요."}
        </p>
      </section>
    </>
  );
}
