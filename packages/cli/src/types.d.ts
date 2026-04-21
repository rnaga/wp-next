export interface WPNextInput {
  projectPath: string;
  adminUrl: string;
  noSeedTemplates?: boolean;
}

export interface InitOptions {
  templateBaseDir: string;
  prompts: {
    adminUrlMessage: string;
    projectPathMessage: string;
  };
  env: Record<string, string>;
  filesToCopy: string[];
  dependencies: string[];
  withSeedOption?: boolean;
}

export type SeededTemplate = {
  title: string;
  slug: string;
  status: "created" | "skipped";
};

export type SeedEditorPresetTemplatesResult = {
  collections: { title: string; slug: string; status: "created" | "skipped" }[];
  templates: SeededTemplate[];
};
