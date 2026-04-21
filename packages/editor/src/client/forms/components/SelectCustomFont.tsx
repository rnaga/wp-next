import { useEffect, useState, useTransition } from "react";

import { Autocomplete, SxProps, TextField } from "@mui/material";

import { useEditorServerActions } from "../../hooks/use-editor-server-actions";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

import { SelectAutocomplete } from "@rnaga/wp-next-ui/SelectAutocomplete";
import { Typography } from "@rnaga/wp-next-ui/Typography";

export const SelectCustomFont = (props: {
  onChange: (fontNamily: string, slug: string) => void;
  value?: string;
  sx?: SxProps;
  slotProps?: Parameters<typeof Autocomplete>[0]["slotProps"];
  size?: "small" | "medium";
}) => {
  const { onChange, value, sx, slotProps, size } = props;
  const [loading, startTransition] = useTransition();

  const [fontFamilies, setFontFamilies] = useState<wpCoreTypes.actions.Posts>(
    []
  );
  const { actions, parse } = useEditorServerActions();

  useEffect(() => {
    startTransition(async () => {
      const [fonts] = await actions.font
        .list({
          per_page: 100,
        })
        .then(parse);

      setFontFamilies(fonts);
    });
  }, []);

  return (
    <>
      {fontFamilies.length === 0 && !loading ? (
        <Typography color="warning" size={size}>
          No custom fonts found.
        </Typography>
      ) : (
        <SelectAutocomplete
          size={size}
          onChange={(value, item) => {
            onChange(item.label, `${item.value}`);
          }}
          value={value}
          items={fontFamilies.map((font) => ({
            label: font.post_title,
            value: font.post_name,
          }))}
          disableClearable
        />
      )}{" "}
    </>
  );

  // return (
  //   <>
  //     {fontFamilies.length === 0 && !loading ? (
  //       <Typography variant="body2" color="warning">
  //         No custom fonts found.
  //       </Typography>
  //     ) : (
  //       <Autocomplete
  //         loading={loading}
  //         size="small"
  //         options={fontFamilies.map((font) => ({
  //           label: font.post_title,
  //           value: font.post_name,
  //         }))}
  //         noOptionsText="No custom fonts found."
  //         slotProps={{
  //           ...((slotProps ?? {}) as any),
  //         }}
  //         disableClearable
  //         freeSolo
  //         renderInput={(params) => <TextField {...params} />}
  //         value={value ?? ""}
  //         onChange={(e, v) => {
  //           typeof v === "string" ? onChange(v, v) : onChange(v.label, v.value);
  //         }}
  //         sx={sx}
  //       />
  //     )}
  //   </>
  // );
};
