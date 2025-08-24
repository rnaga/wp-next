"use client";
import { useEffect, useRef, useState } from "react";

import { Autocomplete, Chip, SxProps } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { flat as flatHierarchy } from "@rnaga/wp-node/common/hierarchy";
import type * as wpTypes from "@rnaga/wp-node/types";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

import { SelectAutocomplete, type SlotSxProps } from "./SelectAutocomplete";

const sxSelectAutocomplete = SelectAutocomplete.sx;
const SelectAutocompleteTextField = SelectAutocomplete.TextField;
const RenderOption = SelectAutocomplete.RenderOption;

type Option = {
  term_id: number;
  name: string;
  parent: number;
  depth?: number;
};

export const SelectWPTerms = (props: {
  taxonomy: wpCoreTypes.actions.Taxonomies[number]["name"];
  defaultValues?: number[];
  excludeIds?: number[];
  onChange: (values: Array<number | string>) => void;
  freeSolo?: boolean;
  slotSxProps?: SlotSxProps;
  size?: "small" | "medium";
  multiple?: boolean;
}) => {
  const {
    taxonomy,
    defaultValues = [],
    onChange,
    freeSolo = true,
    slotSxProps,
    excludeIds,
    size,
  } = props;
  const { actions, safeParse, parse } = useServerActions();

  const initialValues = useRef(defaultValues);

  const [terms, setTerms] = useState<(Option | string)[]>([]);
  const [defaultTerms, setDefaultTerms] = useState<Option[]>();

  useEffect(() => {
    const defaultTermIds = defaultValues.filter((id) => typeof id === "number");
    let defaultTerms: Option[] = [];
    (async () => {
      if (defaultTermIds.length > 0) {
        [defaultTerms] = await actions.term
          .list(taxonomy, { include: defaultTermIds })
          .then(parse);
        setDefaultTerms(defaultTerms);
      }

      const [terms] = await actions.term
        .list(taxonomy, {
          exclude: [defaultTermIds, ...(excludeIds || [])].flat(),
        })
        .then(parse);
      const termHierarchy = flatHierarchy("terms", [...terms, ...defaultTerms]);

      setTerms(termHierarchy);
    })();
  }, []);

  const handleSearch = (value: string) => {
    const termOptions = terms.filter(
      (term) => typeof term !== "string"
    ) as Option[];

    const termStrings = terms.filter(
      (term) => typeof term === "string"
    ) as string[];
    const termIds = termOptions.map((term) => term.term_id);

    actions.term
      .list(taxonomy, {
        search: value.length > 0 ? value : undefined,
        exclude: [termIds, ...(excludeIds || [])].flat(),
      })
      .then((response) => {
        const result = safeParse(response);
        if (!result.success) {
          return;
        }

        const termHierarchy = flatHierarchy("terms", [
          ...result.data,
          ...termOptions,
        ]);

        setTerms([...termHierarchy, ...termStrings]);
      });
  };

  const getTermLabel = (term: Option | string) =>
    typeof term === "string"
      ? term
      : `${Array(term.depth).fill("-").join("")} ${term.name}`;

  if (!terms || (initialValues.current.length > 0 && !defaultTerms)) {
    return <>Loading..</>;
  }

  return (
    <SelectAutocomplete.Wrapper size={size} slotSxProps={slotSxProps}>
      <Autocomplete
        key={`multiple-terms-${taxonomy}`}
        size="small"
        multiple
        limitTags={2}
        options={terms}
        defaultValue={defaultTerms}
        freeSolo={freeSolo}
        renderValue={(value, getItemProps) => {
          return value.map((option, index) => {
            const { key, ...props } = getItemProps({ index });
            const label = typeof option === "string" ? option : option.name;
            const chipKey =
              typeof option === "string" ? option : option.term_id;
            return (
              <Chip
                label={label}
                key={`${Math.random()}-${chipKey}`}
                {...props}
                sx={slotSxProps?.chip}
              />
            );
          });
        }}
        getOptionLabel={getTermLabel}
        isOptionEqualToValue={(term1, term2) =>
          typeof term1 !== "string" &&
          typeof term2 !== "string" &&
          term1?.term_id === term2?.term_id
        }
        onInputChange={(event, value, reason) => {
          reason === "input" && handleSearch(value);
        }}
        onChange={(event, value) => {
          onChange(value.map((v) => (typeof v === "string" ? v : v.term_id)));
        }}
        sx={sxSelectAutocomplete({
          size: size ?? "small",
          sx: { ...slotSxProps?.input, height: "auto" },
        })}
        renderInput={(params) => (
          <SelectAutocompleteTextField
            params={params}
            size={size}
            sx={slotSxProps?.textField}
          />
        )}
        renderOption={(props, option, state) => {
          const termId = typeof option === "string" ? option : option.term_id;

          return (
            <RenderOption
              key={termId}
              props={props}
              option={{
                label: getTermLabel(option),
                id: `${termId}`,
              }}
              state={state}
            />
          );
        }}
      />
    </SelectAutocomplete.Wrapper>
  );
};

const SelectMultipleTerms =
  // eslint-disable-next-line react/display-name


    (taxonomy: wpTypes.TaxonomyName) =>
    // eslint-disable-next-line react/display-name
    (props: {
      onChange: (value: (string | number)[]) => void;
      value: string | number[];
      size?: "small" | "medium";
      slotSxProps?: SlotSxProps;
      freeSolo?: boolean;
    }) => {
      return (
        <SelectWPTerms
          size={props.size}
          taxonomy={taxonomy}
          defaultValues={
            !props.value
              ? []
              : Array.isArray(props.value)
              ? (props.value as number[])
              : // If value is a string, split it by comma and convert to numbers
                (props.value
                  ?.split(",")
                  .map((v: any) => parseInt(v)) as number[])
          }
          onChange={(values) => {
            props.onChange(values);
            //props.onChange(values.join(","));
          }}
          freeSolo={props.freeSolo ?? false}
        />
      );
    };

export const SelectWPCategories = SelectMultipleTerms("category");
export const SelectWPTags = SelectMultipleTerms("post_tag");
