import {
  createContext,
  CSSProperties,
  RefObject,
  useContext,
  useEffect,
  useState,
} from "react";
import type * as types from "../../types";
import { useCSSVariables } from "./CSSVariablesContext";
import { useCSSVariablesItem } from "./CSSVariablesItemContext";
import { CSSVariablesModal } from "./CSSVariablesModal";
import { DraggableBox } from "@rnaga/wp-next-ui/DraggableBox";
import { Box, IconButton } from "@mui/material";
import { CSSVariablesMenu } from "../forms/components/CSSVariablesMenu";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import EditIcon from "@mui/icons-material/Edit";
import { EditCSSVariable } from "./ManageCSSVariables";
import { Button } from "@rnaga/wp-next-ui/Button";
import { logger } from "../../lexical/logger";

const Context = createContext<{
  keyofUsage: types.KeyOfCSSVariablesUsageMixed;
  usageArrayIndex?: number;
  openBox: "list" | "edit" | false;
  targetRef?: RefObject<HTMLElement | null>;
  targetSyntax: types.CSSVariableContentSyntax[];
  editVariableIndex?: number;
  setEditVariableIndex: (index?: number) => void;
  editVariableCollectionID?: number;
  setEditVariableCollectionID: (ID?: number) => void;
  handleOpenBox: <T extends "list" | "edit" | false>(
    type: T,
    editItemIndex?: T extends "edit" ? number : never,
    editItemID?: T extends "edit" ? number : never
  ) => void;
  onSelect?: (contentItem: types.CSSVariablesContentItem) => void;
}>({} as any);

export const DraggableBoxCSSVariables = <
  T extends "list" | "edit" | false,
>(props: {
  keyofUsage: types.KeyOfCSSVariablesUsageMixed;
  usageArrayIndex?: number;
  targetRef?: RefObject<HTMLElement | null>;
  open: T;
  onClose: () => void;
  onSelect?: (contentItem: types.CSSVariablesContentItem) => void;
  targetSyntax: types.CSSVariableContentSyntax[];
  variableIndex?: T extends "edit" ? number : never;
  variableCollectionID?: T extends "edit" ? number : never;
}) => {
  const {
    keyofUsage,
    usageArrayIndex,
    targetRef,
    onClose,
    targetSyntax,
    variableIndex,
    variableCollectionID,
    onSelect,
  } = props;
  const { cssVariablesList, undoSoftUpdate } = useCSSVariables();
  const { selectedCSSVariables, setSelectedCSSVariables } =
    useCSSVariablesItem();

  const [openBox, setOpenBox] = useState<"list" | "edit" | false>(props.open);
  const [editVariableIndex, setEditVariableIndex] = useState<number>();
  const [editVariableCollectionID, setEditVariableCollectionID] =
    useState<number>();

  const handleOpenBox = <T extends "list" | "edit" | false>(
    type: T,
    editItemIndex?: T extends "edit" ? number : never,
    editItemID?: T extends "edit" ? number : never
  ) => {
    setEditVariableIndex(editItemIndex);
    setEditVariableCollectionID(editItemID);
    setOpenBox(type);

    // Let the parent component control the open/close state
    // by invoking onClose when the box is closed
    type === false && onClose();
  };

  useEffect(() => {
    // Sync selectedCSSVariables with the latest cssVariablesList by slug, if available.
    // If none is selected, default to the first item in the list.

    if (selectedCSSVariables?.slug) {
      const newSelectedCSSVariables = cssVariablesList.find(
        (cssVariables) => cssVariables.slug === selectedCSSVariables.slug
      );

      if (newSelectedCSSVariables) {
        setSelectedCSSVariables(newSelectedCSSVariables);
      }

      return;
    }

    setSelectedCSSVariables(cssVariablesList[0]);
  }, [cssVariablesList]);

  useEffect(() => {
    if (props.open === "edit") {
      setOpenBox("edit");
      setEditVariableIndex(variableIndex);
      setEditVariableCollectionID(variableCollectionID);
    } else if (props.open === "list") {
      setOpenBox("list");
    } else {
      setOpenBox(false);
    }
  }, [props.open]);

  if (false === openBox) {
    return null;
  }

  const handleClose = async () => {
    handleOpenBox(false);
    onClose();

    await undoSoftUpdate();
  };

  return (
    <Context
      value={{
        keyofUsage,
        usageArrayIndex,
        openBox,
        targetRef,
        targetSyntax,
        editVariableIndex,
        setEditVariableIndex,
        setEditVariableCollectionID,
        editVariableCollectionID,
        handleOpenBox,
        // onUpdate,
        onSelect,
      }}
    >
      <DraggableBox
        onClose={handleClose}
        open={!!openBox}
        targetRef={targetRef}
        title="CSS Variables"
      >
        {openBox === "list" ? <List /> : <Edit />}
      </DraggableBox>
    </Context>
  );
};

