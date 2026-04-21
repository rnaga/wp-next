import googleFontFamilyJSONList from "../../../../lexical/nodes/font/google-fonts-family.json";

export const getGoogleFontFamilyList = () => {
  return googleFontFamilyJSONList.filter((font) => !font.includes("Icons"));
};

const loadedFonts = new Set<string>();

export const loadGoogleFonts = (args: {
  callback?: (
    fonts: string[],
    allFonts: string[],
    args: {
      searchValue?: string;
      offset: number;
      limit: number;
    }
  ) => void;
  searchValue?: string;
  target?: HTMLElement;
  offset?: number;
  limit?: number;
}) => {
  const {
    searchValue,
    target = document.head,
    offset = 0,
    limit = 20,
    callback,
  } = args || {};

  const fontList = getGoogleFontFamilyList();

  const fonts =
    searchValue && searchValue.length > 0
      ? fontList
          .filter((font) =>
            font.toLowerCase().includes(searchValue.toLowerCase())
          )
          .slice(offset, 20)
      : fontList.slice(offset, limit);

  // Callback with the fonts
  callback && callback(fonts, fontList, { searchValue, offset, limit });

  // Check if all fonts are already loaded
  const unloadedFonts = fonts.filter((font) => !loadedFonts.has(font));

  if (unloadedFonts.length > 0) {
    // Generate font link, replace space with + and add wght@400;700&display=swap
    // Generate one link for all fonts
    const fontLink = `https://fonts.googleapis.com/css?family=${fonts
      .map((font) => font.replace(" ", "+"))
      .map((font) => `${font}:wght@400;700`)
      .join("|")}&display=swap`;

    // Load fonts using font link to head
    // const head = document.head;
    const link = document.createElement("link");

    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = fontLink;

    target.appendChild(link);

    unloadedFonts.forEach((font) => loadedFonts.add(font));
  }
};
