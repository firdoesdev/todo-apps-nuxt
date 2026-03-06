import { prisma } from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event);
  const body = await readBody(event);

  const parsed = todoBulkDeleteSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation Error",
      data: parsed.error.flatten(),
    });
  }

  const result = await prisma.todo.deleteMany({
    where: {
      id: { in: parsed.data.ids },
      userId: user.id,
    },
  });

  return { success: true, deletedCount: result.count };
});
