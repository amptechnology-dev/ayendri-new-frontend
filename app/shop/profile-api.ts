"use client";
import axiosInstance from "@/service/axios.service";

// shopApi te credentials chhilo na, tai same rakhlam (CORS "*" er sathe kaj korbe)
const noCreds = { withCredentials: false } as const;

// Same endpoint and body as the app's api.updateProfile
export async function updateProfile(body: { name: string; phone?: string }) {
  const res = await axiosInstance.put(
    "/api/login/profile-page",
    body,
    noCreds,
  );
  return res.data;
}

// Same endpoint and body as the app's api.changePassword
// (the backend expects `password`, not `newPassword`)
export async function changePassword(body: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const res = await axiosInstance.put(
    "/api/login/update-profile",
    {
      currentPassword: body.currentPassword,
      password: body.newPassword,
      confirmPassword: body.confirmPassword,
    },
    noCreds,
  );
  return res.data;
}

export const apiError = (e: any, fallback = "Please try again.") =>
  e?.response?.data?.errors?.[0]?.message ??
  e?.response?.data?.message ??
  e?.message ??
  fallback;