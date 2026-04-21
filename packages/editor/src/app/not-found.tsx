import WPError from "@rnaga/wp-next-editor/server/components/WPError";

// This 404 page is triggered for path belonged to error page slug such as "error", "error-not-found"
// When these slugs are passed, it throws notFound() which is caught by this component and renders the WPError component with NOT_FOUND status.
const fallback404 = (
  <div>
    <h2>404 - Page Not Found</h2>
    <p>The page you are looking for does not exist.</p>
  </div>
);

export default async function NotFound() {
  const { headers } = await import("next/headers");
  const xUrl = (await headers()).get("x-url") ?? "";
  // Sanity check: only render WPError for clean, slug-like paths.
  // Extract the first path segment from x-url, e.g. "/admin/3" => "admin".
  // Skip WPError if the segment starts with "." or contains special characters.
  let firstSegment = "";
  try {
    const pathname = new URL(xUrl).pathname;
    firstSegment = pathname.replace(/^\//, "").split("/")[0] ?? "";
  } catch {
    // URL parse failed — treat as invalid
  }

  try {
    return <WPError statusType="NOT_FOUND" error="Page Not Found" />;
  } catch (error) {
    return fallback404;
  }
}
