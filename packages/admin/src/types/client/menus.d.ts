export interface AdminPageSegmentMap {
  default: true;
  blog: true;
  site: true;
}

type AdminPageSegment<
  K extends keyof AdminPageSegmentMap = keyof AdminPageSegmentMap
> = AdminPageSegmentMap[K] extends true ? keyof AdminPageSegmentMap : never;

export type AdminMenu = AdminMenuComponent | AdminOnclick;

export interface AdminMenuComponent {
  icon?: React.ReactElement<any>;
  component: React.ReactNode;
  capabilities?: string[];
  capabilitiesInherit?: boolean;
  displayOnSidebar: boolean;
  label: string;
  path: string | string[];
  nested?: boolean;
  nestedMenus?: AdminMenu[];
  onClick?: never;
}

export interface AdminOnclick {
  icon?: React.ReactElement;
  component?: never;
  capabilities?: string[];
  capabilitiesInherit?: boolean;
  displayOnSidebar: true;
  label: string;
  path?: never;
  nested?: false;
  nestedMenus?: never;
  onClick: () => void;
}

export type AdminMenus = Map<keyof AdminPageSegment, AdminMenu[]>;
