"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";

export function LogoutButton() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSubmitting}
      className="bg-zinc-950 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-zinc-950"
    >
      {isSubmitting ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
