const publicRoutes = ["/login", "/register"];

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware on server-side to avoid redirect flicker.
  // The API routes are already protected by their own auth checks.
  // On client-side, use authClient to verify session.
  if (import.meta.server) return;

  const { authClient } = await import("~/lib/auth-client");
  const { data: session } = await authClient.getSession();

  // Jika sudah login dan mengakses halaman public (login/register), redirect ke homepage
  if (session && publicRoutes.includes(to.path)) {
    const redirectPath = to.query.redirect as string;
    return navigateTo(redirectPath || "/");
  }

  // Jika belum login dan mengakses halaman protected, redirect ke login
  if (!session && !publicRoutes.includes(to.path)) {
    return navigateTo({
      path: "/login",
      query: { redirect: to.fullPath },
    });
  }
});
