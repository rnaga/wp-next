import { useColorScheme as useMaterialColorScheme } from "@mui/material/styles";

export const useSchemeToggle = () => {
  const { mode: muiMode, setMode: setMaterialMode } = useMaterialColorScheme();

  const toggle = () => {
    if (muiMode === "light") {
      setMaterialMode("dark");
    } else {
      setMaterialMode("light");
    }
  };

  const updateMode = (value: "light" | "dark") => {
    setMaterialMode(value);
  };

  return { mode: muiMode, toggle, updateMode };
};
