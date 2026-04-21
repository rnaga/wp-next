export const isClientSide = () => {
  return typeof window !== "undefined";
};

export const isServerSide = () => {
  return typeof window === "undefined";
};

export const assertClientSide = (error?: Error | string) => {
  if (!isClientSide()) {
    throw error instanceof Error
      ? error
      : new Error(
          error || "This function can only be called on the client side."
        );
  }
};

export const assertServerSide = (error?: Error | string) => {
  if (!isServerSide()) {
    throw error instanceof Error
      ? error
      : new Error(
          error || "This function can only be called on the server side."
        );
  }
};
