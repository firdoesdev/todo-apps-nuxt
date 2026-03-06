import { prisma } from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event);
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID is required",
    });
  }

  const todo = await prisma.todo.findFirst({
    where: { id, userId: user.id },
  });

  if (!todo) {
    throw createError({
      statusCode: 404,
      statusMessage: "Todo not found",
    });
  }

  return todo;
});
