"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastContainer, toast } from "react-toastify";
import axiosInstance from "@/service/axios.service";

const PHONE_REGEX = /^[6-9]\d{9}$/;
const OTP_REGEX = /^\d{6}$/;
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

// +91 / 0 / space soho jai-i type koruk, 10 digit e ana
const normalizePhone = (value: string) => {
  let d = value.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
};

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .refine(
      (v) => PHONE_REGEX.test(normalizePhone(v)),
      "Enter a valid 10-digit mobile number",
    ),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;
type OtpRole = "STORE" | "ADMIN";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---- OTP state ----
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [registeredPhone, setRegisteredPhone] = useState("");
  const [otpRole, setOtpRole] = useState<OtpRole>("STORE");
  const [otp, setOtp] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // ---- Admin mode state ----
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminCodeError, setAdminCodeError] = useState("");
  const [showAdminCode, setShowAdminCode] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phone: "", password: "" },
  });

  // resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const toggleAdminMode = () => {
    setIsAdminMode((prev) => !prev);
    setAdminCode("");
    setAdminCodeError("");
    setShowAdminCode(false);
  };

  const startOtpFlow = (phone: string, role: OtpRole, otpSent: boolean) => {
    setRegisteredPhone(phone);
    setOtpRole(role);
    setOtp("");
    // SMS jai-ni hole sathe sathe resend korte dao
    setResendIn(otpSent ? RESEND_SECONDS : 0);
    setIsOtpModalOpen(true);
  };

  const onSubmit = async (values: RegisterFormValues) => {
    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: normalizePhone(values.phone),
      password: values.password,
    };

    // ---------- ADMIN REGISTER ----------
    if (isAdminMode) {
      if (!adminCode.trim()) {
        setAdminCodeError("Admin access code is required");
        return;
      }

      setIsSubmitting(true);
      try {
        // Code server e verify hobe (client e hardcode rakha nirapod na)
        const response = await axiosInstance.post(
          "/api/register/create-admin",
          { ...payload, adminCode: adminCode.trim() },
        );
        toast.success(response.data?.message || "Admin registered successfully");
        reset();
        toggleAdminMode();

        // backend OTP pathale modal, nahole sorasori login
        if (typeof response.data?.otpSent === "boolean") {
          startOtpFlow(payload.phone, "ADMIN", response.data.otpSent);
        } else {
          router.push("/login");
        }
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Admin registration failed.";
        setAdminCodeError(
          error?.response?.status === 403 ? "Invalid admin access code" : "",
        );
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ---------- STORE OWNER REGISTER (phone OTP flow) ----------
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post(
        "/api/register/register-owner",
        payload,
      );
      toast.success(response.data?.message || "Registration successful");
      startOtpFlow(payload.phone, "STORE", response.data?.otpSent !== false);
      reset();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!registeredPhone) {
      toast.error("Mobile number missing.");
      return;
    }
    if (!OTP_REGEX.test(otp)) {
      toast.error(`Please enter the ${OTP_LENGTH}-digit OTP.`);
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const response = await axiosInstance.post(
        "/api/register/verify-phone-otp",
        { phone: registeredPhone, otp, role: otpRole },
      );
      toast.success(response.data?.message || "Mobile number verified!");
      setIsOtpModalOpen(false);
      setRegisteredPhone("");
      setOtp("");
      router.push("/login");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "OTP verification failed.");
      setOtp("");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!registeredPhone || resendIn > 0) return;
    setIsResending(true);
    try {
      const response = await axiosInstance.post(
        "/api/register/resend-phone-otp",
        { phone: registeredPhone, role: otpRole },
      );
      toast.success(response.data?.message || "OTP sent");
      setOtp("");
      setResendIn(RESEND_SECONDS);
    } catch (error: any) {
      const data = error?.response?.data;
      if (data?.retryAfter) setResendIn(Number(data.retryAfter));
      toast.error(data?.message || "Could not resend OTP.");
    } finally {
      setIsResending(false);
    }
  };

  // ---------------- Shared styles (login page er moto) ----------------
  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "var(--brand-blue)";
    e.target.style.boxShadow = "0 0 0 3px rgba(33,150,211,0.12)";
  };

  const blurStyle =
    (hasError: boolean) => (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = hasError ? "#ef4444" : "var(--border)";
      e.target.style.boxShadow = "";
    };

  const inputStyle = (
    hasError: boolean,
    extra: React.CSSProperties = {},
  ): React.CSSProperties => ({
    height: 40,
    paddingLeft: 36,
    paddingRight: 12,
    border: hasError ? "1.5px solid #ef4444" : "1.5px solid var(--border)",
    background: "var(--surface-soft)",
    color: "var(--foreground)",
    ...extra,
  });

  const labelClass = "text-sm font-semibold block mb-1";
  const labelColor = { color: "var(--brand-primary-dark)" };
  const iconClass =
    "absolute left-3 top-1/2 -translate-y-1/2 text-base leading-none";
  const inputClass = "w-full rounded-xl text-sm outline-none transition-all";

  const FieldError = ({ message }: { message?: string }) =>
    message ? (
      <small className="text-red-500 text-xs mt-0.5 block">⚠️ {message}</small>
    ) : null;

  return (
    <main
      className="h-dvh overflow-y-auto flex px-4 py-3"
      style={{
        background:
          "radial-gradient(circle at 10% 12%, rgba(26,58,107,0.12), transparent 40%), radial-gradient(circle at 90% 88%, rgba(33,150,211,0.14), transparent 40%), linear-gradient(145deg, #f5f8ff 0%, #eef4ff 50%, #f0f6ff 100%)",
      }}
    >
      <div className="w-full m-auto" style={{ maxWidth: 520 }}>
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow)",
            background: "var(--surface)",
          }}
        >
          {/* Top accent bar */}
          <div
            className="h-1.5 w-full"
            style={{
              background:
                "linear-gradient(110deg, var(--brand-primary), var(--brand-blue), var(--brand-orange))",
            }}
          />

          <div className="px-5 pt-3 pb-4">
            {/* Logo + Brand */}
            <div className="flex flex-col items-center text-center mb-2">
              <img
                src="/img/photos/amp-logo.png"
                alt="AMP Logo"
                className="h-10 w-10 rounded-xl object-contain shadow-md mb-1.5"
                style={{ border: "1px solid var(--border)" }}
              />
              <p
                className="text-lg font-black tracking-tight leading-tight"
                style={{ color: "var(--brand-primary)" }}
              >
                AMP{" "}
                <span style={{ color: "var(--brand-orange)" }}>
                  Estore Management System
                </span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {isAdminMode
                  ? "Create admin account 🛡️"
                  : "Create your account 🚀"}
              </p>
              <div
                className="w-full h-px mt-2"
                style={{ background: "var(--border)" }}
              />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
              {/* Name */}
              <div>
                <label className={labelClass} style={labelColor}>
                  Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div className="relative">
                  <span className={iconClass} style={{ color: "var(--muted)" }}>
                    👤
                  </span>
                  <input
                    id="name"
                    placeholder="Your full name"
                    autoComplete="name"
                    {...register("name")}
                    className={inputClass}
                    style={inputStyle(!!errors.name)}
                    onFocus={focusStyle}
                    onBlur={blurStyle(!!errors.name)}
                  />
                </div>
                <FieldError message={errors.name?.message} />
              </div>

              {/* Email */}
              <div>
                <label className={labelClass} style={labelColor}>
                  Email address <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div className="relative">
                  <span className={iconClass} style={{ color: "var(--muted)" }}>
                    ✉️
                  </span>
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    autoComplete="email"
                    {...register("email")}
                    className={inputClass}
                    style={inputStyle(!!errors.email)}
                    onFocus={focusStyle}
                    onBlur={blurStyle(!!errors.email)}
                  />
                </div>
                <FieldError message={errors.email?.message} />
              </div>

              {/* Phone + Password (ek line e) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className={labelClass} style={labelColor}>
                    Mobile number <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div className="relative">
                    <span
                      className={iconClass}
                      style={{ color: "var(--muted)" }}
                    >
                      📱
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="10-digit number (OTP login)"
                      autoComplete="tel"
                      {...register("phone")}
                      className={inputClass}
                      style={inputStyle(!!errors.phone)}
                      onFocus={focusStyle}
                      onBlur={blurStyle(!!errors.phone)}
                    />
                  </div>
                  <FieldError message={errors.phone?.message} />
                </div>

                <div>
                  <label className={labelClass} style={labelColor}>
                    Password <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div className="relative">
                    <span
                      className={iconClass}
                      style={{ color: "var(--muted)" }}
                    >
                      🔒
                    </span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      autoComplete="new-password"
                      {...register("password")}
                      className={inputClass}
                      style={inputStyle(!!errors.password, {
                        paddingRight: 44,
                      })}
                      onFocus={focusStyle}
                      onBlur={blurStyle(!!errors.password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  <FieldError message={errors.password?.message} />
                </div>
              </div>

              {/* Admin Access Code (sudhu admin mode e) */}
              {isAdminMode && (
                <div>
                  <label className={labelClass} style={labelColor}>
                    Admin Access Code{" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div className="relative">
                    <span
                      className={iconClass}
                      style={{ color: "var(--muted)" }}
                    >
                      🛡️
                    </span>
                    <input
                      id="adminCode"
                      type={showAdminCode ? "text" : "password"}
                      placeholder="Enter admin access code"
                      autoComplete="off"
                      value={adminCode}
                      onChange={(e) => {
                        setAdminCode(e.target.value);
                        if (adminCodeError) setAdminCodeError("");
                      }}
                      className={inputClass}
                      style={inputStyle(!!adminCodeError, {
                        paddingRight: 44,
                      })}
                      onFocus={focusStyle}
                      onBlur={blurStyle(!!adminCodeError)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminCode((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none"
                      aria-label="Toggle admin code visibility"
                    >
                      {showAdminCode ? "🙈" : "👁️"}
                    </button>
                  </div>
                  <FieldError message={adminCodeError} />
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  height: 42,
                  marginTop: 4,
                  background: isAdminMode
                    ? "linear-gradient(110deg, var(--brand-orange), #c2410c)"
                    : "linear-gradient(110deg, var(--brand-primary), var(--brand-blue))",
                  boxShadow: "0 4px 18px rgba(26,58,107,0.3)",
                }}
              >
                {isSubmitting
                  ? "⏳ Creating account..."
                  : isAdminMode
                    ? "→ Create Admin Account"
                    : "→ Create Account"}
              </button>

              {/* Register as Admin toggle */}
              <button
                type="button"
                onClick={toggleAdminMode}
                disabled={isSubmitting}
                className="w-full rounded-xl font-semibold text-xs transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  height: 34,
                  border: "1.5px solid var(--brand-orange)",
                  background: isAdminMode
                    ? "rgba(232,89,12,0.08)"
                    : "transparent",
                  color: "var(--brand-orange)",
                }}
              >
                {isAdminMode
                  ? "← Register as Store Owner instead"
                  : "🛡️ Register as a Super Admin"}
              </button>
            </form>

            {/* Login link */}
            <div
              className="rounded-xl px-4 py-2 mt-2 text-center text-xs"
              style={{
                background: "var(--surface-soft)",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{ color: "var(--muted)" }}>
                Already have an account?{" "}
              </span>
              <Link
                href="/login"
                className="font-bold hover:underline"
                style={{ color: "var(--brand-orange)" }}
              >
                Sign in →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Modal (Store Owner + Admin) */}
      {isOtpModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{
            background: "rgba(15,23,42,0.55)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => {
            if (!isVerifyingOtp) setIsOtpModalOpen(false);
          }}
        >
          <div
            className="w-full rounded-3xl overflow-hidden"
            style={{
              maxWidth: 440,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 28px 80px rgba(15,23,42,0.28)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="h-1.5 w-full"
              style={{
                background:
                  "linear-gradient(110deg, var(--brand-primary), var(--brand-blue), var(--brand-orange))",
              }}
            />

            <div className="px-5 pt-3 pb-4">
              {/* Header */}
              <div className="flex flex-col items-center text-center mb-2">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-xl mb-1.5 shadow-md"
                  style={{
                    background: "var(--surface-soft)",
                    border: "1px solid var(--border)",
                  }}
                >
                  📱
                </div>
                <p
                  className="text-lg font-black leading-tight"
                  style={{ color: "var(--brand-primary-dark)" }}
                >
                  Verify your mobile number
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  Enter the OTP sent to your mobile number
                </p>
                <div
                  className="w-full h-px mt-2"
                  style={{ background: "var(--border)" }}
                />
              </div>

              <div className="space-y-2">
                {/* Phone readonly */}
                <div>
                  <label className={labelClass} style={labelColor}>
                    Mobile number
                  </label>
                  <div className="relative">
                    <span
                      className={iconClass}
                      style={{ color: "var(--muted)" }}
                    >
                      📱
                    </span>
                    <input
                      type="text"
                      value={`+91 ${registeredPhone}`}
                      readOnly
                      className={inputClass}
                      style={inputStyle(false, {
                        color: "var(--muted)",
                        cursor: "not-allowed",
                      })}
                    />
                  </div>
                </div>

                {/* OTP */}
                <div>
                  <label className={labelClass} style={labelColor}>
                    OTP <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div className="relative">
                    <span
                      className={iconClass}
                      style={{ color: "var(--muted)" }}
                    >
                      🔑
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter 6-digit OTP"
                      autoComplete="one-time-code"
                      value={otp}
                      autoFocus
                      onChange={(e) =>
                        setOtp(
                          e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH),
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isVerifyingOtp) {
                          handleVerifyOtp();
                        }
                      }}
                      className={inputClass}
                      style={inputStyle(false, {
                        letterSpacing: "0.2em",
                        fontWeight: 600,
                      })}
                      onFocus={focusStyle}
                      onBlur={blurStyle(false)}
                    />
                  </div>

                  <div className="text-right mt-1">
                    <button
                      type="button"
                      disabled={resendIn > 0 || isResending || isVerifyingOtp}
                      onClick={handleResendOtp}
                      className="text-xs font-semibold hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                      style={{ color: "var(--brand-orange)" }}
                    >
                      {isResending
                        ? "Sending..."
                        : resendIn > 0
                          ? `Resend OTP in ${resendIn}s`
                          : "Resend OTP"}
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isVerifyingOtp}
                    onClick={() => {
                      setIsOtpModalOpen(false);
                      setOtp("");
                    }}
                    className="flex-1 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      height: 42,
                      border: "1.5px solid var(--border)",
                      background: "var(--surface-soft)",
                      color: "var(--muted)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isVerifyingOtp || otp.length !== OTP_LENGTH}
                    onClick={handleVerifyOtp}
                    className="flex-1 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      height: 42,
                      background:
                        "linear-gradient(110deg, var(--brand-primary), var(--brand-blue))",
                      boxShadow: "0 4px 18px rgba(26,58,107,0.3)",
                    }}
                  >
                    {isVerifyingOtp ? "⏳ Verifying..." : "✓ Verify OTP"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" />
    </main>
  );
}