import { useEffect, useState } from "react";

import { Autocomplete, ListItem } from "@mui/material";
import { SelectAutocomplete } from "@rnaga/wp-next-ui/SelectAutocomplete";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useEditorServerActions } from "../../hooks/use-editor-server-actions";

import type * as types from "../../../types";

const sxSelectAutocomplete = SelectAutocomplete.sx;
const SelectAutocompleteTextField = SelectAutocomplete.TextField;

type TemplateItem = { label: string; id: string };

const toItems = (
  templates: types.Templates,
  excludeSlugs?: string[]
): TemplateItem[] =>
  templates
    .filter((t) => !excludeSlugs?.includes(t.post_name))
    .map((t) => ({
      label: `${t.post_title}${t.ID ? ` (${t.ID})` : ""}`,
      id: `${t.ID}`,
    }));

export const SelectTemplate = (props: {
  onChange: (value: any) => void;
  size?: "small" | "medium";
  value?: any;
  excludeSlugs?: string[];
}) => {
  const { actions, parse } = useEditorServerActions();
  const [allItems, setAllItems] = useState<TemplateItem[]>();
  const [currentItem, setCurrentItem] = useState<TemplateItem | undefined>(
    undefined
  );

  useEffect(() => {
    actions.template
      .list({ perPage: 999, checkParent: false })
      .then(parse)
      .then(([templates]) => {
        setAllItems(toItems(templates, props.excludeSlugs));
      });
  }, []);

  useEffect(() => {
    if (!props.value || !allItems) return;
    const found = allItems.find((item) => item.id === `${props.value}`);
    if (found) setCurrentItem(found);
  }, [props.value, allItems]);

  if (!allItems) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <SelectAutocomplete.Wrapper size={props.size}>
      <Autocomplete
        size="small"
        value={currentItem ?? null}
        options={allItems}
        filterOptions={(options, { inputValue }) => {
          const lower = inputValue.toLowerCase();
          return options.filter((o) => o.label.toLowerCase().includes(lower));
        }}
        getOptionLabel={(option) =>
          typeof option === "string" ? option : option.label
        }
        isOptionEqualToValue={(a, b) => a.id === b.id}
        onChange={(_, option) => {
          if (!option || typeof option === "string") return;
          setCurrentItem(option);
          props.onChange(parseInt(option.id));
        }}
        renderInput={(params) => (
          <SelectAutocompleteTextField params={params} size={props.size} />
        )}
        sx={sxSelectAutocomplete({ size: props.size ?? "medium" })}
        renderOption={(renderProps, option) => (
          <ListItem {...renderProps} key={option.id}>
            <Typography size={props.size}>{option.label}</Typography>
          </ListItem>
        )}
      />
    </SelectAutocomplete.Wrapper>
  );
};
