import type { AvatarConfig, Scenario } from "@shared/sellio";

interface AvatarProps {
  config: AvatarConfig;
  className?: string;
  label?: string;
  /** Adds a soft white ring, used on cards and in the chat header. */
  ring?: boolean;
}

function Hair({ config }: { config: AvatarConfig }) {
  const fill = config.hair;
  const cap =
    "M36 54c0-14 10.5-25 24-25s24 11 24 25c-1-9-5-13-7-14-4 3.5-10 5-17 5s-13-1.5-17-5c-2 1-6 5-7 14z";

  switch (config.hairStyle) {
    case "long":
      return (
        <g fill={fill}>
          <path d="M33.5 52c-2.4 8-2.6 19-1.2 27h10.4V55z" />
          <path d="M86.5 52c2.4 8 2.6 19 1.2 27H77.3V55z" />
          <path d={cap} />
        </g>
      );
    case "bun":
      return (
        <g fill={fill}>
          <circle cx="60" cy="24" r="9.5" />
          <path d={cap} />
        </g>
      );
    case "curly":
      return (
        <g fill={fill}>
          <circle cx="45" cy="35" r="11" />
          <circle cx="60" cy="29" r="12.5" />
          <circle cx="75" cy="35" r="11" />
          <path d={cap} />
        </g>
      );
    default:
      return <path d={cap} fill={fill} />;
  }
}

export function Avatar({ config, className = "h-16 w-16", label, ring }: AvatarProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${
        ring ? "ring-4 ring-white" : ""
      } ${className}`}
      role="img"
      aria-label={label ?? "Kundeillustrasjon"}
    >
      <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
        <circle cx="60" cy="60" r="60" fill={config.bg} />
        <path d="M14 120c0-19 13-31 30-34h32c17 3 30 15 30 34z" fill={config.shirt} />
        <rect x="51" y="68" width="18" height="16" rx="9" fill={config.skin} />
        <circle cx="60" cy="52" r="24" fill={config.skin} />
        <circle cx="35.5" cy="54" r="4.2" fill={config.skin} />
        <circle cx="84.5" cy="54" r="4.2" fill={config.skin} />
        <Hair config={config} />
        <circle cx="51.5" cy="52" r="2.5" fill="#2d2c2b" />
        <circle cx="68.5" cy="52" r="2.5" fill="#2d2c2b" />
        <path
          d="M53.8 61c2.6 3.1 9.8 3.1 12.4 0"
          stroke="#2d2c2b"
          strokeWidth="2.3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  );
}

export function ScenarioAvatar({
  scenario,
  className,
  ring,
}: {
  scenario: Scenario;
  className?: string;
  ring?: boolean;
}) {
  return (
    <Avatar
      config={scenario.avatar}
      className={className}
      label={`Illustrasjon av ${scenario.customerName}`}
      ring={ring}
    />
  );
}
