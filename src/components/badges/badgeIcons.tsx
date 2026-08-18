import type { ComponentType, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

// Même convention que src/components/icons.tsx (trait 2px, currentColor) —
// jeu d'icônes séparé pour ne pas alourdir le fichier de navigation avec des
// pictos qui ne servent qu'aux badges.
const base: IconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

function IconVolume(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8.5 9.8 10l.8 2.6h2.8l.8-2.6z" />
    </svg>
  );
}

function IconStreak(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2c1 3-3 4-3 8a3 3 0 0 0 6 0c1 1 1.6 2.3 1.6 3.6A4.6 4.6 0 0 1 12 22a5 5 0 0 1-5-5c0-4 2-5 2-9 1 1 1.5 2 1.5 3.5C10.5 8 12 5 12 2z" />
    </svg>
  );
}

function IconContinents(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </svg>
  );
}

function IconCompetitions(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M12 13v4M9 21h6M9.5 17h5l.5 4h-6z" />
    </svg>
  );
}

function IconTeams(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 3 6 5 3 8l2 2 1-1v10h12V9l1 1 2-2-3-3-3-2a3 3 0 0 1-6 0z" />
    </svg>
  );
}

function IconFollowers(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
      <path d="M12 3v2M9 4.5l1 1M15 4.5l-1 1" />
    </svg>
  );
}

function IconFollowing(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <circle cx="17" cy="7" r="2.8" />
      <path d="M21.5 19c-.2-2.8-2-4.8-4.5-5.4" />
    </svg>
  );
}

function IconMotm(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m12 3 2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.6-4.1 6.1-.6z" />
    </svg>
  );
}

function IconComments(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5h16v11H9l-4 4v-4H4z" />
      <path d="M8 9h8M8 12.5h5" />
    </svg>
  );
}

function IconMultiplex(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export const BADGE_TRACK_ICONS: Record<string, ComponentType<IconProps>> = {
  volume: IconVolume,
  streak: IconStreak,
  continents: IconContinents,
  competitions: IconCompetitions,
  teams: IconTeams,
  followers: IconFollowers,
  following: IconFollowing,
  motm: IconMotm,
  comments: IconComments,
  multiplex: IconMultiplex,
};
