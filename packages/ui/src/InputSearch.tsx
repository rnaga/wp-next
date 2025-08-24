import { useRef } from "react";

import SearchIcon from "@mui/icons-material/Search";
import { SxProps } from "@mui/material";
import { useNavigation } from "@rnaga/wp-next-core/client/hooks/use-navigation";

import { Input } from "./Input";

export const InputSearch = (props: {
  size?: "small" | "medium" | "large";
  sx?: SxProps | undefined;
  onChange?: (value: string, e?: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const { size = "small" } = props;
  const { queryObject, updateRouter } = useNavigation();
  const ref = useRef<HTMLInputElement | null>(null);

  const handleClear = () => {
    updateRouter({ search: "" });
    ref.current.value = "";
  };

  const handleChange = (
    value: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (props.onChange) {
      props.onChange(value, e);
      return;
    }
    updateRouter({ search: value, page: 1 });
  };

  return (
    <Input
      ref={ref}
      size={size}
      placeholder="Search"
      startAdornment={
        <SearchIcon
          sx={{
            opacity: 0.5,
          }}
        />
      }
      value={queryObject?.search}
      slotProps={{
        input: {
          // TypeScript may require this to avoid type errors
        },
      }}
      clearable
      sx={props.sx ?? {}}
      onChange={(value, e) => handleChange(value, e)}
      onClear={handleClear}
    />
  );
};
