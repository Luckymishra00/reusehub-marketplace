"use client";

import React, { Suspense } from "react";
import { DashboardContent } from "@/app/dashboard/page";

export default function MyListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="h-96 bg-[#EFECE6] rounded-3xl animate-pulse" />
        </div>
      }
    >
      <DashboardContent defaultTab="listings" />
    </Suspense>
  );
}
