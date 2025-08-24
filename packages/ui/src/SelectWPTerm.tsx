import { useEffect, useState } from "react";

import { Autocomplete, AutocompleteValue } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";

import type * as wpTypes from "@rnaga/wp-node/types";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { Typography } from "./Typography";

import { SelectAutocomplete, type SlotSxProps } from "./SelectAutocomplete";

const sxSelectAutocomplete = SelectAutocomplete.sx;
const SelectAutocompleteTextField = SelectAutocomplete.TextField;
const RenderOption = SelectAutocomplete.RenderOption;

type FreeSolo = true | false;

type Value = Pick<wpCoreTypes.actions.Terms[number], "term_id" | "name">;

export const SelectWPTerm = <T extends FreeSolo = false>(props: {
  taxonomy: wpCoreTypes.actions.Taxonomies[number]["name"];
  onChange: (term: Value) => any;
  defaultValue?: number;
  size?: "small" | "medium";
  slotSxProps?: SlotSxProps;
}) => {
  const { taxonomy, onChange, defaultValue, slotSxProps, size } = props;
  const { actions, parse, safeParse } = useServerActions();

  const [terms, setTerms] = useState<Value[]>();
  const [currentTerm, setCurrentTerm] = useState<Value>();

  useEffect(() => {
    (async () => {
      let currentTerm: wpCoreTypes.actions.Terms[number] | undefined;

      if (defaultValue) {
        [currentTerm] = ((await actions.term
          .list(taxonomy, { include: [defaultValue], per_page: 1 })
          .then(parse)) ?? [])[0];

        setCurrentTerm(currentTerm);
      }

      const [terms] = await actions.term
        .list(taxonomy, {
          exclude: defaultValue ? [defaultValue] : undefined,
        })
        .then(parse);

      setTerms(currentTerm ? [...terms, currentTerm] : terms);
    })();
  }, []);

  const handleSearch = async (value: string) => {
    const response = await actions.term
      .list(taxonomy, {
        search: value,
      })
      .then(safeParse);

    if (!response.success) {
      return;
    }
    setTerms(response.data);
  };

  const areTermsEqual = (a: Value, b: Value) => {
    return a.term_id === b.term_id;
  };

  const getTermKey = (term: Value) => `${Math.random()}-${term.term_id}`;

  if (!terms || (defaultValue && !currentTerm)) {
    return <Typography>Loading..</Typography>;
  }

  let value: Value = currentTerm;
  if (!currentTerm) {
    value = {
      term_id: 0,
      name: "",
    } as Value;
  }

  console.log("SelectWPTerm value", value, defaultValue);

  return (
    <SelectAutocomplete.Wrapper size={size} slotSxProps={slotSxProps}>
      <Autocomplete
        key={`post-${defaultValue ?? 0}`}
        size="small"
        disableClearable
        value={value as AutocompleteValue<Value, T, true, false | T>}
        onChange={(e, v) => {
          const term = v as Value;
          console.log("onChange", v);
          setCurrentTerm(term);
          onChange(term);
        }}
        onInputChange={(event, value, reason) => {
          if (typeof value === "string") {
            const newValue = {
              term_id: 0,
              name: value,
            } as Value;
            onChange(newValue);
            setCurrentTerm(newValue);
          }
          if (reason === "input") {
            handleSearch(value);
          }
        }}
        getOptionKey={getTermKey}
        getOptionLabel={(option) => {
          if (typeof option === "string") {
            return option;
          }

          return typeof option !== "string" ? option.name : "";
        }}
        // getOptionLabel={(option) => option.name}
        isOptionEqualToValue={areTermsEqual}
        options={[...terms]}
        renderInput={(params) => (
          <SelectAutocompleteTextField
            params={params}
            size={size}
            sx={slotSxProps?.textField}
          />
        )}
        sx={sxSelectAutocomplete({
          size: size ?? "small",
          sx: slotSxProps?.input,
        })}
        renderOption={(props, option, state) => {
          const termId = option.term_id;
          return (
            <RenderOption
              key={termId}
              props={props}
              option={{
                label: option.name,
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

// export const SelectFreeSoloWPPost = (
//   props: Parameters<typeof SelectWPPost<true>>[0]
// ) => {
//   const { freeSolo, ...rest } = props;
//   return <SelectWPPost {...rest} freeSolo={true} />;
// };
