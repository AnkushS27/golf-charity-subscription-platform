import { del, put } from "@vercel/blob";

export async function uploadWinnerProof(path: string, file: File) {
  return put(path, file, {
    access: "public",
    addRandomSuffix: true,
  });
}

export async function removeBlob(url: string) {
  await del(url);
}
