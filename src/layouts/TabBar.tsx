import { NavLink } from "react-router";
import { useUser } from "@clerk/react-router";
import { navItems } from "./navItems";
import { useCatchUpMatches } from "../hooks/useCatchUpMatches";

export function TabBar() {
  const { isSignedIn } = useUser();
  const { matches: catchUpMatches } = useCatchUpMatches();
  const catchUpCount = isSignedIn ? catchUpMatches.length : 0;

  return (
    <nav className="flex md:hidden items-center rounded-[28px] border border-white/10 bg-nuit/70 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.45)] px-1.5 py-2.5">
      {navItems.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          aria-label={label}
          className={({ isActive }) =>
            ["nav-tab", isActive ? "actif" : ""].filter(Boolean).join(" ")
          }
        >
          <span className="relative inline-flex">
            <Icon className="w-[21px] h-[21px]" />
            {to === "/matchs" && catchUpCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-projecteur" />
            )}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
