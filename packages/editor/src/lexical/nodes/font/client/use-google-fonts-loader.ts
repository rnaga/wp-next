import { useState, useCallback, useMemo } from "react";
import {
  loadGoogleFonts,
  getGoogleFontFamilyList,
} from "../../../../lexical/nodes/font/client/load-google-fonts";

export function useGoogleFontsLoader() {
  const [fontListPosition, setFontListPosition] = useState(0);
  const [fontFamilies, setFontFamilies] = useState<string[]>([]);

  const loadFonts = useCallback(
    (searchValue?: string) => {
      loadGoogleFonts({
        searchValue,
        target: document.head,
        offset: 0,
        limit: fontListPosition + 20,
        callback: (fonts, allFonts) => {
          setFontFamilies(fonts);
          if (!searchValue && allFonts.length > fontListPosition + 20) {
            setFontListPosition(fontListPosition + 20);
          }
        },
      });
    },
    [fontListPosition]
  );

  const fontFamilyList = useMemo(() => getGoogleFontFamilyList(), []);

  return {
    fontListPosition,
    setFontListPosition,
    fontFamilies,
    setFontFamilies,
    loadFonts,
    fontFamilyList,
  };
}
