import { z } from "zod";
import { TEMPLATE_ERROR_STATUS_TYPES } from "../../constants";

export const errorDataFetchingValidator = z.object({
  error_type: z.enum(TEMPLATE_ERROR_STATUS_TYPES),
  error_message: z.string().default("error"),
});
