// 정원만큼 손으로 그린 동그라미. 찬 자리는 연필 빗금으로 칠한다.

const SIZE = 40;
const C = SIZE / 2;
const R = 15;

// 자리마다 모양이 조금씩 다르지만, 새로고침해도 같은 모양이 나오도록 고정된 난수
function seeded(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// 살짝 삐뚤고 끝이 겹치는 동그라미 (손으로 한 번에 그린 느낌)
function wobblyCircle(seed: number) {
  const rand = seeded(seed + 1);
  const start = rand() * Math.PI * 2;
  const turns = 1.08;
  const steps = 14;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = start + (i / steps) * Math.PI * 2 * turns;
    const r = R + (rand() - 0.5) * 1.4;
    pts.push([C + Math.cos(a) * r, C + Math.sin(a) * r]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  return d;
}

// 동그라미 안쪽을 채우는 45도 빗금 (원 밖으로 나가지 않게 현의 길이로 자른다)
function hatchLines(seed: number) {
  const rand = seeded(seed + 101);
  const r = R - 2.5;
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let off = -r + 2; off < r; off += 3.6) {
    const half = Math.sqrt(r * r - off * off) + (rand() - 0.5) * 2;
    // 45도 방향 단위벡터 u=(1,-1)/√2, 수직 v=(1,1)/√2
    const cx = C + off * Math.SQRT1_2;
    const cy = C + off * Math.SQRT1_2;
    const dx = half * Math.SQRT1_2;
    lines.push({ x1: cx - dx, y1: cy + dx, x2: cx + dx, y2: cy - dx });
  }
  return lines;
}

export function SeatDoodles({
  capacity,
  taken,
}: {
  capacity: number;
  taken: number;
}) {
  return (
    <ul
      className="grid w-fit grid-cols-5 gap-x-2.5 gap-y-1.5"
      aria-label={`정원 ${capacity}자리 중 ${taken}자리 찼음`}
    >
      {Array.from({ length: capacity }, (_, i) => {
        const filled = i < taken;
        return (
          <li key={i} aria-hidden>
            <svg
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              className={filled ? "text-ink-soft" : "text-line"}
            >
              {filled && (
                <g className="hatch" strokeWidth={1.2}>
                  {hatchLines(i).map((l, j) => (
                    <line
                      key={j}
                      {...l}
                      pathLength={1}
                      style={{ ["--d" as string]: `${i * 90 + j * 18}ms` }}
                    />
                  ))}
                </g>
              )}
              <path d={wobblyCircle(i)} strokeWidth={filled ? 1.5 : 1.3} />
            </svg>
          </li>
        );
      })}
    </ul>
  );
}
