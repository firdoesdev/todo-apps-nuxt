import { prisma } from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event);
  const body = await readBody(event);

  const parsed = todoBulkCreateSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation Error",
      data: parsed.error.flatten(),
    });
  }

  const todos = await prisma.todo.createManyAndReturn({
    data: parsed.data.todos.map((todo) => ({
      ...todo,
      description: todo.description || null,
      userId: user.id,
    })),
  });

  return todos;
});
