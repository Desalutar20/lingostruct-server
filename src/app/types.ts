export type Nullable<T> = T | null;
export type ExtractPrefix<
  T extends string,
  Delimiter extends string,
> = T extends `${infer Prefix}${Delimiter}${string}` ? `${Prefix}${Delimiter}` : never;
