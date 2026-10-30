"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import axios from "axios";
import axiosInstance from "@/service/axios.service";
import { useAuth } from "../auth";
import AuthShell, {
  btnCls,
  inputCls,
  Notice,
} from "../components/AuthShell";
import PageArt from "../components/PageArt";

const ALLOWED_ROLES = ["USER"] as const;

const safeNext = (n: string | null) =>
  n && n.startsWith("/shop") ? n : "/shop";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    if (err.code === "ERR_NETWORK") {
      return "Cannot reach the server. Please check your connection.";
    }
    return err.response?.data?.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();

  const next = safeNext(sp.get("next"));

  const loginWithOtp = useAuth((s) => s.loginWithOtp);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // STEP 1: Send OTP to the user's phone number.
  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = phone.replace(/\D/g, "");

    if (!/^\d{10}$/.test(cleanPhone)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { data } = await axiosInstance.post(
        "/api/login/send-otp",
        {
          phone: cleanPhone,
          role: "USER",
          allowedRoles: ALLOWED_ROLES,
        },
        { withCredentials: false }
      );

      if (data?.success === false) {
        throw new Error(data.message || "Unable to send OTP. Please try again.");
      }

      setPhone(cleanPhone);
      setOtpSent(true);
      setMessage(data?.message || "OTP sent to your mobile number.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to send OTP. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP and authenticate the user.
  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the valid 6-digit OTP.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { data } = await axiosInstance.post(
        "/api/login/verify-otp",
        {
          phone,
          otp,
          role: "USER",
          allowedRoles: ALLOWED_ROLES,
        },
        { withCredentials: false }
      );

      if (!data?.token || !data?.user) {
        throw new Error(
          data?.message || "OTP verification failed. Please try again."
        );
      }

      await loginWithOtp({ token: data.token, user: data.user }, remember);

      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(
        getErrorMessage(err, "OTP verification failed. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate">
      <PageArt />
    <AuthShell
      title="Login"
      subtitle={
        otpSent
          ? "Enter the OTP sent to your mobile number"
          : "Login securely using your mobile number"
      }
      footer={
        <>
          Don&apos;t have an account?
          <Link
            href={`/shop/register?next=${encodeURIComponent(next)}`}
            className="ml-1 font-bold text-[#FF8400]"
          >
            Sign Up
          </Link>
        </>
      }
    >
      <form onSubmit={otpSent ? verifyOtp : sendOtp} className="space-y-3">
        {!otpSent ? (
          <>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-[#1C1B1F]"
            >
              Mobile Number
            </label>

            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="Enter your 10-digit mobile number"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className={inputCls}
              maxLength={10}
              required
            />
          </>
        ) : (
          <>
            <div className="rounded-lg border border-[#EAEAEA] bg-[#FAFAFA] p-3">
              <p className="text-sm text-[#666666]">OTP sent to</p>

              <p className="mt-1 font-semibold text-[#1C1B1F]">+91 {phone}</p>

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setError("");
                  setMessage("");
                }}
                className="mt-1 text-sm font-semibold text-[#FF8400]"
              >
                Change number
              </button>
            </div>

            <label
              htmlFor="otp"
              className="block text-sm font-medium text-[#1C1B1F]"
            >
              Enter OTP
            </label>

            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className={inputCls}
              maxLength={6}
              required
            />
          </>
        )}

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setRemember((v) => !v)}
            className="flex items-center gap-2 text-[13px] text-[#1C1B1F]"
          >
            <span
              className={`grid h-[18px] w-[18px] place-items-center rounded-[5px] border-[1.5px] ${
                remember
                  ? "border-[#4c4c4b]/70 bg-[#FF8400]"
                  : "border-[#C6C6CC]"
              }`}
            >
              {remember && <Check size={12} color="#fff" />}
            </span>
            Remember me
          </button>

          <Link
            href={`/shop/forgot-password?phone=${encodeURIComponent(phone)}`}
            className="text-[13px] font-semibold text-[#FF8400]"
          >
            Forgot Password?
          </Link>
        </div>

        <Notice error={error} info={message} />

        <button type="submit" disabled={loading} className={btnCls}>
          {loading
            ? otpSent
              ? "Verifying OTP..."
              : "Sending OTP..."
            : otpSent
              ? "Verify OTP & Login"
              : "Send OTP"}
        </button>

        {otpSent && (
          <button
            type="button"
            disabled={loading}
            onClick={sendOtp}
            className="w-full py-2 text-sm font-semibold text-[#FF8400] disabled:opacity-50"
          >
            Resend OTP
          </button>
        )}
      </form>
    </AuthShell>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}