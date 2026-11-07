import { useMemo, useState } from "react";
import { MOVE_META, type TranscriptMessage } from "@shared/sellio";

interface MomentumChartProps {
  points: { index: number; value: number }[];
  messages: TranscriptMessage[];
  onSelect: (index: number) => void;
  selected: number | null;
}

const WIDTH = 760;
const HEIGHT = 240;
const PAD = { top: 26, right: 22, bottom: 30, left: 38 };

export function MomentumChart({ points, messages, onSelect, selected }: MomentumChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const data = useMemo(() => {
    const unique = new Map<number, number>();
    points.forEach(point => unique.set(point.index, point.value));
    return [...unique.entries()]
      .map(([index, value]) => ({ index, value }))
      .sort((a, b) => a.index - b.index);
  }, [points]);

  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-[14px] text-ink-mute">
        Det er ikke nok replikker til å tegne en kurve.
      </p>
    );
  }

  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;

  const x = (position: number) =>
    PAD.left + (data.length === 1 ? innerWidth / 2 : (position / (data.length - 1)) * innerWidth);
  const y = (value: number) => PAD.top + innerHeight - (value / 100) * innerHeight;

  const line = data
    .map((point, position) => `${position === 0 ? "M" : "L"}${x(position)} ${y(point.value)}`)
    .join(" ");
  const area = `${line} L${x(data.length - 1)} ${PAD.top + innerHeight} L${x(0)} ${
    PAD.top + innerHeight
  } Z`;

  const active = hovered ?? selected;
  const activePosition = active === null ? -1 : data.findIndex(point => point.index === active);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full touch-manipulation"
        role="img"
        aria-label="Kjøpsinteresse etter hvert trekk"
      >
        <defs>
          <linearGradient id="momentumFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff7300" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ff7300" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map(value => (
          <g key={value}>
            <line
              x1={PAD.left}
              y1={y(value)}
              x2={WIDTH - PAD.right}
              y2={y(value)}
              stroke="#ece8e3"
              strokeWidth="1"
              strokeDasharray={value === 0 ? undefined : "3 6"}
            />
            <text x={PAD.left - 10} y={y(value) + 4} textAnchor="end" fontSize="10.5" fill="#9a948d">
              {value}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#momentumFill)" />
        <path
          d={line}
          fill="none"
          stroke="#ff7300"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((point, position) => {
          const isActive = position === activePosition;
          return (
            <g key={point.index}>
              <circle
                cx={x(position)}
                cy={y(point.value)}
                r={isActive ? 7.5 : 5}
                fill={isActive ? "#141313" : "#ffffff"}
                stroke={isActive ? "#141313" : "#ff7300"}
                strokeWidth="2.5"
                style={{ transition: "r 150ms ease" }}
              />
              <rect
                x={x(position) - 14}
                y={PAD.top - 6}
                width="28"
                height={innerHeight + 12}
                fill="transparent"
                role="button"
                tabIndex={0}
                aria-label={`Trekk ${point.index + 1}: kjøpsinteresse ${point.value}`}
                className="cursor-pointer outline-none"
                onMouseEnter={() => setHovered(point.index)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(point.index)}
                onBlur={() => setHovered(null)}
                onClick={() => onSelect(point.index)}
                onKeyDown={event => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(point.index);
                  }
                }}
              />
            </g>
          );
        })}

        {activePosition >= 0 && (
          <g pointerEvents="none">
            <line
              x1={x(activePosition)}
              y1={PAD.top - 4}
              x2={x(activePosition)}
              y2={PAD.top + innerHeight}
              stroke="#141313"
              strokeWidth="1"
              strokeDasharray="3 4"
              opacity="0.35"
            />
            <g
              transform={`translate(${Math.min(
                Math.max(x(activePosition) - 62, PAD.left),
                WIDTH - PAD.right - 124
              )}, ${Math.max(y(data[activePosition].value) - 52, 4)})`}
            >
              <rect width="124" height="40" rx="10" fill="#141313" />
              <text x="12" y="16" fontSize="9.5" fill="rgba(255,255,255,0.55)" fontWeight="600">
                TREKK {activePosition + 1}
              </text>
              <text x="12" y="30" fontSize="12.5" fill="#ffffff" fontWeight="700">
                Interesse {data[activePosition].value}
              </text>
            </g>
          </g>
        )}

        <text x={PAD.left} y={HEIGHT - 8} fontSize="10.5" fill="#9a948d">
          Første replikk
        </text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 8} fontSize="10.5" fill="#9a948d" textAnchor="end">
          Siste replikk
        </text>
      </svg>

      <p className="mt-1 text-[12.5px] text-ink-mute">
        Trykk på et punkt for å hoppe til replikken i transkriptet.
        {selected !== null && messages[selected] && (
          <span className="ml-1 font-medium text-ink-soft">
            Valgt: trekk {(data.findIndex(point => point.index === selected) ?? 0) + 1}
            {messages[selected].label ? ` · ${MOVE_META[messages[selected].label!].label}` : ""}
          </span>
        )}
      </p>
    </div>
  );
}
