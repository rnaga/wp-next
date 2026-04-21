import { z } from "zod";
import fs from "fs";
import path from "path";

const WebfontSchema = z.object({
  family: z.string(),
  variants: z.array(z.string()),
  subsets: z.array(z.string()),
  version: z.string(),
  lastModified: z.string(),
  files: z.record(z.string(), z.string()), // keys like "regular", "italic", etc.
  category: z.string(),
  kind: z.literal("webfonts#webfont"),
  menu: z.string(),
});

const WebfontListSchema = z.object({
  kind: z.literal("webfonts#webfontList"),
  items: z.array(WebfontSchema),
});

const apiKey = process.env.GOOGLE_FONTS_API_KEY;
if (!apiKey) {
  throw new Error("Google Fonts API key not found");
}

// Form google fonts API URL by popularity
const url = `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`;

// Fetch google fonts
const response = await fetch(url).then((res) => res.json());

// Validate response
const parsedResponse = WebfontListSchema.parse(response);

// Write output to file (editor/src/server/actions/google-fonts.json)
//packages/editor/src/lexical/nodes/font
const outputDir = `src/lexical/nodes/font`; //path.join(outputDir, "google-fonts.json");
const outputFile = path.join(outputDir, "google-fonts.json");

console.log("Number of fonts: ", parsedResponse.items.length);

console.log("Writing to ", outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
fs.writeFileSync(outputFile, JSON.stringify(parsedResponse, null, 2));

console.log("Writing family names to google-fonts-family.json");

// Pull family names from parsedResponse and write to google-fonts-family.json
const familyNames = parsedResponse.items.map((item) => item.family);
const familyNamesFile = path.join(outputDir, "google-fonts-family.json");
fs.writeFileSync(familyNamesFile, JSON.stringify(familyNames, null, 2));
