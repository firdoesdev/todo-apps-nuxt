import { auth } from '~/lib/auth'
import type { H3Event } from 'h3'

export async function getAuthUser(event: H3Event) {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session?.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    }

    return session.user
}
