import { JSDOM } from "jsdom";

// https://github.com/facebook/lexical/blob/4074bc5ea4a0292a30b298286e26abe45967e45c/packages/lexical-headless/src/__tests__/unit/LexicalHeadlessEditor.test.ts#L189

// Install a single shared JSDOM shim once at module load time.
//
// Why this is safe:
// - Lexical headless mode stubs out setRootElement, so MutationObserver is
//   never instantiated in server paths.
// - The only bare `document` accesses that fire during headless use are in
//   $generateHtmlFromNodes (document.createElement / createDocumentFragment),
//   which are stateless — they produce throwaway DOM nodes, not shared state.
// - A single JSDOM instance for these operations carries no per-request data,
//   so concurrent requests cannot contaminate each other through it.
const jsdom = new JSDOM();

global.window = (global.window ?? jsdom.window) as Window & typeof globalThis;
global.document = global.document ?? jsdom.window.document;
global.MutationObserver =
  global.MutationObserver ?? jsdom.window.MutationObserver;

/** @deprecated Import "server/setup-dom" for the side effect only. The cleanup return value is no longer needed. */
export const setupDom = (): (() => void) => {
  return () => {};
};

// ---------------------------------------------------------------------------
// Write audit
// ---------------------------------------------------------------------------
// Call auditServerDom() once at each server entry point (e.g. WPPage, server
// actions) to detect any code that illegally writes request-scoped state onto
// the shared global window/document objects.
//
// Must be called explicitly — never applied automatically on import — so that
// unit tests that import setup-dom remain unaffected.
// ---------------------------------------------------------------------------

// Symbol used as a marker on global objects to detect if the write-trap proxy
// has already been installed. Using a well-known string key so it survives
// across module reloads (jest.isolateModules creates fresh module scope but
// shares the same global objects).
const AUDIT_MARKER = "__serverDomAuditInstalled__";

// Properties written by Next.js internals onto window — not request-scoped
// state, safe to allow through.
const NEXT_INTERNAL_PREFIXES = ["_nextjs", "__next", "_N_E"];

const isNextInternal = (prop: string | symbol): boolean => {
  if (typeof prop !== "string") return false;
  return NEXT_INTERNAL_PREFIXES.some((prefix) => prop.startsWith(prefix));
};

const makeWriteTrap = (label: string) => ({
  set(obj: object, prop: string | symbol, value: unknown): boolean {
    if (isNextInternal(prop)) {
      (obj as any)[prop] = value;
      return true;
    }
    throw new Error(
      `[setup-dom] Illegal write: ${label}.${String(prop)} = ${JSON.stringify(value)}\n` +
        `Writing request-scoped state onto a shared server global will corrupt concurrent requests.\n` +
        `Use a local variable or pass the value through function arguments instead.`
    );
  },
  defineProperty(
    obj: object,
    prop: string | symbol,
    descriptor: PropertyDescriptor
  ): boolean {
    if (isNextInternal(prop)) {
      Object.defineProperty(obj, prop, descriptor);
      return true;
    }
    throw new Error(
      `[setup-dom] Illegal defineProperty on ${label}.${String(prop)} on the server.`
    );
  },
});

export const auditServerDom = (): void => {
  // Guard against double-wrapping across module reloads by checking the
  // marker on the actual global object, not a module-level variable.
  if ((global as any)[AUDIT_MARKER]) return;
  (global as any)[AUDIT_MARKER] = true;

  global.window = new Proxy(global.window, makeWriteTrap("window")) as Window &
    typeof globalThis;

  global.document = new Proxy(
    global.document,
    makeWriteTrap("document")
  ) as Document;
};
