import z from "zod";

export const NonEmptyStringSchema = z.string().trim().nonempty();
export const EmailSchema = z.email().trim().nonempty();
export const IsoStringSchema = z.iso.datetime().trim().nonempty();
