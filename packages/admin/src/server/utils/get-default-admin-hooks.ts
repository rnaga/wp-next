import { hooks } from "../wp-hooks";
import { getDefaultHooks } from "@rnaga/wp-next-core/server/utils/get-default-hooks";

export const getDefaultAdminHooks = () => [...getDefaultHooks(), ...hooks];
export default getDefaultAdminHooks;
