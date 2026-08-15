import { NavLink } from "react-router";
import { Show, useUser } from "@clerk/react-router";
import { navItems } from "./navItems";
import { useCatchUpMatches } from "../hooks/useCatchUpMatches";
import { IconAdmin } from "../components/icons";
import { ADMIN_USER_ID } from "../lib/admin";

export function Sidebar() {
  const { isSignedIn, user } = useUser();
  const { matches: catchUpMatches } = useCatchUpMatches();
  const catchUpCount = isSignedIn ? catchUpMatches.length : 0;
  const isAdmin = user?.id === ADMIN_USER_ID;

  return (
    <aside className="hidden md:flex flex-col w-[230px] shrink-0 bg-nuit border-r border-ligne px-3.5 py-5">
      <div className="font-display font-black [font-stretch:116%] text-[19px] tracking-[-0.03em] uppercase px-2 mb-6.5">
        Eleven<span className="text-projecteur">Logs</span>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              ["nav-lateral-item", isActive ? "actif" : ""]
                .filter(Boolean)
                .join(" ")
            }
          >
            <Icon className="w-[17px] h-[17px] shrink-0" />
            {label}
            {to === "/journal" && catchUpCount > 0 && (
              <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-projecteur text-noir font-data text-[10px] font-bold grid place-items-center">
                {catchUpCount}
              </span>
            )}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              ["nav-lateral-item", isActive ? "actif" : ""]
                .filter(Boolean)
                .join(" ")
            }
          >
            <IconAdmin className="w-[17px] h-[17px] shrink-0" />
            Admin
          </NavLink>
        )}
      </nav>

      {/* Le lien "Profil" ci-dessus couvre déjà le compte connecté — ce bloc
          ne sert que le rappel de connexion pour un visiteur non connecté. */}
      <Show when="signed-out">
        <div className="mt-auto pt-4 border-t border-ligne">
          <NavLink to="/connexion" className="nav-lateral-item">
            Se connecter
          </NavLink>
        </div>
      </Show>
    </aside>
  );
}
