import { api } from "@/lib/axios";
import type { UploadedFile } from "@/types/waitlist";

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<{
    success: boolean;
    data: UploadedFile;
  }>("/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.data;
}
