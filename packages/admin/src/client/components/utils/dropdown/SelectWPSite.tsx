import { Select } from "@rnaga/wp-next-ui/Select";
import { useAdminNavigation } from "../../../hooks/use-admin-navigation";
import { useSites } from "../../../hooks/use-sites";
import { useWPAdmin } from "../../../wp-admin";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const SelectWPSite = (props: {
  size?: "small" | "medium";
  onChange: (siteId: number, sitename: string) => any;
}) => {
  const { size, onChange } = props;
  const { site } = useWPAdmin();
  const { queryObject } =
    useAdminNavigation<wpCoreTypes.actions.SearchQuery<"blog">>();
  const { sites: availableSites } = useSites({
    capabilities: ["edit_user_roles"],
  });

  const siteId = queryObject?.site?.[0] ?? site.siteId;

  if (!site.isMultiSite || !availableSites.sites) {
    return null;
  }

  return (
    <Select
      size={size}
      enum={availableSites.sites.map((site) => ({
        value: site.site_id,
        label: site.sitename,
      }))}
      value={siteId}
      onChange={(value) => {
        const siteId = parseInt(value as string);
        const site = availableSites.sites!.find((s) => s.site_id === siteId);
        if (site) {
          onChange(site.site_id, site.sitename);
        }
      }}
    />
  );
};
