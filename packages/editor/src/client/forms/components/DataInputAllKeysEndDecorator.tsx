import DataObjectIcon from "@mui/icons-material/DataObject";
import { useDataFetchingDataInput } from "../../../lexical/nodes/data-fetching/client/DataFetchingDataInputContext";
import { BasicIconMenuButton } from "./BasicIconMenuButton";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useState } from "react";
import {
  getAllObjectKeys,
  getPaginationKeys,
} from "../../../lexical/nodes/data-fetching/data-fetching-validator-utils";

export const DataInputAllKeysEndDecorator = (props: {
  onClick: (value: string, index?: number) => void;
}) => {
  const { onClick } = props;
  const [editor] = useLexicalComposerContext();
  const [allDataKeys, setAllDataKeys] = useState<string[]>([]);
  useEffect(() => {
    const allDataKeys = [
      ...getPaginationKeys(editor),
      ...getAllObjectKeys(editor),
    ];
    setAllDataKeys(allDataKeys);
  }, []);

  if (0 >= allDataKeys.length) {
    return null;
  }

  return (
    <BasicIconMenuButton
      icon={<DataObjectIcon />}
      items={allDataKeys.map((key, index) => ({
        label: key,
        value: key,
      }))}
      onChange={(item) => {
        onClick(item);
      }}
      maxHeight={300}
    />
  );
};
