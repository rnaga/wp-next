"use server";
import { z } from "zod";

import * as actionsPost from "@rnaga/wp-next-core/server/actions/post";
import {
  createErrorResponsePayload,
  handleResponse,
} from "@rnaga/wp-next-core/server/actions/response";
import { logger } from "@rnaga/wp-next-core/server/utils/logger";
import { WP } from "@rnaga/wp-next-core/server/wp";
import { formatting } from "@rnaga/wp-node/common/formatting";

import { cssVariablesContentValidator } from "../../lexical/nodes/css-variables/css-variables-validator";
import { checkPermission } from "./check-permission";
import * as types from "../../types";
import {
  checkCSSVariableNameUniqueness,
  cssVariablesToString,
} from "../../lexical/styles/css-variables";

export const list = async (args?: Parameters<typeof actionsPost.list>[0]) => {
  const wp = await WP();
  const { data: cssVariables } = await actionsPost.list(
    {
      per_page: 100,
      ...args,
    },
    {
      postTypes: ["next-css-variables"],
    }
  );

  const data: types.CSSVariablesList = [];

  for (const item of cssVariables) {
    try {
      const json = cssVariablesContentValidator.parse(
        JSON.parse(item.post_content)
      );
      data.push({
        ID: item.ID,
        name: item.post_title,
        slug: item.post_name,
        content: json,
      });
    } catch (e) {
      logger.log( "Error parsing JSON", e, item.post_content);
    }
  }

  return handleResponse(wp, {
    data,
    info: undefined,
  });
};

export const get = async (id: number) => {
  const wp = await WP();
  const post = await wp.utils.post.get(id);

  if (!post.props || post.props.post_type !== "next-css-variables") {
    return createErrorResponsePayload("CSS Variables not found");
  }

  try {
    // Replace "" with \"" in the post_content
    const post_content = post.props.post_content.replace(/""/g, '\\""');

    const json = JSON.parse(post_content);

    const data: types.CSSVariables = {
      ID: post.props.ID,
      name: post.props.post_title,
      slug: post.props.post_name,
      content: json, // result.data[0].post_content as types.CSSVariables["content"],
    };

    return handleResponse(wp, { data, info: undefined });
  } catch (e) {
    logger.log( "Error parsing JSON", e, post.props.post_content);
    return createErrorResponsePayload("Error parsing JSON");
  }
};

const exists = async (slug: string, exclude?: number[]) => {
  const { data } = await actionsPost.list(
    {
      slug: [slug],
      ...(exclude ? { exclude } : {}),
    },
    {
      postTypes: ["next-css-variables"],
    }
  );
  return data.length > 0;
};

