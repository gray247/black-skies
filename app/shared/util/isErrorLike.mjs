export function isErrorLike(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    (value instanceof Error || typeof value.message === "string")
  );
}

