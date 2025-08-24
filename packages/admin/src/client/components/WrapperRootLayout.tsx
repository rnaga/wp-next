"use client";
import dynamic from "next/dynamic";

export const WrapperRootLayout = dynamic(
  async () => await import("./RootLayout"),
  {
    ssr: false,
  }
);
