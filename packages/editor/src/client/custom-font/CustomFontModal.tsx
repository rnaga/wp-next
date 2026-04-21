import {
  createContext,
  Dispatch,
  RefObject,
  SetStateAction,
  useContext,
  useState,
} from "react";

import { Box, Tab, Tabs } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import * as wpCoreTypes from "@rnaga/wp-next-core/types";
import * as wpTypes from "@rnaga/wp-node/types";

import * as types from "../../types";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { FontFamilies } from "./FontFamilies";
import { FontFiles } from "./FontFiles";

const TabPanel = (props: {
  children?: React.ReactNode;
  value: number;
  index: number;
}) => {
  const { children, value, index } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

type FontRecord<T extends "files" | "families"> = {
  [K in T]: wpCoreTypes.actions.Posts | undefined;
} & {
  map:
    | (T extends "files"
        ? Record<number, wpTypes.WpPosts[]>
        : Record<number, types.FontFace[]>)
    | undefined;
};

const Context = createContext<{
  fontFiles: FontRecord<"files">;
  setFontFiles: Dispatch<SetStateAction<FontRecord<"files">>>;
  fontFamilies: FontRecord<"families">;
  setFontFamilies: Dispatch<SetStateAction<FontRecord<"families">>>;
}>({} as any);

export const useCustomFont = () => useContext(Context);

export const CustomFontModal = (props: {
  ref: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
}) => {
  const { open, onClose, ref } = props;

  const [tabValue, setTabValue] = useState(0);

  const [fontFiles, setFontFiles] = useState<{
    files: wpCoreTypes.actions.Posts | undefined;
    map: undefined | Record<number, wpTypes.WpPosts[]>;
  }>({
    files: undefined,
    map: undefined,
  });

  const [fontFamilies, setFontFamilies] = useState<{
    families: wpCoreTypes.actions.Posts | undefined;
    map: Record<number, types.FontFace[]> | undefined;
  }>({
    families: undefined,
    map: undefined,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Context
        value={{ fontFiles, setFontFiles, fontFamilies, setFontFamilies }}
      >
        <ModalContent
          sx={{
            width: 550,
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Typography size="large" sx={{ fontWeight: 600, mb: 0.5 }}>
              Custom Fonts
            </Typography>
            <Typography size="small" sx={{ color: "text.secondary" }}>
              Manage font families and upload font files for use in the editor.
            </Typography>
          </Box>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab
                label={
                  <Typography
                    size="small"
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: (theme) => theme.palette.grey[700],
                    }}
                  >
                    Font Families
                  </Typography>
                }
                sx={{
                  textTransform: "none",
                }}
              />
              <Tab
                label={
                  <Typography
                    size="small"
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: (theme) => theme.palette.grey[700],
                    }}
                  >
                    Font Files
                  </Typography>
                }
                sx={{
                  textTransform: "none",
                }}
              />
            </Tabs>
          </Box>
          <TabPanel value={tabValue} index={0}>
            <FontFamilies />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <FontFiles />
          </TabPanel>
        </ModalContent>
      </Context>
    </Modal>
  );
};
