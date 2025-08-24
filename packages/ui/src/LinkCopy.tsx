import { useState } from "react";

import { Link } from "./Link";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Typography } from "./Typography";

export const LinkCopy = (props: {
  link: string;
  showIcon: boolean;
  size?: "small" | "medium" | "large";
}) => {
  const { link, showIcon = true, size = "small" } = props;
  const [copied, setCopied] = useState(false);

  return copied ? (
    showIcon ? (
      <CheckIcon fontSize={size} />
    ) : (
      <Typography size={size} color="success">
        Copied
      </Typography>
    )
  ) : (
    <>
      <Link
        fontSize={size}
        onClick={() => {
          navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 1000);
        }}
      >
        {showIcon ? <ContentCopyIcon /> : "Copy URL"}
      </Link>
    </>
  );
};
