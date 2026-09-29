"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { FaRightToBracket, FaUser } from "react-icons/fa6";

export function SessionLink() {
  const { user } = useAuth();
  const href = user ? "/perfil" : "/login";

  return (
    <Link
      href={href}
      aria-label={user ? "Abrir perfil" : "Iniciar sesión"}
      className="ml-auto flex size-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:hover:bg-white/10"
    >
      {user ? (
        <FaUser aria-hidden="true" className="size-5" />
      ) : (
        <FaRightToBracket aria-hidden="true" className="size-5" />
      )}
    </Link>
  );
}
