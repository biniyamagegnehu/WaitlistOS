import axios from "axios";
import { api } from "@/lib/axios";
import type { JoinErrorCode, JoinResponse, JoinWaitlistInput } from "@/types/participant";

export class JoinWaitlistError extends Error {
  constructor(public readonly code: JoinErrorCode) {
    super(code);
    this.name = "JoinWaitlistError";
  }
}

export async function joinWaitlist(data: JoinWaitlistInput): Promise<JoinResponse> {
  try {
    const response = await api.post<JoinResponse>("/participants", data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message;
      if (isJoinErrorCode(message)) {
        throw new JoinWaitlistError(message);
      }
    }

    throw new JoinWaitlistError("SERVER_ERROR");
  }
}

function isJoinErrorCode(value: unknown): value is JoinErrorCode {
  return (
    value === "WAITLIST_NOT_FOUND" ||
    value === "EMAIL_ALREADY_JOINED" ||
    value === "INVALID_REFERRAL" ||
    value === "SELF_REFERRAL" ||
    value === "SERVER_ERROR"
  );
}
