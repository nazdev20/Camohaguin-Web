"use client";

import dynamic from "next/dynamic";

const ExistingPortal = dynamic(() => import("../App"), { ssr: false });

export function Portal() {
  return <ExistingPortal />;
}