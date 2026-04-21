"use server";

import {
  handleResponse,
  createResponsePayload,
} from "@rnaga/wp-next-core/server/actions/response";
import * as actionsTerm from "@rnaga/wp-next-core/server/actions/term";
import { WP } from "@rnaga/wp-next-core/server/wp";

import type * as wpTypes from "@rnaga/wp-node/types";
import { checkPermission } from "./check-permission";

// const checkPermission = async () => {
//   const wp = await WP();
//   const user = wp.current.user;
//   const role = await user?.role();

//   if (!role?.isAdmin() && !role?.is("editor") && !role?.isSuperAdmin()) {
//     return false;
//   }

//   return true;
// };

// Update terms (e.g. custom code ) associated with the template
export const update = async (
  templateId: number,
  objectTerms: (number | string)[], // custom code IDs / page slug alias
  taxonomy: wpTypes.TaxonomyName
) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Permission Error",
    });
  }

  const terms = objectTerms.map(String);
  const result = await actionsTerm.syncObject(templateId, terms, taxonomy);

  return handleResponse(wp, result);
};

// Append terms to the template
export const append = async (
  templateId: number,
  objectTerms: (number | string)[],
  taxonomy: wpTypes.TaxonomyName
) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Permission Error",
    });
  }

  const { data: terms } = await actionsTerm.list(
    taxonomy,
    {
      post: templateId,
      orderby: "term_order",
      order: "asc",
    },
    { context: "edit" }
  );

  const existingTermsIds = terms.map((term) => term.name);
  const newTerms = [...existingTermsIds, ...objectTerms.map(String)];
  const result = await actionsTerm.syncObject(templateId, newTerms, taxonomy);

  return handleResponse(wp, result);
};

export const del = async (
  objectTerm: number | string,
  taxonomy: wpTypes.TaxonomyName
) => {
  const wp = await WP();

  if (!(await checkPermission())) {
    return createResponsePayload({
      success: false,
      error: "Permission Error",
    });
  }

  // Get term by name (e.g. custom code ID)
  const terms = await wp.utils.query.terms((query) => {
    query
      .where("taxonomy", taxonomy)
      .where("name", `${objectTerm}`)
      .builder.limit(1);
  });

  // Check if there's no term associated with the term (e.g. custom code ID)
  if (!terms || terms.length === 0) {
    return handleResponse(wp, { data: true, info: undefined });
  }

  // Delete term associated with template
  const termId = terms[0].term_id;
  const resultDeleteTerm = await wp.utils.trx.term.remove(termId, taxonomy);

  if (!resultDeleteTerm) {
    return createResponsePayload({
      success: false,
      error: "Failed to delete term",
    });
  }

  return handleResponse(wp, { data: true, info: undefined });
};
