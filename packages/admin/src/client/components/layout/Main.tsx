import { useCurrentMenu } from "../../hooks/use-current-menu";
import { useWPAdmin } from "../../wp-admin";

export const Main = () => {
  const {
    wp: { error },
  } = useWPAdmin();
  const menu = useCurrentMenu();

  if (error.message) {
    const errorMessage = error.message;
    throw new Error(errorMessage);
  }

  const component = menu && menu[0] ? menu[0].component : null;

  return component;
};
