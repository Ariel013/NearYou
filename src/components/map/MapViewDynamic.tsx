"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const MapViewDynamic = dynamic(
  () => import("./MapView").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[50vh] w-full rounded-2xl" />,
  }
);
