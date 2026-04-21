import {
  createContext,
  RefObject,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import ListIcon from "@mui/icons-material/List";
import {
  Box,
  CircularProgress,
  IconButton,
  SxProps,
  Tooltip,
} from "@mui/material";
import { BadgeOnMouseOver } from "@rnaga/wp-next-ui/BadgeOnMouseOver";

import { cssVariableUsageKeyType } from "../../../lexical/nodes/css-variables/CSSVariablesNode";
import * as types from "../../../types";
import {
  CSSVariablesItemContext,
  useCSSVariablesItem,
} from "../../css-variables/CSSVariablesItemContext";
import { DraggableBoxCSSVariables } from "../../css-variables/DraggableBoxCSSVariables";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { LoadingBox } from "@rnaga/wp-next-ui/LoadingBox"; // import LoadingBox component
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getAllCacheData } from "../../../lexical/nodes/cache/CacheNode";

// import Loading icon

type SlotSxProps = {
  typography?: SxProps;
  valueBox?: SxProps;
  iconBox?: SxProps;
};

const Context = createContext<{
  open: "list" | "edit" | false;
  handleOpen: <T extends "list" | "edit" | false>(
    type: T,
    options?: {
      variableCollectionID?: T extends "edit" ? number : undefined;
      variableIndex?: T extends "edit" ? number : never;
      arrayIndex?: T extends "edit" ? number : never;
    }
  ) => void;

  sx?: SxProps;
  targetRef?: RefObject<HTMLElement | null>;
  selectedVariableIndex?: number;
  targetSyntax: types.CSSVariableContentSyntax[];
  size: "small" | "medium";
  slotSxProps?: SlotSxProps;
}>({} as any);

const SingleValue = () => {
  const { deleteUsage, contentItems, usageType, selectedCSSVariables } =
    useCSSVariablesItem();

  // When value is single, we only have one content item
  const {
    collectionID,
    item: contentItem,
    index: contentItemIndex,
  } = contentItems[0] || {};

  const { handleOpen } = useContext(Context);

  // if (
  //   !contentItem ||
  //   contentItem?.initialValue === undefined ||
  //   usageType !== "single"
  // ) {
  //   return null;
  // }

  return (
    <Value
      value={contentItem?.initialValue as string | number}
      contentItem={contentItem!}
      onClickList={() => {
        handleOpen("list");
      }}
      onClickEdit={() => {
        handleOpen("edit", {
          variableCollectionID: collectionID,
          variableIndex: contentItemIndex,
        });
      }}
      onClickDelete={deleteUsage}
    />
  );
};

const ArrayValue = () => {
  const { deleteUsage, contentItems, usageType } = useCSSVariablesItem();
  const { handleOpen } = useContext(Context);

  // TODO: need better validation here to determine
  // if custom variables were added but values don't exist or have been deleted from the conente / database
  if (!contentItems || contentItems.length === 0 || usageType !== "array") {
    return null;
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          overflowY: "auto",
          //boxSizing: "border-box",
          backgroundColor: (theme) => theme.palette.background.paper,
          //borderRadius: 1,
          mt: 1,
        }}
      >
        <Typography
          bold
          sx={{
            fontSize: 10,
          }}
        >
          {contentItems.length} CSS Variable{contentItems.length > 1 ? "s" : ""}
        </Typography>
        <Box
          sx={{
            display: "grid",
            width: "100%",
            //flexWrap: "wrap",
            gap: 0.1,
          }}
        >
          {contentItems.map(
            (
              {
                collectionID,
                item: contentItem,
                index: contentItemIndex,
              },
              arrayIndex
            ) => {
              return (
                <Value
                  key={arrayIndex}
                  value={contentItem?.initialValue as string | number}
                  contentItem={contentItem!}
                  onClickList={() => {
                    handleOpen("list");
                  }}
                  onClickEdit={() => {
                    handleOpen("edit", {
                      variableCollectionID: collectionID,
                      variableIndex: contentItemIndex,
                      arrayIndex,
                    });
                  }}
                  onClickDelete={() => {
                    deleteUsage({ usageArrayIndex: arrayIndex });
                  }}
                />
              );
            }
          )}
        </Box>
      </Box>
    </Box>
  );
};

