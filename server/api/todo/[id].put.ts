import { prisma } from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event);
  const id = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID is required",
    });
  }

  const parsed = todoUpdateSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation Error",
      data: parsed.error.flatten(),
    });
  }

  // Verify ownership
  const existing = await prisma.todo.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "Todo not found",
    });
  }

  const todo = await prisma.todo.update({
    where: { id },
    data: {
      ...parsed.data,
      description:
        parsed.data.description !== undefined
          ? parsed.data.description || null
          : undefined,
    },
  });

  return todo;
});
