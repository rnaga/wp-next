import * as types from "../../../types";

import { SelectAutocomplete } from "@rnaga/wp-next-ui/SelectAutocomplete";

import { useTemplate } from "../use-template";
import { useEffect, useState } from "react";
import { TEMPLATE_POST_TYPE } from "../../../lexical/constants";

export const Dropdown = (props: {
  onChange: (template: types.Templates[number]) => any;
}) => {
  const { onChange } = props;
  const { templates, templateId } = useTemplate();
  const [templatesWithCollection, setTemplatesWithCollection] =
    useState<types.Templates>([]);

  // const { actions, parse } = useEditorServerActions();
  // const [templates, setTemplates] = useState<types.Templates>();

  const handleChange = async (value: string) => {
    if (!templatesWithCollection) {
      return;
    }

    const ID = parseInt(value as string);
    const selectedItem = templatesWithCollection.find((item) => item.ID === ID);

    setTemplatesWithCollection(templatesWithCollection);

    if (selectedItem) {
      onChange(selectedItem);
    }
  };

  useEffect(() => {
    if (!templates) {
      setTemplatesWithCollection([]);
      return;
    }

    const result: types.Templates = [];
    for (const item of templates) {
      if (item.post_type === TEMPLATE_POST_TYPE) {
        result.push(item);
      } else if (item.isCollection && item.children) {
        result.push(...item.children);
      }
    }
    // Sort by ID descending so the newest templates appear first
    result.sort((a, b) => b.ID - a.ID);
    setTemplatesWithCollection(result);
  }, [templates]);

  if (!templates || templates.length === 0) {
    return <>Loading..</>;
  }

  return (
    <SelectAutocomplete
      size="medium"
      value={templateId ? `${templateId}` : undefined}
      items={templatesWithCollection.reduce(
        (acc, item) => {
          acc.push({
            label: `${item.post_title} ${item.ID ? `(${item.ID})` : ""}`,
            value: item.ID,
          });
          return acc;
        },
        [] as { label: string; value: number }[]
      )}
      onChange={handleChange}
      disableClearable={true}
    />
  );
};