const Value = (props: {
  value: string | number;
  contentItem: types.CSSVariablesContentItem;
  onClickList: () => void;
  onClickEdit: () => void;
  onClickDelete: () => void;
}) => {
  const { onClickList, onClickEdit, onClickDelete, contentItem } = props;
  const [hover, setHover] = useState(false);

  const { usage } = useCSSVariablesItem();

  const { targetRef, slotSxProps, size } = useContext(Context);

  const value = useMemo(() => {
    return contentItem?.initialValue;
  }, [contentItem]);

  const isValidValue = useMemo(() => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.length > 0;
    if (typeof value === "number") return true;
    return false;
  }, [value]);

  return (
    <Tooltip
      title={!isValidValue ? "Value Not Found" : usage?.variableName}
      placement="top-start"
    >
      <Box
        ref={targetRef}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        sx={{
          cursor: "pointer",
          position: "relative",
          height: "100%",
          display: "flex",
          alignItems: "center",
          // Set light red background color if value is not valid
          backgroundColor: isValidValue ? "#ADD8E6" : "#FFCCCB",
          border: `1px solid ${isValidValue ? "#5fa2c6" : "#d18b8b"}`,
          ...slotSxProps?.valueBox,
        }}
      >
        <Typography
          onClick={() => {
            //handleOpen("list");
            onClickList();
          }}
          sx={{
            fontSize: size === "medium" ? 14 : 12,
            height: size === "medium" ? 32 : 24,
            fontWeight: 600,
            mx: 1,
            width: "100%",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
            opacity: hover ? 0.2 : 1,
            alignContent: "center",
            verticalAlign: "middle",
            ...slotSxProps?.typography,
          }}
        >
          {value ?? "N/A"}
        </Typography>

        {hover && (
          <Box
            sx={{
              position: "absolute",
              right: 0,
              top: 0,
              height: "100%",
              display: "flex",
              justifyContent: "space-between",
              verticalAlign: "middle",
              ...slotSxProps?.iconBox,
            }}
          >
            <IconButton
              onClick={() =>
                //handleOpen("edit", { variableIndex: contentItemIndex })
                onClickEdit()
              }
            >
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
            <IconButton
              onClick={() => {
                //handleOpen("list")
                onClickList();
              }}
            >
              <ListIcon sx={{ fontSize: 14 }} />
            </IconButton>
            <IconButton
              onClick={() => {
                onClickDelete();
                //deleteUsage
              }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

type Props = {
  children: React.ReactNode;
  keyofUsage: types.KeyOfCSSVariablesUsageMixed;
  //altKeyofUsage?: types.AltKeyOfCSSVariablesUsage[];
  usageIndex?: number;
  sx?: SxProps;
  slotSxProps?: SlotSxProps;
  syntax?: types.CSSVariableContentSyntax[];
  size?: "small" | "medium";
};

export const CSSVariableBadge = (props: Props) => {
  const { children, keyofUsage } = props;

  const usageArrayIndex =
    cssVariableUsageKeyType(keyofUsage) === "array" ? -1 : undefined;

  return (
    <CSSVariablesItemContext
      keyofUsage={keyofUsage}
      //altKeyofUsage={altKeyofUsage}
      usageArrayIndex={usageArrayIndex}
    >
      <CSSVariableBadgeContainer {...props}>
        {children}
      </CSSVariableBadgeContainer>
    </CSSVariablesItemContext>
  );
};

export const CSSVariableBadgeContainer = (
  props: Omit<Props, "keyofUsage" | "usageIndex"> & {
    keyofUsage?: types.KeyOfCSSVariablesUsageMixed;
  }
) => {
  const { children, sx, slotSxProps, size } = props;
  const [open, setOpen] = useState<"list" | "edit" | false>(false);
  const [selectedVariableIndex, setSelectedVariableIndex] = useState<
    number | undefined
  >(undefined);

  const [selectedVariableCollectionID, setSelectedVariableCollectionID] =
    useState<number | undefined>(undefined);

  const {
    usage,
    loading,
    overrideMode,
    setOverrideMode,
    keyofUsage,
    usageType,
    usageArrayIndex,
  } = useCSSVariablesItem();

  const targetSyntax = useMemo<types.CSSVariableContentSyntax[]>(
    () => Array.from(new Set([...(props.syntax ?? []), "universal"])),
    [props.syntax]
  );

  const ref = useRef<HTMLElement | null>(null);

  const handleOpen = (
    type: "list" | "edit" | false,
    options?: {
      variableCollectionID?: number | undefined;
      variableIndex?: number;
      arrayIndex?: number;
    }
  ) => {
    const {
      variableCollectionID: collectionID,
      variableIndex,
      arrayIndex = undefined,
    } = options ?? {};

    // Set array index to -1 if type is "list" and keyofUsage is array
    // which means we are adding a new variable
    if (type === "list" && usageType === "array") {
      usageArrayIndex.current = -1;
    } else if (type === "edit" && usageType === "array") {
      if (arrayIndex === undefined) {
        throw new Error("arrayIndex is required for edit type in array usage");
      }
      usageArrayIndex.current = arrayIndex;
    }

    setSelectedVariableCollectionID(type === "edit" ? collectionID : undefined);
    setSelectedVariableIndex(type === "edit" ? variableIndex : undefined);
    setOpen(type);
  };

  return (
    <Context
      value={{
        open,
        handleOpen,
        sx,
        slotSxProps,
        targetRef: ref,
        selectedVariableIndex,
        targetSyntax,
        size: size ?? "small",
      }}
    >
      <DraggableBoxCSSVariables
        keyofUsage={props.keyofUsage ?? keyofUsage}
        open={open}
        onClose={() => {
          handleOpen(false);
        }}
        onSelect={() => {
          // Disable override mode on select,
          // meaning the value is now set by selecting a css variables for a specific device / element state.
          setOverrideMode(false);
        }}
        targetRef={ref}
        targetSyntax={targetSyntax}
        variableIndex={selectedVariableIndex!}
        variableCollectionID={selectedVariableCollectionID}
      />
      {!loading &&
      ["single", "object"].includes(usageType) &&
      usage &&
      !overrideMode ? (
        <SingleValue />
      ) : (
        <LoadingBox loading={loading}>
          <BadgeOnMouseOver
            label="CSS Variable"
            onClick={() => {
              handleOpen("list");
            }}
            ref={ref}
            sx={sx}
          >
            {children}
          </BadgeOnMouseOver>
          <ArrayValue />
        </LoadingBox>
      )}
    </Context>
  );
};
