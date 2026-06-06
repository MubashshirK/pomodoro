import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  const id = session?.user?.id ? Number.parseInt(session.user.id, 10) : NaN;
  if (!session?.user || !Number.isFinite(id)) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return { ...session.user, id };
}
