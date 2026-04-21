import { useMemo, useState } from "react";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Box, Divider } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useTemplate } from "../use-template";

export const ViewPageModal = (props: {
  open: boolean;
  onClose: () => void;
}) => {
  const { open, onClose } = props;
  const { current } = useTemplate();

  const template = current.template;
  const templateConfig = template?.template_config;

  const [pathValues, setPathValues] = useState<Record<number, string>>({});
  const [queryValues, setQueryValues] = useState<Record<string, string>>({});

  // Segments that have at least one configured item
  const pathSegments = useMemo(
    () => (templateConfig?.pathMapping ?? []).map((items, index) => ({ index, items })),
    [templateConfig]
  );

  // Query param entries
  const queryEntries = useMemo(
    () => Object.entries(templateConfig?.queryMapping ?? {}),
    [templateConfig]
  );

  const hasPathSection = pathSegments.length > 0;
  const hasQuerySection = queryEntries.length > 0;

  // Check if all required fields are filled
  const canOpen = useMemo(() => {
    for (const { index, items } of pathSegments) {
      if (items.some((item) => item.required) && !pathValues[index]) {
        return false;
      }
    }
    for (const [key, items] of queryEntries) {
      if (items.some((item) => item.required) && !queryValues[key]) {
        return false;
      }
    }
    return true;
  }, [pathSegments, queryEntries, pathValues, queryValues]);

  const buildUrl = () => {
    const slug = template?.post_name ?? "";

    // Build path: append segments in order, stop at first empty optional
    const segments: string[] = [];
    for (const { index, items } of pathSegments) {
      const val = pathValues[index] ?? "";
      if (!val) {
        // If required, it would fail canOpen check — so here it means optional and empty
        break;
      }
      segments.push(encodeURIComponent(val));
    }

    // Build query string from filled query values
    const params = new URLSearchParams();
    for (const [key] of queryEntries) {
      const val = queryValues[key];
      if (val) {
        params.set(key, val);
      }
    }

    const pathStr = segments.length > 0 ? `/${segments.join("/")}` : "";
    const queryStr = params.size > 0 ? `?${params.toString()}` : "";

    return `/${slug}${pathStr}${queryStr}`;
  };

  const handleOpen = () => {
    window.open(buildUrl(), "_blank");
  };

  // Reset form values when modal opens
  const handleClose = () => {
    setPathValues({});
    setQueryValues({});
    onClose();
  };

  // Label for a path segment: join names of items in that segment
  const getSegmentLabel = (items: NonNullable<typeof templateConfig>["pathMapping"][number]) => {
    const names = items.map((item) => item.name).filter(Boolean);
    return names.length === 1 ? names[0] : `[${names.join(", ")}]`;
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent sx={{ minWidth: "420px", maxWidth: "560px" }}>
        <Typography size="large" bold sx={{ mb: 2 }}>
          View Page
        </Typography>
        <Typography size="small" sx={{ color: "text.secondary", mb: 2 }}>
          Fill in the required values to build the page URL.{" "}
          <Typography
            component="span"
            size="small"
            sx={{ color: "error.main" }}
          >
            *
          </Typography>{" "}
          marks required fields.
        </Typography>

        {/* Path Mapping section */}
        {hasPathSection && (
          <Box sx={{ mb: hasQuerySection ? 2 : 0 }}>
            <Typography size="small" bold sx={{ mb: 1 }}>
              Path Parameters
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {pathSegments.map(({ index, items }) => {
                const isRequired = items.some((item) => item.required);
                const label = getSegmentLabel(items);
                return (
                  <Box
                    key={index}
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Typography
                      size="small"
                      sx={{ minWidth: "140px", color: "text.secondary" }}
                    >
                      /{label}
                      {isRequired && (
                        <Typography
                          component="span"
                          size="small"
                          sx={{ color: "error.main", ml: 0.25 }}
                        >
                          *
                        </Typography>
                      )}
                    </Typography>
                    <Input
                      size="medium"
                      value={pathValues[index] ?? ""}
                      onChange={(val) =>
                        setPathValues((prev) => ({ ...prev, [index]: val }))
                      }
                      placeholder={isRequired ? "Required" : "Optional"}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {hasPathSection && hasQuerySection && <Divider sx={{ my: 2 }} />}

        {/* Query Mapping section */}
        {hasQuerySection && (
          <Box>
            <Typography size="small" bold sx={{ mb: 1 }}>
              Query Parameters
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {queryEntries.map(([key, items]) => {
                const isRequired = items.some((item) => item.required);
                return (
                  <Box
                    key={key}
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Typography
                      size="small"
                      sx={{ minWidth: "140px", color: "text.secondary" }}
                    >
                      ?{key}=
                      {isRequired && (
                        <Typography
                          component="span"
                          size="small"
                          sx={{ color: "error.main", ml: 0.25 }}
                        >
                          *
                        </Typography>
                      )}
                    </Typography>
                    <Input
                      size="medium"
                      value={queryValues[key] ?? ""}
                      onChange={(val) =>
                        setQueryValues((prev) => ({ ...prev, [key]: val }))
                      }
                      placeholder={isRequired ? "Required" : "Optional"}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* URL preview */}
        {(hasPathSection || hasQuerySection) && (
          <Box
            sx={{
              mt: 2,
              p: 1,
              backgroundColor: "grey.50",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Typography
              size="small"
              sx={{ color: "text.secondary", wordBreak: "break-all" }}
            >
              {buildUrl()}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button
            size="medium"
            onClick={handleOpen}
            disabled={!canOpen}
            startIcon={<OpenInNewIcon />}
          >
            Open Page
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};
