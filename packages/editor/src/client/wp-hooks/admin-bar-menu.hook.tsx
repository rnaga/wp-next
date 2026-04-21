import { filter as clientFilter } from "@rnaga/wp-next-core/decorators";
import { hook } from "@rnaga/wp-node/decorators/hooks";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { IconButton } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Viewport } from "@rnaga/wp-next-ui/Viewport";

type EditorLinkBarMenuProps = Parameters<
  wpCoreTypes.hooks.Filters["next_admin_bar_menu"]
>[1];

const EditorLinkBarMenu = ({
  navigation,
  wpRawTheme,
}: EditorLinkBarMenuProps) => {
  const handleClick = () => {
    navigation.goto(`${navigation.blogBasePath}/editor`);
  };

  return (
    <Viewport device="desktop">
      <IconButton
        onClick={handleClick}
        sx={{
          border: 0,
          gap: 1,
          color: wpRawTheme.global.colorScale[100],
          borderRadius: 1,
          "&:hover": {
            color: wpRawTheme.global.colorScale[800],
            backgroundColor: wpRawTheme.global.colorScale[300],
            borderRadius: 1,
          },
        }}
      >
        <EditNoteIcon />
        <Typography bold sx={{ color: "inherit" }}>
          Editor
        </Typography>
      </IconButton>
    </Viewport>
  );
};

@hook("admin-bar-menus")
export class AdminBarMenusHook {
  @clientFilter("next_admin_bar_menu")
  hookFilter(
    ...args: Parameters<wpCoreTypes.hooks.Filters["next_admin_bar_menu"]>
  ) {
    const [adminBarMenus, { wpAdmin, navigation, wpRawTheme }] = args;

    const { site } = wpAdmin;

    // Check if the admin is single site, or default site of multisite. If not, do not show the link
    if (site.isMultiSite && site.blogId !== 1) {
      return adminBarMenus;
    }

    adminBarMenus.push({
      component: (
        <EditorLinkBarMenu
          navigation={navigation}
          wpAdmin={wpAdmin}
          wpRawTheme={wpRawTheme}
        />
      ),
      roles: ["administrator"],
    });

    return adminBarMenus;
  }
}
