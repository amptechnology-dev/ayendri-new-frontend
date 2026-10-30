"use client";
import { useState } from "react";
import { apiError, changePassword, updateProfile } from "../profile-api";

type U = { name?: string; email?: string; phone?: string };

export default function ProfileForm({
  user,
  onUpdated,
}: {
  user: U;
  onUpdated?: (v: { name: string; phone: string }) => void | Promise<void>;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async () => {
    const n = name.trim();
    const ph = phone.trim();
    if (!n) return setMsg({ ok: false, text: "Enter your name." });
    if (ph && ph.length < 10)
      return setMsg({ ok: false, text: "Phone number must be at least 10 digits." });
    setSaving(true);
    setMsg(null);
    try {
      await updateProfile({ name: n, phone: ph || undefined });
      await onUpdated?.({ name: n, phone: ph });
      setMsg({ ok: true, text: "Profile updated." });
    } catch (e) {
      setMsg({ ok: false, text: apiError(e, "Could not update profile.") });
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (!pw.current || !pw.next || !pw.confirm)
      return setPwMsg({ ok: false, text: "Fill in all three password fields." });
    if (pw.next.length < 6)
      return setPwMsg({ ok: false, text: "New password must be at least 6 characters." });
    if (pw.next !== pw.confirm)
      return setPwMsg({ ok: false, text: "Passwords don't match." });
    setSavingPw(true);
    setPwMsg(null);
    try {
      await changePassword({
        currentPassword: pw.current,
        newPassword: pw.next,
        confirmPassword: pw.confirm,
      });
      setPw({ current: "", next: "", confirm: "" });
      setPwMsg({ ok: true, text: "Password changed." });
    } catch (e) {
      setPwMsg({ ok: false, text: apiError(e, "Could not change password.") });
    } finally {
      setSavingPw(false);
    }
  };

  const input =
    "mt-1 block w-full rounded-xl border border-[#e4cfae] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#a3161c]";
  const label = "block text-sm font-bold text-[#4a0710]";
  const note = (m: { ok: boolean; text: string } | null) =>
    m && (
      <p className={`mt-3 text-sm font-semibold ${m.ok ? "text-green-700" : "text-red-600"}`}>
        {m.text}
      </p>
    );

  return (
    <div className="space-y-6">
      <section className="shop-card p-5">
        <h2 className="text-lg font-black text-[#4a0710]">Personal info</h2>
        <div className="mt-4 space-y-4">
          <label className={label}>
            Name
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </label>
          <label className={label}>
            Email
            <input className={`${input} bg-[#fbf3ec] text-[#6b4a4a]`} value={user?.email ?? ""} readOnly />
          </label>
          <label className={label}>
            Phone
            <input
              className={input}
              value={phone}
              inputMode="tel"
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
              placeholder="Phone number"
            />
          </label>
        </div>
        {note(msg)}
        <button
          onClick={saveProfile}
          disabled={saving}
          className="shop-gold-btn mt-5 rounded-full px-8 py-3 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </section>

      <section className="shop-card p-5">
        <h2 className="text-lg font-black text-[#4a0710]">Change password</h2>
        <div className="mt-4 space-y-4">
          <label className={label}>
            Current password
            <input type="password" className={input} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </label>
          <label className={label}>
            New password
            <input type="password" className={input} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="At least 6 characters" />
          </label>
          <label className={label}>
            Confirm new password
            <input type="password" className={input} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </label>
        </div>
        {note(pwMsg)}
        <button
          onClick={savePassword}
          disabled={savingPw}
          className="mt-5 rounded-full border-2 border-[#a3161c] px-8 py-3 font-bold text-[#a3161c] disabled:opacity-60"
        >
          {savingPw ? "Updating..." : "Update password"}
        </button>
      </section>
    </div>
  );
}