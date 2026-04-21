// Works in browsers that support CompressionStream + in Node 18+
// (gzip/deflate/deflate-raw; brotli support depends on Node version)
const hasCompressionStreams =
  typeof CompressionStream !== "undefined" &&
  typeof DecompressionStream !== "undefined";

const toArrayBufferBackedBytes = (
  data: Uint8Array<ArrayBufferLike>
): Uint8Array<ArrayBuffer> => {
  // CompressionStream typings expect ArrayBuffer-backed views.
  if (data.buffer instanceof ArrayBuffer) {
    return data as Uint8Array<ArrayBuffer>;
  }
  return Uint8Array.from(data);
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  const globalBuffer = (
    globalThis as typeof globalThis & {
      Buffer?: {
        from: (input: Uint8Array) => {
          toString: (encoding: "base64") => string;
        };
      };
    }
  ).Buffer;

  if (globalBuffer) {
    return globalBuffer.from(bytes).toString("base64");
  }

  if (typeof btoa === "undefined") {
    throw new Error("Base64 encoding not supported");
  }

  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

const base64ToBytes = (base64: string): Uint8Array => {
  const globalBuffer = (
    globalThis as typeof globalThis & {
      Buffer?: {
        from: (input: string, encoding: "base64") => Uint8Array;
      };
    }
  ).Buffer;

  if (globalBuffer) {
    return Uint8Array.from(globalBuffer.from(base64, "base64"));
  }

  if (typeof atob === "undefined") {
    throw new Error("Base64 decoding not supported");
  }

  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
};

const readAll = async (
  readable: ReadableStream<Uint8Array>
): Promise<Uint8Array> => {
  const reader = readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    total += value.length;
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
};

const transformBytes = async (
  data: Uint8Array,
  streamFactory: () => CompressionStream | DecompressionStream
): Promise<Uint8Array> => {
  const input = toArrayBufferBackedBytes(data);
  const source = new ReadableStream<BufferSource>({
    start(controller) {
      controller.enqueue(input);
      controller.close();
    },
  });

  return readAll(source.pipeThrough(streamFactory()));
};

export const gzipBytes = async (data: Uint8Array): Promise<Uint8Array> => {
  if (!hasCompressionStreams)
    throw new Error("CompressionStream not supported");
  return transformBytes(data, () => new CompressionStream("gzip"));
};

export const gunzipBytes = async (data: Uint8Array): Promise<Uint8Array> => {
  if (!hasCompressionStreams)
    throw new Error("DecompressionStream not supported");
  return transformBytes(data, () => new DecompressionStream("gzip"));
};

// Convenience for strings:
export const gzipString = async (s: string): Promise<string> => {
  const compressed = await gzipBytes(new TextEncoder().encode(s));
  return bytesToBase64(compressed);
};

export const gunzipToString = async (base64: string): Promise<string> => {
  const raw = await gunzipBytes(base64ToBytes(base64));
  return new TextDecoder().decode(raw);
};

export const gzipJSON = async (value: unknown): Promise<string | undefined> => {
  try {
    const json = JSON.stringify(value);
    if (typeof json !== "string") {
      return undefined;
    }
    return await gzipString(json);
  } catch {
    return undefined;
  }
};

export const gunzipToJSON = async <T = unknown>(
  base64: string
): Promise<T | undefined> => {
  try {
    const json = await gunzipToString(base64);
    return JSON.parse(json) as T;
  } catch {
    return undefined;
  }
};