const Edit = () => {
  const { handleOpenBox, editVariableIndex, editVariableCollectionID } =
    useContext(Context);
  const { selectedCSSVariables } = useCSSVariablesItem();

  if (
    !selectedCSSVariables ||
    editVariableIndex === undefined ||
    editVariableCollectionID === undefined
  ) {
    return null;
  }

  return (
    <EditCSSVariable
      size="small"
      ID={editVariableCollectionID}
      variableIndex={editVariableIndex}
      onSubmit={() => {
        handleOpenBox("list");
      }}
      onCancel={() => {
        handleOpenBox("list");
      }}
      onUpdate={(selectedCSSVariables) => {
        logger.log("Update CSS Variables", selectedCSSVariables);
      }}
    />
  );
};

const List = () => {
  const { openBox, handleOpenBox, targetRef, targetSyntax, onSelect } =
    useContext(Context);

  const { selectedCSSVariables, setSelectedCSSVariables, updateUsage } =
    useCSSVariablesItem();

  // This is used to toogle CSSVariablesModal
  const [openModal, setOpenModal] = useState(false);

  const [cssVariablesContentFilteredList, setCSSVariablesContentFilteredList] =
    useState<[number, types.CSSVariablesContentItem][]>();
  const { cssVariablesList } = useCSSVariables();

  useEffect(() => {
    //
    if (cssVariablesList.length === 0) {
      setCSSVariablesContentFilteredList([]);
      return;
    }

    const newList =
      selectedCSSVariables?.content
        .map((item, index) =>
          targetSyntax.includes(item.syntax) ? [index, item] : null
        )
        .filter(
          (entry): entry is [number, types.CSSVariablesContentItem] =>
            entry !== null
        ) ?? [];

    setCSSVariablesContentFilteredList(newList);
  }, [selectedCSSVariables, targetSyntax, cssVariablesList]);

  const handleClose = () => {
    setOpenModal(false);
  };

  const handleSelect = (contentItem: types.CSSVariablesContentItem) => () => {
    updateUsage(contentItem, selectedCSSVariables!);
    handleOpenBox(false);
    onSelect?.(contentItem);
  };

  // if (openBox !== "list" || !targetRef?.current) {
  //   return null;
  // }

  return (
    <>
      <CSSVariablesModal
        open={openModal}
        onClose={handleClose}
        ID={selectedCSSVariables?.ID}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <CSSVariablesMenu
          cssVariablesList={cssVariablesList}
          onChange={(cssVariable) => {
            setSelectedCSSVariables(cssVariable);
          }}
          label={
            selectedCSSVariables?.name
              ? selectedCSSVariables.name
              : "Select CSS Variable"
          }
        />
        {(!selectedCSSVariables ||
          cssVariablesContentFilteredList?.length === 0) && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: 2,
            }}
          >
            <Typography size="small">No CSS Variables</Typography>
          </Box>
        )}

        <Box
          sx={{
            maxHeight: 200,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {cssVariablesContentFilteredList?.map(([index, item]) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                justifyContent: "start",
                alignItems: "center",
                px: 2,
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.grey[200],
                },
              }}
              onClick={handleSelect(item)}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  mr: 2,
                  flexGrow: 1,
                }}
              >
                {item.variableName}
              </Typography>
              <Typography sx={{ fontSize: 12, mr: 2 }}>
                {item.initialValue}
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenBox("edit", index, selectedCSSVariables?.ID);
                }}
                sx={{ py: 0.2 }}
              >
                <EditIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      </Box>
      <Button
        size="small"
        onClick={() => {
          setOpenModal(true);
        }}
        sx={{
          textTransform: "none",
          width: "100%",
          mt: 1.5,
        }}
      >
        Manage CSS Variables
      </Button>
    </>
  );
};
