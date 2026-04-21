export type EditorModeConfigResource = "css" | "dynamicAttributes";

export type EditorModeConfig = Record<
  EditorModeConfigResource,
  Record<string, string | number | boolean | undefined>
>;

type ClassName = string;

export type EditorModeConfigMap = Record<
  EditorModeConfigResource,
  // Where ClasName is the css class name from node.__css.getClassName(), and the value is the editor config for that node
  Record<ClassName, Record<string, string | number | boolean | undefined>>
>;
