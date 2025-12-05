export type Nullable<T> = T | null;

export function hasErrorCode(
  e: unknown
): e is { code: string; message?: string } {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    typeof (e as unknown as { code: string }).code === "string"
  );
}
