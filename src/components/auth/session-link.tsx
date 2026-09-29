"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FaRightToBracket, FaUser } from "react-icons/fa6";

export function SessionLink() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { user?: unknown }) => {
        if (isMounted) {
          setIsAuthenticated(Boolean(result.user));
          setIsLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const href = isLoaded && isAuthenticated ? "/perfil" : "/login";

  return (
    <Link
      href={href}
      aria-label={isLoaded && isAuthenticated ? "Abrir perfil" : "Iniciar sesión"}
      className="ml-auto flex size-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:hover:bg-white/10"
    >
      {isLoaded && isAuthenticated ? (
        <FaUser aria-hidden="true" className="size-5" />
      ) : (
        <FaRightToBracket aria-hidden="true" className="size-5" />
      )}
    </Link>
  );
}
