"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@/helper/schema/Schema";
import axiosInstance from "@/service/axios.service";
import { useAppDispatch } from "@/lib/store/hooks";
import { tokenSlice } from "../../lib/store/features/storeToken";

const AUTH_TOKEN_KEY = "login-token";
const AUTH_USER_KEY = "login-user";

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/dashboard",
  STORE: "/dashboard/store",
};

// roles that may sign in to this portal (USER accounts are handled in the mobile app)
const PORTAL_ROLES = ["ADMIN", "STORE"];
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  STORE: "Store",
};

// ---------------- THEME ----------------
const ORANGE = "#f97316";
const ORANGE_DARK = "#ea580c";
const ORANGE_DEEP = "#c2410c";
const ORANGE_SOFT = "#fff7ed";
const ORANGE_BORDER = "#fed7aa";
const TEXT_DARK = "#1f2937";
const TEXT_MUTED = "#6b7280";

// ---------------- CAPTCHA CONFIG ----------------
// Confusing characters (0/O, 1/I/L) are excluded
const CAPTCHA_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CAPTCHA_LENGTH = 5;
const CAPTCHA_W = 200;
const CAPTCHA_H = 52;

const randInt = (max: number) => {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
};
const randFloat = (min: number, max: number) =>
  min + (randInt(10000) / 10000) * (max - min);

