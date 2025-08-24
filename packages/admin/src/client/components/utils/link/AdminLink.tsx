import queryString from "querystring";
import { MouseEvent, ReactNode } from "react";

import { useAdminNavigation } from "../../../hooks/use-admin-navigation";
import { useWPAdmin } from "../../../wp-admin";
import { Link } from "@rnaga/wp-next-ui/Link";

import type * as types from "../../../../types";
import { SxProps } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";

export type Props = (
  | {
      href?: string;
      blogId?: never;
      segment?: never;
      page?: never;
      subPage?: never;
      onClick?: never;
    }
  | {
      blogId?: number;
      segment?: keyof types.client.AdminPageSegmentMap;
      page?: string;
      subPage?: string;
      href?: never;
      onClick?: never;
    }
  | {
      segment?: never;
      blogId?: never;
      page?: never;
      subPage?: never;
      href?: never;
      onClick?: never;
    }
  | {
      onClick: (...args: any) => any;
      segment?: never;
      blogId?: never;
      page?: never;
      href?: never;
      subPage?: never;
    }
) & {
  queryParams?: queryString.ParsedUrlQueryInput;
  color?:
    | "primary"
    | "secondary"
    | "inherit"
    | "error"
    | "info"
    | "success"
    | "warning"; //| OverridableStringUnion<ColorPaletteProp, LinkPropsColorOverrides>;

  //OverridableStringUnion<ColorPaletteProp, LinkPropsColorOverrides>;
  sx?: SxProps;
  children: ReactNode | string;
  disabled?: boolean;
  slotSxProps?: {
    typography?: SxProps;
  };
  size?: "small" | "medium" | "large";
  bold?: boolean;
};

const LinkContent = (props: Props) => {
  const { children, color = "primary", size = "small", bold = true } = props;
  const { wpTheme } = useWPTheme();

  return (
    <Typography
      component="span"
      size={size}
      bold={bold}
      color={color}
      sx={{
        "&:hover": {
          backgroundColor: wpTheme.text.linkHoverColor,
        },
        ...props.slotSxProps?.typography,
      }}
    >
      {children}
    </Typography>
  );
};

export const AdminLink = (props: Props) => {
  const {
    queryParams,
    children,
    sx,
    color = "primary",
    disabled = false,
  } = props;

  const { site } = useWPAdmin();
  const { wpTheme } = useWPTheme();
  const { goto, currentPath, blogBasePath, basePath } = useAdminNavigation();

  if (disabled) {
    return children;
  }

  const handleClick = (path: string) => (e: MouseEvent) => {
    e.preventDefault();
    goto(path);
  };

  const appendQueryParams = (path: string): string => {
    return queryParams ? `${path}?${queryString.stringify(queryParams)}` : path;
  };

  if (props.href) {
    const href = appendQueryParams(props.href as string);
    return (
      <Link href={href} onClick={handleClick(href)} color={color}>
        <LinkContent {...props}>{children}</LinkContent>
      </Link>
    );
  }

  if (typeof props.onClick === "function") {
    return (
      <Link onClick={props.onClick} color={color}>
        <LinkContent {...props}>{children}</LinkContent>
      </Link>
    );
  }

  const blogBasePaths = blogBasePath.split("/");
  const paths = currentPath.split("/");
  const [, currentSegment, currentPage, currentSubPage] = paths;

  const blogId = props.blogId ?? blogBasePaths[blogBasePaths.length - 1];
  const segment = props.segment ?? currentSegment;
  const page = props.page ?? currentPage;
  const subPage = props.subPage ?? currentSubPage;

  let path: string;

  if (site.isMultiSite) {
    path = `${basePath}/${blogId}/${segment}/${page}`;
  } else {
    path = `${basePath}/${segment}/${page}`;
  }

  if (subPage) {
    path = `${path}/${subPage}`;
  }

  path = appendQueryParams(path as string);

  return (
    <Link
      href={path}
      onClick={handleClick(path as string)}
      color={color}
      sx={{
        ...sx,
      }}
    >
      <LinkContent {...props}>{children}</LinkContent>
    </Link>
  );
};
