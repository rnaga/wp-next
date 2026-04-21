import { useState } from "react";
import { useGoogleFontsLoader } from "../../../lexical/nodes/font/client/use-google-fonts-loader";
import { Autocomplete, SxProps, TextField } from "@mui/material";

import { SelectAutocomplete } from "@rnaga/wp-next-ui/SelectAutocomplete";

export const SelectGoogleFont = (props: {
  onChange: (fontFamily: string) => void;
  value?: string;
  sx?: SxProps;
  slotProps?: Parameters<typeof Autocomplete>[0]["slotProps"];
  size?: "small" | "medium";
}) => {
  const { onChange, value, sx, slotProps, size } = props;
  const { fontFamilyList } = useGoogleFontsLoader();
  const [displayFonts, setDisplayFonts] = useState(fontFamilyList.slice(0, 50));

  const handleScroll = (event: React.UIEvent<HTMLElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setDisplayFonts((prev) => fontFamilyList.slice(0, prev.length + 50));
    }
  };

  return (
    <SelectAutocomplete
      size={size}
      onChange={onChange}
      value={value}
      items={displayFonts.map((font) => ({
        label: font,
        value: font,
      }))}
      slotProps={{
        ...((slotProps ?? {}) as any),
        listbox: {
          onScroll: handleScroll,
        },
      }}
      disableClearable
    />
  );
};
