import {
  TEMPLATE_SLUG_HOMEPAGE,
  TEMPLATE_SLUGS_ERROR,
  TEMPLATE_SLUGS_FORBIDDEN,
  TEMPLATE_SLUGS_RESERVED,
} from "./constants";

// Validates that a page slug contains only lowercase letters, numbers,
// hyphens, underscores, or dots. The first character must be a lowercase
// letter or number (not -, _, or .).
export const isValidPageSlug = (slug?: string | number): boolean => {
  if (!slug || typeof slug !== "string") {
    return false;
  }
  return /^[a-z0-9][a-z0-9_.-]*$/.test(slug);
};

export const isValidPublicSlug = (slug?: string | number): boolean => {
  if (!isValidPageSlug(slug)) {
    return false;
  }

  return TEMPLATE_SLUGS_RESERVED.includes(slug as string) ||
    TEMPLATE_SLUGS_FORBIDDEN.includes(slug as string)
    ? false
    : true;
};

export const isReservedSlug = (slug?: string | number): boolean => {
  if (!slug || typeof slug !== "string") {
    return false;
  }

  return TEMPLATE_SLUGS_RESERVED.includes(slug);
};

export const isErrorSlug = (slug?: string | number): boolean => {
  if (!slug || typeof slug !== "string") {
    return false;
  }

  return TEMPLATE_SLUGS_ERROR.includes(slug);
};

export const isHomepageSlug = (slug?: string | number): boolean => {
  if (!slug || typeof slug !== "string") {
    return false;
  }

  return slug === TEMPLATE_SLUG_HOMEPAGE;
};
