import { z } from "zod";

export const TodoStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;

export type TodoStatusType = (typeof TodoStatus)[keyof typeof TodoStatus];

export const todoStatusOptions = [
  { label: "Pending", value: TodoStatus.PENDING },
  { label: "In Progress", value: TodoStatus.IN_PROGRESS },
  { label: "Done", value: TodoStatus.DONE },
];

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

export type TodoCreateInput = z.infer<typeof todoCreateSchema>;
export type TodoUpdateInput = z.infer<typeof todoUpdateSchema>;
