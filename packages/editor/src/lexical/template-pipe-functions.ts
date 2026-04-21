import { url } from "node:inspector";
import type * as types from "../types";

export const templatePipeFunctions: Record<string, types.TemplatePipeFunction> =
  {
    trancate: {
      sampleParam: { length: 10 },
      fn: (
        value: string,
        params?: {
          length: string | number;
        }
      ) => {
        const length = Number(params?.length || 10);
        return value.length > length ? value.slice(0, length) + "..." : value;
      },
    },
    uppercase: {
      sampleParam: undefined,
      fn: (value: string) => value.toUpperCase(),
    },
    lowercase: {
      sampleParam: undefined,
      fn: (value: string) => value.toLowerCase(),
    },
    capitalize: {
      sampleParam: undefined,
      fn: (value: string) =>
        value.replace(/\b\w/g, (char) => char.toUpperCase()),
    },
    urlencode: {
      sampleParam: undefined,
      fn: (value: string) => encodeURIComponent(value),
    },
    urldecode: {
      sampleParam: undefined,
      fn: (value: string) => decodeURIComponent(value),
    },
    json: {
      sampleParam: undefined,
      fn: (value: string) => {
        try {
          return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
          return value;
        }
      },
    },
    base64encode: {
      sampleParam: undefined,
      fn: (value: string) =>
        typeof Buffer !== "undefined"
          ? Buffer.from(value).toString("base64")
          : btoa(value),
    },
    base64decode: {
      sampleParam: undefined,
      fn: (value: string) =>
        typeof Buffer !== "undefined"
          ? Buffer.from(value, "base64").toString("utf-8")
          : atob(value),
    },
    formatDate: {
      sampleParam: { format: "YYYY-MM-DD" },
      fn: (value: string, params?: { format: string }) => {
        const date = new Date(value);
        const options: Intl.DateTimeFormatOptions = {};

        if (params?.format.includes("YYYY")) options.year = "numeric";
        if (params?.format.includes("MM")) options.month = "2-digit";
        if (params?.format.includes("DD")) options.day = "2-digit";

        return date.toLocaleDateString(undefined, options);
      },
    },
    timeDiff: {
      sampleParam: { compareTo: "now", type: "seconds" },
      fn: (value: string, params?: { compareTo: string; type: string }) => {
        const compareTo =
          params?.compareTo === "now"
            ? new Date()
            : new Date(params?.compareTo || "");
        const date = new Date(value);
        const diffMs = compareTo.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        switch (params?.type) {
          case "seconds":
            return `${diffSeconds} seconds`;
          case "minutes":
            return `${diffMinutes} minutes`;
          case "hours":
            return `${diffHours} hours`;
          case "days":
            return `${diffDays} days`;
          default:
            return `${diffSeconds} seconds`;
        }
      },
    },
    trim: {
      sampleParam: { targetChar: " " },
      fn: (value: string, params?: { targetChar: string }) => {
        const targetChar = params?.targetChar || " ";
        const regex = new RegExp(`^[${targetChar}]+|[${targetChar}]+$`, "g");
        return value.replace(regex, "");
      },
    },
    replace: {
      sampleParam: { from: "foo", to: "bar" },
      fn: (value: string, params?: { from: string; to: string }) => {
        if (!params?.from) return value;
        return value.split(params.from).join(params.to ?? "");
      },
    },
    slugify: {
      sampleParam: undefined,
      fn: (value: string) =>
        value
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_]+/g, "-")
          .replace(/^-+|-+$/g, ""),
    },
    stripHtml: {
      sampleParam: undefined,
      fn: (value: string) => value.replace(/<[^>]*>/g, ""),
    },
    wordLimit: {
      sampleParam: { count: 10 },
      fn: (value: string, params?: { count: string | number }) => {
        const count = Number(params?.count || 10);
        const words = value.trim().split(/\s+/);
        return words.length <= count
          ? value
          : words.slice(0, count).join(" ") + "...";
      },
    },
    default: {
      sampleParam: { value: "N/A" },
      fn: (value: string, params?: { value: string }) => {
        return value && value.trim() !== "" ? value : (params?.value ?? "");
      },
    },
    prefix: {
      sampleParam: { text: "$" },
      fn: (value: string, params?: { text: string }) =>
        (params?.text ?? "") + value,
    },
    suffix: {
      sampleParam: { text: " items" },
      fn: (value: string, params?: { text: string }) =>
        value + (params?.text ?? ""),
    },
    number: {
      sampleParam: { locale: "en-US", decimals: 2 },
      fn: (
        value: string,
        params?: { locale: string; decimals: string | number }
      ) => {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        const decimals =
          params?.decimals !== undefined ? Number(params.decimals) : undefined;
        return num.toLocaleString(params?.locale || undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      },
    },
    currency: {
      sampleParam: { currency: "USD", locale: "en-US" },
      fn: (value: string, params?: { currency: string; locale: string }) => {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        return num.toLocaleString(params?.locale || "en-US", {
          style: "currency",
          currency: params?.currency || "USD",
        });
      },
    },
    round: {
      sampleParam: { decimals: 2 },
      fn: (value: string, params?: { decimals: string | number }) => {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        const decimals = Number(params?.decimals ?? 0);
        return num.toFixed(decimals);
      },
    },
    abs: {
      sampleParam: undefined,
      fn: (value: string) => {
        const num = parseFloat(value);
        return isNaN(num) ? value : String(Math.abs(num));
      },
    },
    percentage: {
      sampleParam: { decimals: 0, multiply: false },
      fn: (
        value: string,
        params?: { decimals: string | number; multiply: string | boolean }
      ) => {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        const decimals = Number(params?.decimals ?? 0);
        const multiply =
          params?.multiply === true || params?.multiply === "true";
        const result = multiply ? num * 100 : num;
        return result.toFixed(decimals) + "%";
      },
    },
    add: {
      sampleParam: { value: 1 },
      fn: (value: string, params?: { value: string | number }) => {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        return String(num + Number(params?.value ?? 0));
      },
    },
    multiply: {
      sampleParam: { value: 2 },
      fn: (value: string, params?: { value: string | number }) => {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        return String(num * Number(params?.value ?? 1));
      },
    },
    padStart: {
      sampleParam: { length: 5, char: "0" },
      fn: (
        value: string,
        params?: { length: string | number; char: string }
      ) => {
        const length = Number(params?.length ?? 0);
        return value.padStart(length, params?.char ?? " ");
      },
    },
    padEnd: {
      sampleParam: { length: 5, char: " " },
      fn: (
        value: string,
        params?: { length: string | number; char: string }
      ) => {
        const length = Number(params?.length ?? 0);
        return value.padEnd(length, params?.char ?? " ");
      },
    },
    repeat: {
      sampleParam: { count: 3 },
      fn: (value: string, params?: { count: string | number }) => {
        const count = Math.max(0, Number(params?.count ?? 1));
        return value.repeat(count);
      },
    },
    reverse: {
      sampleParam: undefined,
      fn: (value: string) => value.split("").reverse().join(""),
    },
  };
