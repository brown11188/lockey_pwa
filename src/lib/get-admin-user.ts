import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

export async function requireAdminUser() {
  const user = await getSessionUser();
  if (!user) return { user: null, error: unauthorizedResponse() };
  if (user.role !== "admin") {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  return { user, error: null };
}
