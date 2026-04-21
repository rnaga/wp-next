import { useEffect, useState } from "react";

import { SelectAutocomplete } from "@rnaga/wp-next-ui/SelectAutocomplete";

import { useEditorServerActions } from "../../hooks/use-editor-server-actions";

const NO_COLLECTION_VALUE = "none";

export const CollectionDropdown = (props: {
  onChange: (collectionId: number | undefined) => void;
  value?: number;
}) => {
  const { onChange, value } = props;
  const { actions, safeParse } = useEditorServerActions();
  const [collections, setCollections] = useState<
    { ID: number; post_title: string }[]
  >([]);

  useEffect(() => {
    actions.template
      .listCollection()
      .then(safeParse)
      .then((result) => {
        if (result.success && result.data) {
          setCollections(result.data as { ID: number; post_title: string }[]);
        }
      });
  }, []);

  const items = [
    { label: "General", value: NO_COLLECTION_VALUE },
    ...collections.map((c) => ({
      label: `${c.post_title}${c.ID ? ` (${c.ID})` : ""}`,
      value: c.ID,
    })),
  ];

  const currentValue = value == null ? NO_COLLECTION_VALUE : `${value}`;

  const handleChange = (val: string) => {
    if (val === NO_COLLECTION_VALUE || val === "") {
      onChange(undefined);
    } else {
      onChange(parseInt(val));
    }
  };

  return (
    <SelectAutocomplete
      size="medium"
      value={currentValue}
      items={items}
      onChange={handleChange}
      disableClearable={true}
    />
  );
};
