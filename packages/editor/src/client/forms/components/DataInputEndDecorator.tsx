import { wpLexicalTemplatePipeFunctions } from "_wp/lexical";
import DataObjectIcon from "@mui/icons-material/DataObject";
import { useDataFetchingDataInput } from "../../../lexical/nodes/data-fetching/client/DataFetchingDataInputContext";
import { BasicIconMenuButton } from "./BasicIconMenuButton";
import FunctionsIcon from "@mui/icons-material/Functions";

export const DataInputEndDecorator = (props: {
  onClick: (value: string, index?: number) => void;
  showPipeFunctions?: boolean;
}) => {
  const { onClick, showPipeFunctions = false } = props;
  const { dataKeys, widgetVariantKeys, paginationKeys } =
    useDataFetchingDataInput();

  const allItems = [
    ...widgetVariantKeys.map((key) => ({
      label: key, // Replace prefix for better readability
      value: key,
    })),
    ...paginationKeys.map((key) => ({
      label: key,
      value: key,
    })),
    ...dataKeys.map((key) => ({
      label: key,
      value: key,
    })),
  ];

  const pipeFunctionItems = showPipeFunctions
    ? Object.keys(wpLexicalTemplatePipeFunctions).map((key) => {
        const { sampleParam } = wpLexicalTemplatePipeFunctions[key];
        const hasParams = sampleParam && Object.keys(sampleParam).length > 0;
        const paramsStr = hasParams ? `:${JSON.stringify(sampleParam)}` : "";
        return {
          label: key,
          value: `|${key}${paramsStr}`,
        };
      })
    : [];

  if (allItems.length === 0) {
    return null;
  }

  return (
    <>
      <BasicIconMenuButton
        icon={<DataObjectIcon />}
        label="Insert Variable"
        slotProps={{ tooltip: { placement: "top" } }}
        items={allItems}
        onChange={(item) => {
          onClick(item);
        }}
        maxHeight={300}
      />
      {showPipeFunctions && pipeFunctionItems.length > 0 && (
        <BasicIconMenuButton
          icon={<FunctionsIcon />}
          label="Insert Pipe Function"
          slotProps={{ tooltip: { placement: "top" } }}
          items={pipeFunctionItems}
          onChange={(item) => {
            onClick(item);
          }}
          maxHeight={300}
        />
      )}
    </>
  );
};
