import { authClient } from '~/lib/auth-client'

const publicRoutes = ['/login', '/register']

export default defineNuxtRouteMiddleware(async (to) => {
    const { data: session } = await authClient.getSession()

    // Jika sudah login dan mengakses halaman public (login/register), redirect ke homepage
    if (session && publicRoutes.includes(to.path)) {
        return navigateTo('/')
    }

    // Jika belum login dan mengakses halaman protected, redirect ke login
    if (!session && !publicRoutes.includes(to.path)) {
        return navigateTo('/login')
    }
})
