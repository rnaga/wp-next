"use client";
import dynamic from "next/dynamic";

export const WrapperLayout = dynamic(
  async () => (await import("./Layout")).Layout,
  {
    ssr: false,
  }
);
