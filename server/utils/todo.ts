import { z } from "zod";

export const todoCreateSchema = z.object({
  title: z
    .string()
    .min(1, "Title harus diisi")
    .max(255, "Title maksimal 255 karakter"),
  description: z
    .string()
    .max(1000, "Description maksimal 1000 karakter")
    .optional()
    .or(z.literal("")),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]).default("PENDING"),
});

export const todoUpdateSchema = z.object({
  title: z
    .string()
    .min(1, "Title harus diisi")
    .max(255, "Title maksimal 255 karakter")
    .optional(),
  description: z
    .string()
    .max(1000, "Description maksimal 1000 karakter")
    .optional()
    .or(z.literal("")),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]).optional(),
});

export const todoBulkCreateSchema = z.object({
  todos: z
    .array(todoCreateSchema)
    .min(1, "Minimal 1 todo")
    .max(50, "Maksimal 50 todo"),
});

export const todoBulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, "Minimal 1 id"),
});

export type TodoCreateInput = z.infer<typeof todoCreateSchema>;
export type TodoUpdateInput = z.infer<typeof todoUpdateSchema>;
export type TodoBulkCreateInput = z.infer<typeof todoBulkCreateSchema>;
export type TodoBulkDeleteInput = z.infer<typeof todoBulkDeleteSchema>;
