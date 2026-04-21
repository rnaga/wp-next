import { z } from "zod";
import * as vals from "../validators";

// URL query cache data structure: { [dataName: string]: { [key: string]: any } }
export type URLQueryCacheData = z.infer<typeof vals.url.urlQueryCacheData>;
