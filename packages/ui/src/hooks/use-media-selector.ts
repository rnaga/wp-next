import { useWP } from "@rnaga/wp-next-core/client/wp";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

type OnSelected = NonNullable<
  NonNullable<
    wpCoreTypes.client.GlobalState["media-selector-modal"]
  >["onSelected"]
>;

export const useMediaSelector = () => {
  const { globalState } = useWP();
  const selector = globalState.get("media-selector-modal");

  const open = (...args: [OnSelected] | [string[], OnSelected]) => {
    const onSelected = args.length === 1 ? args[0] : args[1];
    const mimeTypes = args.length === 1 ? undefined : args[0];

    globalState.set({
      "media-selector-modal": {
        open: true,
        onSelected,
        mimeTypes,
      },
    });
  };
  const close = () => {
    globalState.set({
      "media-selector-modal": {
        open: false,
        onSelected: undefined,
      },
    });
  };

  const select = (post: wpCoreTypes.actions.Posts[number]) => {
    selector?.onSelected && selector.onSelected(post);
  };

  return {
    open,
    close,
    select,
    isOpen: selector?.open ?? false,
  };
};
