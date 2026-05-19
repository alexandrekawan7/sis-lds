import { auth } from "@/auth";

export async function getSession() {
  return auth();
}

export async function isLoggedIn(): Promise<boolean> {
  const session = await auth();
  return !!session;
}
