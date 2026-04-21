import type { NextConfig } from "next";
import getNextDevConfig from "./next-config/get-next-config.dev";

const nextConfig: NextConfig = getNextDevConfig();

export default nextConfig;
