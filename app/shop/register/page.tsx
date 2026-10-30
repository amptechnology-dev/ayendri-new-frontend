"use client";

import { Suspense, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import axiosInstance from "@/service/axios.service";
import { useAuth } from "../auth";
import AuthShell, { btnCls, inputCls, Notice } from "../components/AuthShell";

const safeNext = (n: string | null) => (n && n.startsWith("/shop") ? n : "/shop");
type Step = "FORM" | "PHONE_OTP";

// The backend stores and matches the 10-digit number, so always send that.
const cleanPhone = (p: string) => p.replace(/\D/g, "").slice(-10);

const getErrorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    if (err.code === "ERR_NETWORK") {
      return "Cannot reach the server. Please check your connection.";
    }
    if (err.code === "ECONNABORTED") {
      return "The request timed out. Please try again.";
    }
    const d = err.response?.data;
    return d?.errors?.[0]?.message || d?.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

function RegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = safeNext(sp.get("next"));
  const loginWithOtp = useAuth((s) => s.loginWithOtp);

  const [step, setStep] = useState<Step>("FORM");
  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [phoneOtp, setPhoneOtp] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleFieldChange =
    (key: keyof typeof f) => (e: ChangeEvent<HTMLInputElement>) => {
      setF((previous) => ({ ...previous, [key]: e.target.value }));
    };

  const register = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (f.name.trim().length < 2) {
      return setError("Enter your name.");
    }
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) {
      return setError("Enter a valid email address.");
    }
    if (cleanPhone(f.phone).length !== 10) {
      return setError("Enter a valid phone number.");
    }
    if (f.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      const { data } = await axiosInstance.post(
        "/api/register/register-user",
        {
          name: f.name.trim(),
          email: f.email.trim(),
          phone: cleanPhone(f.phone),
          password: f.password,
        },
        { withCredentials: false }
      );

      if (data?.success === false) {
        throw new Error(
          data?.message || "Could not send the mobile verification OTP."
        );
      }

      setInfo("Registration successful. Verification OTP sent to your phone.");
      setStep("PHONE_OTP");
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed."));
    } finally {
      setLoading(false);
    }
  };

  const verifyPhone = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!phoneOtp.trim()) {
      return setError("Enter the phone OTP.");
    }

    setLoading(true);

    try {
      const { data } = await axiosInstance.post(
        "/api/register/verify-phone-otp",
        {
          phone: cleanPhone(f.phone),
          otp: phoneOtp.trim(),
        },
        { withCredentials: false }
      );

      if (!data?.token || !data?.user) {
        throw new Error(
          data?.message ||
            "Verification succeeded, but no login token was returned."
        );
      }

      // Log them straight in (same call the login page uses)
      await loginWithOtp({ token: data.token, user: data.user }, true);

      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err, "Phone OTP verification failed."));
    } finally {
      setLoading(false);
    }
  };

  const resendPhoneOtp = async () => {
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const { data } = await axiosInstance.post(
        "/api/register/resend-phone-otp",
        { phone: cleanPhone(f.phone) },
        { withCredentials: false }
      );

      setInfo(data?.message || "A new OTP has been sent to your phone.");
      setPhoneOtp("");
    } catch (err) {
      setError(getErrorMessage(err, "Could not resend the phone OTP."));
    } finally {
      setLoading(false);
    }
  };

  const title = step === "FORM" ? "Create Account" : "Verify Phone";

  const subtitle =
    step === "FORM"
      ? "Sign up to start shopping with Ayendri"
      : `Enter the SMS code sent to ${f.phone}`;

  return (
    <AuthShell
      title={title}
      subtitle={subtitle}
      footer={
        <>
          Already have an account?
          <Link
            href={`/shop/login?next=${encodeURIComponent(next)}`}
            className="ml-1 font-bold text-[#FF8400]"
          >
            Log In
          </Link>
        </>
      }
    >
      {step === "FORM" && (
        <form onSubmit={register} className="space-y-3">
          <input
            placeholder="Full name"
            value={f.name}
            onChange={handleFieldChange("name")}
            className={inputCls}
            autoComplete="name"
          />
          <input
            type="email"
            autoCapitalize="none"
            placeholder="Email"
            value={f.email}
            onChange={handleFieldChange("email")}
            className={inputCls}
            autoComplete="email"
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={f.phone}
            onChange={(e) =>
              setF((p) => ({
                ...p,
                phone: e.target.value.replace(/\D/g, "").slice(0, 10),
              }))
            }
            maxLength={10}
            inputMode="numeric"
            className={inputCls}
            autoComplete="tel-national"
          />
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              placeholder="Password"
              value={f.password}
              onChange={handleFieldChange("password")}
              className={`${inputCls} pr-12`}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label="Toggle password visibility"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A8A93]"
            >
              {show ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          <Notice error={error} info={info} />

          <button type="submit" disabled={loading} className={btnCls}>
            {loading ? "Creating…" : "Sign Up"}
          </button>
        </form>
      )}

      {step === "PHONE_OTP" && (
        <form onSubmit={verifyPhone} className="space-y-3">
          <div className="rounded-xl bg-[#F5F5F7] p-4 text-sm">
            <p className="text-[#8A8A93]">OTP sent to</p>
            <p className="mt-1 font-bold text-[#1C1B1F]">{f.phone}</p>
            <button
              type="button"
              onClick={() => {
                setStep("FORM");
                setError("");
                setInfo("");
              }}
              className="mt-2 font-bold text-[#FF8400]"
            >
              Change number
            </button>
          </div>

          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter phone OTP"
            value={phoneOtp}
            onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
            className={`${inputCls} text-center tracking-[0.4em]`}
          />

          <Notice error={error} info={info} />

          <button type="submit" disabled={loading} className={btnCls}>
            {loading ? "Verifying…" : "Verify Phone & Continue"}
          </button>

          <button
            type="button"
            onClick={resendPhoneOtp}
            disabled={loading}
            className="w-full py-2 text-sm font-bold text-[#FF8400] disabled:opacity-60"
          >
            Resend OTP
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}