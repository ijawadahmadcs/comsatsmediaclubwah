"use client";

import { FormEvent, useState } from "react";
import { PASSWORD_MIN_LENGTH, getPasswordError } from "@/lib/password";

type PasswordDialogProps = {
  title: string;
  description?: string;
  onCancel: () => void;
  /** Throw an Error to keep the dialog open and show its message. */
  onSubmit: (password: string) => Promise<void>;
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none focus:border-blue-300/50";

/** Masked password entry with confirmation, replacing window.prompt() for password resets. */
export default function PasswordDialog({ title, description, onCancel, onSubmit }: PasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const passwordError = getPasswordError(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmation) {
      setError("The two passwords do not match.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(password);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to set the password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-dialog-title"
    >
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111419] p-6 text-white shadow-2xl">
        <h2 id="password-dialog-title" className="text-xl font-semibold">{title}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-white/45">{description}</p>}
        <label className="mt-6 block text-xs uppercase tracking-[0.15em] text-white/45">
          New password
          <input
            type="password"
            autoComplete="new-password"
            autoFocus
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
          />
        </label>
        <label className="mt-4 block text-xs uppercase tracking-[0.15em] text-white/45">
          Confirm password
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className={inputClassName}
          />
        </label>
        <p className="mt-3 text-xs leading-5 text-white/35">
          At least {PASSWORD_MIN_LENGTH} characters. Setting a new password signs the account out on every device.
        </p>
        {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/70 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Set password"}
          </button>
        </div>
      </form>
    </div>
  );
}
