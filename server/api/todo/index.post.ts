import { prisma } from '~/lib/prisma'
import { todoCreateSchema } from '~/utils/todo'

export default defineEventHandler(async (event) => {
    const user = await getAuthUser(event)
    const body = await readBody(event)

    const parsed = todoCreateSchema.safeParse(body)
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Validation Error',
            data: parsed.error.flatten(),
        })
    }

    const todo = await prisma.todo.create({
        data: {
            ...parsed.data,
            description: parsed.data.description || null,
            userId: user.id,
        },
    })

    return todo
})
