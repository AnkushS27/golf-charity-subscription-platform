import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";

export async function getCurrentAppUser() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function requireCurrentAppUser() {
  const user = await getCurrentAppUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
