"use client";

import dynamic from "next/dynamic";

export const NavigationViewDynamic = dynamic(
  () => import("./NavigationView").then((m) => m.NavigationView),
  { ssr: false }
);
