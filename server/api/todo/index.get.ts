import { prisma } from "~/lib/prisma";
import type { TodoStatus as PrismaTodoStatus } from "../../generated/prisma/client";

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event);

  const query = getQuery(event);
  const search = (query.search as string) || "";
  const status = query.status as PrismaTodoStatus | undefined;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const allowedSortColumns = ["title", "status", "createdAt"];
  const sortBy = allowedSortColumns.includes(query.sortBy as string)
    ? (query.sortBy as string)
    : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const where: any = {
    userId: user.id,
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status && ["PENDING", "IN_PROGRESS", "DONE"].includes(status)) {
    where.status = status;
  }

  const [data, total] = await Promise.all([
    prisma.todo.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.todo.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
});
