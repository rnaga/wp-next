export type DraggableType = "general" | "media" | "form" | "data" | "advanced";

export type DraggableContextValue = {
  klassNode: Klass<LexicalNode>;
  priority?: number;
  type: DraggableType;
  icon: any;
  title: string;
};
