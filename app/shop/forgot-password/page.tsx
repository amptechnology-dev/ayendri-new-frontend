"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { errMsg, shopApi } from "../auth";
import AuthShell, { btnCls, inputCls, Notice } from "../components/AuthShell";

function Form() {
  const sp = useSearchParams();
  const [email, setEmail] = useState(sp.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setInfo("");
    const clean = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(clean)) return setError("Enter a valid email address.");
    setLoading(true);
    try {
      const r = await shopApi.post("/api/login/reset-password-link", { email: clean });
      setInfo(r.data?.message || "Check your email for a password reset link.");
    } catch (err) {
      setError(errMsg(err, "Could not send the reset link."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Enter your email and we'll send you a reset link"
      footer={<Link href="/shop/login" className="font-bold text-[#FF8400]">Back to Log In</Link>}
    >
      <form onSubmit={submit} className="space-y-3">
        <input type="email" autoCapitalize="none" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        <Notice error={error} info={info} />
        <button type="submit" disabled={loading} className={btnCls}>{loading ? "Sending…" : "Send Reset Link"}</button>
      </form>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <Form />
    </Suspense>
  );
}