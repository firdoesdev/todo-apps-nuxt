import { prisma } from '~/lib/prisma'

export default defineEventHandler(async (event) => {
    const user = await getAuthUser(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID is required',
        })
    }

    // Verify ownership
    const existing = await prisma.todo.findFirst({
        where: { id, userId: user.id },
    })

    if (!existing) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Todo not found',
        })
    }

    await prisma.todo.delete({
        where: { id },
    })

    return { success: true }
})
