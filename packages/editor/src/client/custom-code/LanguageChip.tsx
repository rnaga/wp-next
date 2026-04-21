import { Chip } from "@rnaga/wp-next-ui/Chip";

// Soft tinted badges: colored background at low opacity, black text (Chip default when no color prop).
// This matches common IDE/editor list patterns (VS Code, Linear, etc.) — unobtrusive but distinct.
export const LanguageChip = (props: { mineType: string }) => {
  const { mineType } = props;

  switch (mineType) {
    case "application/javascript":
      return (
        <Chip
          size="small"
          label="JS"
          sx={{ backgroundColor: "rgba(212, 178, 0, 0.15)" }}
        />
      );
    case "text/css":
      return (
        <Chip
          size="small"
          label="CSS"
          sx={{ backgroundColor: "rgba(240, 101, 41, 0.15)" }}
        />
      );
    case "text/html":
      return (
        <Chip
          size="small"
          label="HTML"
          sx={{ backgroundColor: "rgba(86, 61, 124, 0.15)" }}
        />
      );

    default:
      return null;
  }
};
