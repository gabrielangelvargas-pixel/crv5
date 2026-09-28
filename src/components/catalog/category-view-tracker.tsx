"use client";

import { useEffect, useRef } from "react";

type CategoryViewTrackerProps = {
  categoryId: string;
};

export function CategoryViewTracker({ categoryId }: CategoryViewTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) {
      return;
    }

    hasTracked.current = true;
    const params = new URLSearchParams(window.location.search);

    void fetch("/api/category-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId,
        source: params.get("utm_source"),
        medium: params.get("utm_medium"),
        campaign: params.get("utm_campaign"),
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [categoryId]);

  return null;
}

