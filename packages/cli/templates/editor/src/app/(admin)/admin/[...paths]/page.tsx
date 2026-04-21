import { Page } from "@rnaga/wp-next-admin/server/components/Page";

import {
  WPEditor,
  isWPEditorAdminPageSegment,
} from "@rnaga/wp-next-editor/server/components/WPEditor";

// Quick way to access wp.json config in the app directory.
import wpJson from "_wp/config/wp.json";

// eslint-disable-next-line import/no-anonymous-default-export, react/display-name
export default async function AdminPage(props: {
  params: Promise<{ paths: string[] }>;
  searchParams?: Promise<
    {
      id: string;
    } & Record<string, string>
  >;
}) {
  const { params } = props;
  const isMultiSite = (wpJson as any)?.multisite?.enabled;

  const paramsPaths = (await params).paths;

  const segment = isMultiSite === true ? paramsPaths[1] : paramsPaths[0];

  if (isWPEditorAdminPageSegment(segment)) {
    return (
      <WPEditor
        segment={segment}
        params={props.params}
        searchParams={props.searchParams}
      />
    );
  }

  return <Page />;
}
