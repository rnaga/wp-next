import { createContext } from "react";

export const FormDataContext = createContext<Map<string, any>>({} as any);

export const FormDataProvider = (props: { children: React.ReactNode }) => {
  return <FormDataContext value={new Map()}>{props.children}</FormDataContext>;
};
