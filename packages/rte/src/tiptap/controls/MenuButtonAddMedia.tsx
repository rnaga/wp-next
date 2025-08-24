import { useRichTextEditorContext } from "mui-tiptap";
import { MenuButton, type MenuButtonProps } from "mui-tiptap";
import PermMediaIcon from "@mui/icons-material/PermMedia";
import { useMediaSelector } from "@rnaga/wp-next-ui/hooks/use-media-selector";

export type MenuButtonAddMediaProps = Partial<MenuButtonProps>;

export function MenuButtonAddMedia(props: MenuButtonAddMediaProps) {
  const editor = useRichTextEditorContext();
  const mediaSelector = useMediaSelector();

  return (
    <MenuButton
      tooltipLabel="Insert media"
      IconComponent={PermMediaIcon}
      disabled={!editor?.isEditable || !editor.can().insertTable()}
      onClick={() => {
        // Currently only supports images
        mediaSelector.open(["image"], (post) => {
          const guid = post?.guid;
          if (!guid) return;
          editor?.chain().focus().insertContent(`<img src="${guid}"  />`).run();
        });
      }}
      {...props}
    />
  );
}
