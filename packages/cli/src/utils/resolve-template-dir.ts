import fs from "fs";

export const resolveTemplateDir = (dirname: string, base: string) => {
  const withParent = dirname + "/../" + base;
  return fs.existsSync(withParent) ? withParent : dirname + "/" + base;
};