const cleanupContent = (
  cssVariables: z.infer<typeof cssVariablesContentValidator>
) => {
  let parsedCSSVariables: typeof cssVariables = [];

  for (const cssVariable of cssVariables) {
    let initialValue = cssVariable.initialValue;
    const syntax = cssVariable.syntax;
    if (
      (syntax === "string" || syntax === "universal") &&
      typeof initialValue === "string" &&
      /["']/g.test(initialValue)
    ) {
      // Remove quotes from initialValue
      // and wrap it with single quotes
      initialValue = initialValue.replace(/["']/g, "");
      initialValue = `'${initialValue}'`;
    }
    parsedCSSVariables.push({
      ...cssVariable,
      initialValue,
    });
  }

  return parsedCSSVariables as z.infer<typeof cssVariablesContentValidator>;
};

export const create = async (args: {
  name: string;
  content: z.infer<typeof cssVariablesContentValidator>;
}) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createErrorResponsePayload("Permission Error");
  }

  const { name, content } = args;

  const slug = formatting.slug(name);

  // Check if css variables already exists
  if (await exists(slug)) {
    return createErrorResponsePayload(
      "CSS variables with the same name already exists"
    );
  }

  const parsed = cssVariablesContentValidator.safeParse(content);
  if (!parsed.success) {
    return createErrorResponsePayload(
      `Invalid CSS variables content ${parsed.error.message}`
    );
  }

  // Check uniqueness
  const [isUnique, duplicates] = checkCSSVariableNameUniqueness(content);
  if (!isUnique) {
    return createErrorResponsePayload(
      `CSS variables content is not unique. Duplicates: ${duplicates.join(
        ", "
      )}`
    );
  }

  const result = await actionsPost.create({
    post_title: name,
    post_name: slug,
    post_type: "next-css-variables",
    post_content: JSON.stringify(cleanupContent(content)),
    post_status: "publish",
  });

  return handleResponse(wp, handleResponse(wp, result));
};

export const update = async (
  ID: number,
  name: string,
  content: z.infer<typeof cssVariablesContentValidator>
) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createErrorResponsePayload("Permission Error");
  }

  const parsed = cssVariablesContentValidator.safeParse(content);
  if (!parsed.success) {
    return createErrorResponsePayload(
      `Invalid CSS variables content ${parsed.error.message}`
    );
  }

  const slug = formatting.slug(name);

  if (0 == slug.length) {
    return createErrorResponsePayload("Invalid CSS variables name");
  }

  if (await exists(slug, [ID])) {
    return createErrorResponsePayload(
      "CSS variables with the same name already exists"
    );
  }

  // Check uniqueness
  const [isUnique, duplicates] = checkCSSVariableNameUniqueness(content);
  if (!isUnique) {
    return createErrorResponsePayload(
      `CSS variables content is not unique. Duplicates: ${duplicates.join(
        ", "
      )}`
    );
  }

  const result = await actionsPost.update(ID, {
    post_title: name,
    post_name: slug,
    post_content: JSON.stringify(cleanupContent(content)),
  });

  return handleResponse(wp, result);
};

export const del = async (ID: number) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createErrorResponsePayload("Permission Error");
  }

  const result = await actionsPost.del(ID);

  return handleResponse(wp, result);
};

export const getCSSString = async (ID: number) => {
  const wp = await WP();
  const post = await wp.utils.post.get(ID);

  if (!post.props || post.props.post_type !== "next-css-variables") {
    return createErrorResponsePayload("CSS Variables not found");
  }

  const slug = post.props.post_name;
  const content = JSON.parse(post.props.post_content);

  const parsed = cssVariablesContentValidator.safeParse(content);

  if (!parsed.success) {
    return createErrorResponsePayload(
      `Invalid CSS variables content ${parsed.error.message}`
    );
  }

  // Convert the content to CSS @property
  const cssString = cssVariablesToString({
    ID: post.props.ID,
    name: post.props.post_title,
    slug,
    content: parsed.data,
  });

  // const cssString = parsed.data
  //   .map((variables) => {
  //     // if type is not color, number, string, wrap with <>
  //     // if type is universal, convert it to *
  //     // if type is font, conver it to <string>
  //     // Note that above are based on the CSS spec
  //     // https://developer.mozilla.org/en-US/docs/Web/CSS/@property#syntax
  //     const syntax =
  //       variables.syntax === "universal"
  //         ? `"*"`
  //         : variables.syntax === "font"
  //         ? `"<string>"`
  //         : `"<${variables.syntax}>"`;

  //     const { inherit = true } = variables;
  //     let { initialValue } = variables;

  //     if (
  //       (syntax === `"<string>"` || syntax === `"*"`) &&
  //       typeof initialValue === "string" &&
  //       /[']/g.test(initialValue)
  //     ) {
  //       // Replace ' with "
  //       initialValue = initialValue.replace(/'/g, '"');
  //     }

  //     return `@property --${slug}-${variables.variableName} {
  //           syntax: ${syntax};
  //           inherits: ${inherit};
  //           initial-value: ${initialValue};
  //         }`;
  //   })
  //   .join("\n");

  return cssString;
};