const generateCaptchaText = () =>
  Array.from(
    { length: CAPTCHA_LENGTH },
    () => CAPTCHA_CHARS[randInt(CAPTCHA_CHARS.length)],
  ).join("");

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // filled when the backend finds more than one matching account (ADMIN + STORE)
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const router = useRouter();
  const dispatch = useAppDispatch();

  // ---------------- CAPTCHA STATE ----------------
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captchaText, setCaptchaText] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  type LoginForm = z.infer<typeof LoginSchema>;

  const {
    register,
    control,
    handleSubmit,
    getValues,
    watch,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
  });

  const emailValue = watch("email");
  const passwordValue = watch("password");

  // credentials changed, so any previous role choice is no longer valid
  useEffect(() => {
    setRoleOptions([]);
  }, [emailValue, passwordValue]);

  // Draw the captcha on the canvas (clear, readable, light noise)
  const drawCaptcha = useCallback((text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Keep it sharp on Retina / HiDPI screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CAPTCHA_W * dpr;
    canvas.height = CAPTCHA_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CAPTCHA_W, CAPTCHA_H);

    // Light, clean background
    const bg = ctx.createLinearGradient(0, 0, CAPTCHA_W, CAPTCHA_H);
    bg.addColorStop(0, "#fff7ed");
    bg.addColorStop(1, "#ffedd5");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CAPTCHA_W, CAPTCHA_H);

    // Very light noise dots (kept faint so text stays readable)
    for (let i = 0; i < 25; i++) {
      ctx.fillStyle = `rgba(234,88,12,${randFloat(0.08, 0.2)})`;
      ctx.beginPath();
      ctx.arc(
        randFloat(0, CAPTCHA_W),
        randFloat(0, CAPTCHA_H),
        randFloat(0.8, 1.6),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    // Characters: big, bold, mild rotation only
    const slot = CAPTCHA_W / (text.length + 1);
    const palette = ["#7c2d12", "#9a3412", "#c2410c", "#1f2937", "#374151"];
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    text.split("").forEach((ch, i) => {
      const x = slot * (i + 1) + randFloat(-2, 2);
      const y = CAPTCHA_H / 2 + randFloat(-2, 2);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(randFloat(-0.18, 0.18));
      ctx.font = `bold 32px "Courier New", monospace`;
      ctx.fillStyle = palette[randInt(palette.length)];
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });

    // Two thin light lines behind/over (just enough to stop simple bots)
    for (let i = 0; i < 2; i++) {
      ctx.strokeStyle = "rgba(249,115,22,0.35)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(randFloat(0, 30), randFloat(8, CAPTCHA_H - 8));
      ctx.bezierCurveTo(
        randFloat(50, 80),
        randFloat(0, CAPTCHA_H),
        randFloat(120, 150),
        randFloat(0, CAPTCHA_H),
        randFloat(170, CAPTCHA_W),
        randFloat(8, CAPTCHA_H - 8),
      );
      ctx.stroke();
    }
  }, []);

  const refreshCaptcha = useCallback(
    (errorMessage = "") => {
      const text = generateCaptchaText();
      setCaptchaText(text);
      setCaptchaInput("");
      setCaptchaError(errorMessage);
      drawCaptcha(text);
    },
    [drawCaptcha],
  );

  // Generate on the client only (avoids SSR hydration mismatch)
  useEffect(() => {
    refreshCaptcha();
  }, [refreshCaptcha]);

  const clearAuth = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0`;
  };

  // Sends the login request. `role` is only sent after the user picks one.
  const performLogin = async (data: LoginForm, role?: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/login", {
        email: data.email,
        password: data.password,
        allowedRoles: PORTAL_ROLES,
        ...(role ? { role } : {}),
      });

      const token = res.data.token;
      dispatch(tokenSlice.actions.saveToken(token));
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      document.cookie = `${AUTH_TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 2}; SameSite=Lax; Secure`;

      let resolvedRole: string | undefined = res.data?.user?.role;
      try {
        const profileResponse = await axiosInstance.get(
          "/api/login/profile-page",
        );
        const user = profileResponse.data?.user;
        if (user) {
          resolvedRole = user.role;
          localStorage.setItem(
            AUTH_USER_KEY,
            JSON.stringify({
              id: user._id || user.id,
              name: user.name || user.email || "User",
              email: user.email || "",
              role: user.role,
              picture: user.picture,
            }),
          );
        }
      } catch (profileError) {
        console.error("Unable to load profile after login:", profileError);
      }

      window.dispatchEvent(new Event("auth-changed"));

      const target = resolvedRole ? ROLE_HOME[resolvedRole] : undefined;
      if (!target) {
        clearAuth();
        setError("This portal is only for Admin and Store accounts.");
        setRoleOptions([]);
        refreshCaptcha();
        return;
      }
      router.push(target);
    } catch (err: any) {
      const errData = err.response?.data;

      // same email + password matched more than one account, let the user choose
      if (errData?.requireRole && Array.isArray(errData.roles)) {
        const options = errData.roles.filter((r: string) =>
          PORTAL_ROLES.includes(r),
        );
        if (options.length > 1) {
          setRoleOptions(options);
          return;
        }
      }

      setError(errData?.message || "Login failed. Please try again.");
      setRoleOptions([]);
      // new captcha after every failed attempt
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setError("");

    // Captcha check (before the API call)
    if (!captchaInput.trim()) {
      setCaptchaError("Please enter the captcha");
      return;
    }
    if (captchaInput.trim().toUpperCase() !== captchaText) {
      refreshCaptcha("Captcha does not match. Try a new one.");
      return;
    }

    await performLogin(data);
  };

  // captcha was already verified on the first submit, so it is not asked again
  const handleRoleSelect = (role: string) => {
    performLogin(getValues(), role);
  };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = ORANGE;
    e.target.style.boxShadow = "0 0 0 4px rgba(249,115,22,0.15)";
    e.target.style.background = "#fff";
  };

  const blurStyle =
    (hasError: boolean) => (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = hasError ? "#ef4444" : "#e5e7eb";
      e.target.style.boxShadow = "";
      e.target.style.background = "#f9fafb";
    };

  const inputBase: React.CSSProperties = {
    height: 46,
    background: "#f9fafb",
    color: TEXT_DARK,
  };

  const features = [
    { icon: "📦", text: "Manage products & inventory with ease" },
    { icon: "📊", text: "Real-time sales and order insights" },
    { icon: "🔐", text: "Secure access for Admin and Store teams" },
  ];

  return (
    <main
      className="min-h-dvh flex items-center justify-center px-4 py-6"
      style={{
        background:
          "radial-gradient(circle at 8% 10%, rgba(249,115,22,0.18), transparent 40%), radial-gradient(circle at 92% 90%, rgba(234,88,12,0.16), transparent 40%), linear-gradient(145deg, #fffaf5 0%, #fff4e8 50%, #fffaf5 100%)",
      }}
    >
      <div
        className="w-full flex flex-col lg:flex-row rounded-3xl overflow-hidden bg-white"
        style={{
          maxWidth: 960,
          border: `1px solid ${ORANGE_BORDER}`,
          boxShadow: "0 25px 60px -15px rgba(234,88,12,0.28)",
        }}
      >
        {/* ---------------- LEFT: BRAND PANEL ---------------- */}
        <div
          className="hidden lg:flex lg:w-5/12 flex-col justify-between relative overflow-hidden p-10 text-white"
          style={{
            background: `linear-gradient(155deg, ${ORANGE} 0%, ${ORANGE_DARK} 55%, ${ORANGE_DEEP} 100%)`,
          }}
        >
          {/* decorative circles */}
          <div
            className="absolute rounded-full"
            style={{
              width: 260,
              height: 260,
              top: -90,
              right: -90,
              background: "rgba(255,255,255,0.12)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 200,
              height: 200,
              bottom: -70,
              left: -70,
              background: "rgba(255,255,255,0.1)",
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <img
                src="/img/photos/ayendri-logo.png"
                alt="Logo"
                className="h-11 w-11 rounded-xl object-contain bg-white p-1 shadow-lg"
              />
              <span className="text-xl font-extrabold tracking-wide">
                Ayendri
              </span>
            </div>
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold leading-tight mb-3">
              Run your store
              <br />
              smarter, faster.
            </h2>
            <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.85)" }}>
              One powerful dashboard to manage your products, orders and teams.
            </p>

            <div className="space-y-3">
              {features.map((f) => (
                <div key={f.text} className="flex items-center gap-3">
                  <span
                    className="flex items-center justify-center rounded-lg text-base"
                    style={{
                      width: 34,
                      height: 34,
                      background: "rgba(255,255,255,0.18)",
                    }}
                  >
                    {f.icon}
                  </span>
                  <span className="text-sm font-medium">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p
            className="relative z-10 text-xs"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            © {new Date().getFullYear()} Ayendri. All rights reserved.
          </p>
        </div>

        {/* ---------------- RIGHT: FORM PANEL ---------------- */}
        <div className="w-full lg:w-7/12 px-6 sm:px-10 py-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-5">
            <img
              src="/img/photos/ayendri-logo.png"
              alt="Logo"
              className="h-10 w-10 rounded-xl object-contain shadow-md"
              style={{ border: `1px solid ${ORANGE_BORDER}` }}
            />
            <span
              className="text-xl font-extrabold"
              style={{ color: ORANGE_DARK }}
            >
              Ayendri
            </span>
          </div>

          {/* Heading */}
          <div className="mb-6 text-center lg:text-left">
            <h1
              className="text-2xl sm:text-3xl font-black tracking-tight"
              style={{ color: TEXT_DARK }}
            >
              Welcome to <span style={{ color: ORANGE }}>Ayendri</span>
            </h1>
            <p className="text-sm mt-1.5" style={{ color: TEXT_MUTED }}>
              Sign in to your account to continue
            </p>
            <div
              className="mt-3 h-1 w-14 rounded-full mx-auto lg:mx-0"
              style={{
                background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_DARK})`,
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-4 rounded-xl px-3 py-2.5 text-sm font-semibold flex items-center gap-2"
              style={{
                background: "#fff1f2",
                border: "1px solid #fecdd3",
                color: "#b91c1c",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="text-sm font-semibold block mb-1.5"
                style={{ color: TEXT_DARK }}
              >
                Email address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base leading-none">
                  ✉️
                </span>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="w-full rounded-xl text-sm outline-none transition-all"
                  style={{
                    ...inputBase,
                    paddingLeft: 42,
                    paddingRight: 14,
                    border: errors.email
                      ? "1.5px solid #ef4444"
                      : "1.5px solid #e5e7eb",
                  }}
                  onFocus={focusStyle}
                  onBlur={blurStyle(!!errors.email)}
                />
              </div>
              {errors.email && (
                <small className="text-red-500 text-xs mt-1 block">
                  ⚠️ {errors.email.message}
                </small>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="text-sm font-semibold block mb-1.5"
                style={{ color: TEXT_DARK }}
              >
                Password
              </label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base leading-none">
                      🔒
                    </span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="w-full rounded-xl text-sm outline-none transition-all"
                      style={{
                        ...inputBase,
                        paddingLeft: 42,
                        paddingRight: 48,
                        border: errors.password
                          ? "1.5px solid #ef4444"
                          : "1.5px solid #e5e7eb",
                      }}
                      onFocus={focusStyle}
                      onBlur={blurStyle(!!errors.password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lg leading-none"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                )}
              />
              {errors.password && (
                <small className="text-red-500 text-xs mt-1 block">
                  ⚠️ {errors.password.message}
                </small>
              )}
              <div className="text-right mt-1.5">
                <button
                  type="button"
                  onClick={() => router.push("/forget-password")}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: ORANGE_DARK }}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* CAPTCHA */}
            <div>
              <label
                htmlFor="captcha"
                className="text-sm font-semibold block mb-1.5"
                style={{ color: TEXT_DARK }}
              >
                Security check
              </label>

              <div className="flex items-center gap-2">
                {/* Canvas wrapper: blocks select / copy / drag / right-click */}
                <div
                  className="relative rounded-xl overflow-hidden flex-shrink-0 select-none"
                  style={{
                    width: CAPTCHA_W,
                    maxWidth: "100%",
                    height: CAPTCHA_H,
                    border: `1.5px solid ${ORANGE_BORDER}`,
                    userSelect: "none",
                    WebkitUserSelect: "none",
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                >
                  <canvas
                    ref={canvasRef}
                    aria-label="Captcha image"
                    draggable={false}
                    style={{
                      width: CAPTCHA_W,
                      height: CAPTCHA_H,
                      display: "block",
                      pointerEvents: "none",
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => refreshCaptcha()}
                  title="Refresh captcha"
                  aria-label="Refresh captcha"
                  className="flex items-center justify-center rounded-xl transition-all hover:rotate-180 hover:bg-orange-50"
                  style={{
                    width: 46,
                    height: 46,
                    minWidth: 46,
                    background: "#fff",
                    border: `1.5px solid ${ORANGE_BORDER}`,
                    color: ORANGE_DARK,
                    transitionDuration: "0.4s",
                  }}
                >
                  <i className="pi pi-refresh" style={{ fontSize: 16 }} />
                </button>
              </div>

              <div className="relative mt-2.5">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base leading-none">
                  🛡️
                </span>
                <input
                  id="captcha"
                  type="text"
                  value={captchaInput}
                  onChange={(e) => {
                    setCaptchaInput(e.target.value.toUpperCase());
                    if (captchaError) setCaptchaError("");
                  }}
                  // Paste / copy / cut / drop are blocked, the code must be typed manually
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  maxLength={CAPTCHA_LENGTH}
                  placeholder="Type the characters shown above"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className="w-full rounded-xl text-sm outline-none transition-all"
                  style={{
                    ...inputBase,
                    paddingLeft: 42,
                    paddingRight: 14,
                    letterSpacing: "0.2em",
                    fontWeight: 600,
                    border: captchaError
                      ? "1.5px solid #ef4444"
                      : "1.5px solid #e5e7eb",
                  }}
                  onFocus={focusStyle}
                  onBlur={blurStyle(!!captchaError)}
                />
              </div>
              {captchaError && (
                <small className="text-red-500 text-xs mt-1 block">
                  ⚠️ {captchaError}
                </small>
              )}
            </div>

            {/* Role selection (only when the same email + password matches both accounts) */}
            {roleOptions.length > 0 ? (
              <div
                className="rounded-xl p-4"
                style={{
                  border: `1px solid ${ORANGE_BORDER}`,
                  background: ORANGE_SOFT,
                }}
              >
                <p
                  className="text-sm font-semibold mb-3"
                  style={{ color: ORANGE_DEEP }}
                >
                  This email has more than one account. Sign in as:
                </p>
                <div className="flex gap-2">
                  {roleOptions.map((r) => (
                    <button
                      key={r}
                      type="button"
                      disabled={loading}
                      onClick={() => handleRoleSelect(r)}
                      className="flex-1 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        height: 44,
                        background: "#fff",
                        border: `1.5px solid ${ORANGE}`,
                        color: ORANGE_DARK,
                      }}
                    >
                      {loading ? "⏳" : ROLE_LABELS[r] || r}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  height: 48,
                  marginTop: 6,
                  background: `linear-gradient(110deg, ${ORANGE}, ${ORANGE_DARK})`,
                  boxShadow: "0 8px 22px rgba(234,88,12,0.35)",
                }}
              >
                {loading ? "⏳ Signing in..." : "Sign in →"}
              </button>
            )}
          </form>

          <p
            className="text-center text-xs mt-6"
            style={{ color: TEXT_MUTED }}
          >
            Protected by secure login · Authorized Admin & Store access only
          </p>
        </div>
      </div>
    </main>
  );
}