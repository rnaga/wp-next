import Link from "next/link";

import VisibilityIcon from "@mui/icons-material/Visibility";
import { Box } from "@mui/material";

import { isReservedSlug } from "../../../lexical/validate-slug";
import { useTemplate } from "../use-template";

const viewPageSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: 0.5,
  color: (theme: any) => theme.palette.grey[300],
  backgroundColor: "transparent",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 500,
  px: 1.5,
  py: "5px",
  textDecoration: "none",
  cursor: "pointer",
  transition: "background-color 0.15s, border-color 0.15s, color 0.15s",
  "&:hover": {
    backgroundColor: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: (theme: any) => theme.palette.grey[100],
  },
};

/**
 * Renders a "View Page" button in the editor header for published, non-widget-only templates.
 *
 * When the template config has any required pathMapping or queryMapping items,
 * clicking the button opens the ViewPageModal so the user can fill in the
 * required URL values before navigating (without them the public page returns 404).
 *
 * When there are no required items, the button acts as a direct link opening
 * the public page in a new tab.
 */
export const ViewPageButton = () => {
  const { current, openViewPageModal } = useTemplate();
  const { template } = current;

  if (
    template?.post_status !== "publish" ||
    template?.template_config?.useWidgetOnly === true
  ) {
    return null;
  }

  const templateConfig = template.template_config;
  const hasRequiredMappings =
    (templateConfig?.pathMapping ?? []).some((seg) =>
      seg.some((item) => item.required)
    ) ||
    Object.values(templateConfig?.queryMapping ?? {}).some((items) =>
      items.some((item) => item.required)
    );

  // When required mappings exist, open a modal for the user to fill them in.
  // Without required values in the URL, the public page would return 404.
  if (hasRequiredMappings) {
    return (
      <Box onClick={openViewPageModal} sx={viewPageSx}>
        <VisibilityIcon sx={{ fontSize: "16px" }} />
        View Page
      </Box>
    );
  }

  return (
    <Box
      component={Link}
      // Reserved slugs (e.g. "error-not-found") are not routable
      // via the public /[slug] path, so redirect to full-preview instead.
      href={
        isReservedSlug(template.post_name)
          ? `full-preview?slug=${template.post_name}`
          : `/${template.post_name}`
      }
      target="_blank"
      sx={viewPageSx}
    >
      <VisibilityIcon sx={{ fontSize: "16px" }} />
      View Page
    </Box>
  );
};
