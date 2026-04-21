import { Select } from "@rnaga/wp-next-ui/Select";

export type ValueGlobal =
  | "inherit"
  | "initial"
  | "unset"
  | "revert"
  | "revert-layer";

export const SelectGlobal = (props: {
  value?: string;
  onChange: (value: string | undefined) => void;
}) => {
  const { value, onChange } = props;
  return (
    <Select
      enum={[
        { value: "inherit", label: "Inherit" },
        { value: "initial", label: "Initial" },
        { value: "unset", label: "Unset" },
        { value: "revert", label: "Revert" },
        { value: "revert-layer", label: "Revert Layer" },
      ]}
      value={`${value ?? ""}`}
      onChange={onChange}
    />
  );
};
