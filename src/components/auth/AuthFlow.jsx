"use client";

import { useState, useRef, useCallback, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { login, signup } from "@/app/actions/auth-actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Validation schemas ────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters").max(60),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.boolean().refine((v) => v === true, "You must accept the terms"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// ── Password strength ─────────────────────────────────────────────────────────

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH_META = [
  null,
  { label: "Weak",   color: "#ac3434", bg: "bg-error" },
  { label: "Fair",   color: "#865400", bg: "bg-tertiary" },
  { label: "Good",   color: "#006d4a", bg: "bg-secondary" },
  { label: "Strong", color: "#0053dc", bg: "bg-primary" },
];

// ── Left panel ────────────────────────────────────────────────────────────────

const PILLARS = [
  { label: "Physical",  icon: "directions_run", color: "#ef4444", streak: 12 },
  { label: "Mental",    icon: "psychology",     color: "#0053dc", streak: 8  },
  { label: "Spiritual", icon: "self_improvement", color: "#865400", streak: 21 },
  { label: "Social",    icon: "groups",         color: "#006d4a", streak: 5  },
];
const WEEK = [
  { d: "M", h: 0.78 }, { d: "T", h: 0.52 }, { d: "W", h: 0.9 },
  { d: "T", h: 0.35 }, { d: "F", h: 0.63 }, { d: "S", h: 0.2 }, { d: "S", h: 0.45 },
];

function LeftPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between h-full px-12 py-12 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg,#eef3fb 0%,#f1f4f6 60%,#e8eef5 100%)" }}
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-[0.07]"
          style={{ background: "#0053dc", filter: "blur(60px)" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-[0.06]"
          style={{ background: "#006d4a", filter: "blur(80px)" }} />
      </div>

      {/* Brand */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-primary/20"
          style={{ background: "linear-gradient(135deg,#0053dc,#3b82f6)" }}>
          <span className="material-symbols-outlined text-white" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>
            calendar_month
          </span>
        </div>
        <span style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.04em", color: "#0053dc" }}>
          SperoFlow
        </span>
      </div>

      {/* Headline */}
      <div className="relative z-10 -mt-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary/60 mb-3">
          AI-Powered Life Dashboard
        </p>
        <h2 className="text-[2.1rem] font-black text-on-surface leading-[1.18] tracking-tight mb-4">
          Your life,<br />by design.
        </h2>
        <p className="text-on-surface-variant text-sm leading-relaxed max-w-[300px]">
          Plan every day with intention. Balance your roles. Let AI guide your growth — one decision at a time.
        </p>
      </div>

      {/* Life pillars grid */}
      <div className="relative z-10 grid grid-cols-2 gap-3 mb-4">
        {PILLARS.map((p, i) => (
          <div
            key={p.label}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/60"
            style={{
              animation: `pillar-float ${2.8 + i * 0.4}s ease-in-out ${i * 0.15}s infinite`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: p.color + "15" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "15px", color: p.color, fontVariationSettings: "'FILL' 1" }}
                >
                  {p.icon}
                </span>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: p.color + "12", color: p.color }}
              >
                🔥 {p.streak}d
              </span>
            </div>
            <p className="text-[12px] font-semibold text-on-surface">{p.label}</p>
          </div>
        ))}
      </div>

      {/* Week bar chart */}
      <div className="relative z-10 bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/60">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-3">
          This week's flow
        </p>
        <div className="flex items-end gap-2 h-12">
          {WEEK.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className="w-full rounded-t-md origin-bottom"
                style={{
                  height: `${d.h * 100}%`,
                  background: `linear-gradient(to top,#0053dc,#618bff)`,
                  opacity: 0.75 + d.h * 0.25,
                  animation: `bar-grow 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s both`,
                }}
              />
              <span className="text-[9px] font-semibold text-on-surface-variant/60">{d.d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Reusable field input ──────────────────────────────────────────────────────

function Field({ label, icon, error, children, id }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-[0.09em] text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        <span
          className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none"
          style={{ fontSize: "18px" }}
          aria-hidden="true"
        >
          {icon}
        </span>
        {children}
      </div>
      {error && (
        <p role="alert" className="text-[11px] font-medium text-error flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>error</span>
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  "w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant/50 rounded-xl text-sm text-on-surface placeholder-on-surface/30 " +
  "transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed";

const inputError =
  "border-error/50 focus:border-error/70 focus:ring-error/20";

// ── Social button ─────────────────────────────────────────────────────────────

function SocialButton({ provider, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-on-surface text-xs font-semibold hover:bg-surface-container hover:border-outline-variant/70 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
      aria-label={`Continue with ${provider}`}
    >
      {icon}
      <span>{provider}</span>
    </button>
  );
}

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

// ── Success overlay ───────────────────────────────────────────────────────────

function SuccessOverlay({ message }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-lowest/95 rounded-3xl z-10 auth-success">
      <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <circle cx="18" cy="18" r="17" stroke="#006d4a" strokeWidth="2" opacity="0.3" />
          <polyline
            points="10,18 15.5,24 26,12"
            stroke="#006d4a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="60"
            strokeDashoffset="0"
            style={{ animation: "auth-check-draw 0.45s cubic-bezier(0.22,1,0.36,1) 0.1s both" }}
          />
        </svg>
      </div>
      <p className="text-sm font-bold text-secondary">{message}</p>
      <p className="text-xs text-on-surface-variant mt-1">Redirecting you now…</p>
    </div>
  );
}

// ── Login form ────────────────────────────────────────────────────────────────

function LoginForm({ onSwitch }) {
  const router = useRouter();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const emailId = useId();
  const pwId = useId();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const shakeForm = useCallback(() => {
    if (!formRef.current) return;
    formRef.current.classList.remove("auth-shake");
    void formRef.current.offsetWidth;
    formRef.current.classList.add("auth-shake");
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError("");
    try {
      const res = await login(data);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => { router.push("/calendar"); router.refresh(); }, 1200);
      } else {
        setServerError(res.error || "Invalid credentials. Please try again.");
        shakeForm();
        setLoading(false);
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
      shakeForm();
      setLoading(false);
    }
  };

  return (
    <div ref={formRef} className="relative">
      {success && <SuccessOverlay message="Welcome back!" />}

      <div className="mb-7">
        <h1 className="text-[1.6rem] font-black text-on-surface tracking-tight leading-tight">
          Welcome back
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Sign in to pick up where you left off.
        </p>
      </div>

      {/* Social login */}
      <div className="flex gap-3 mb-6">
        <SocialButton provider="Google" icon={<GoogleIcon />} onClick={() => alert("OAuth coming soon")} />
        <SocialButton provider="GitHub" icon={<GitHubIcon />} onClick={() => alert("OAuth coming soon")} />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-outline-variant/30" />
        <span className="text-[11px] font-semibold text-on-surface-variant/60 uppercase tracking-wider">or continue with email</span>
        <div className="flex-1 h-px bg-outline-variant/30" />
      </div>

      {/* Error banner */}
      {serverError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-error-container/20 border border-error/25 text-on-error-container text-xs font-medium"
        >
          <span className="material-symbols-outlined text-error flex-shrink-0" style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1" }}>error</span>
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4" aria-label="Login form">
        {/* Email */}
        <Field label="Email address" icon="mail" error={errors.email?.message} id={emailId}>
          <input
            id={emailId}
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            disabled={loading}
            className={`${inputBase} ${errors.email ? inputError : ""}`}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `${emailId}-err` : undefined}
            {...register("email")}
          />
        </Field>

        {/* Password */}
        <Field label="Password" icon="lock" error={errors.password?.message} id={pwId}>
          <input
            id={pwId}
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={loading}
            className={`${inputBase} pr-11 ${errors.password ? inputError : ""}`}
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            tabIndex={0}
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors focus:outline-none focus:text-primary"
            style={{ transform: `translateY(-50%) rotate(${showPw ? 180 : 0}deg)`, transition: "transform 0.25s ease, color 0.15s" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              {showPw ? "visibility_off" : "visibility"}
            </span>
          </button>
        </Field>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between -mt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-outline-variant/50 accent-primary cursor-pointer focus:ring-2 focus:ring-primary/30"
              {...register("remember")}
            />
            <span className="text-xs text-on-surface-variant font-medium">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-primary hover:text-primary-dim transition-colors focus:outline-none focus:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm text-on-primary bg-primary hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-primary/25 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
          aria-busy={loading}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: "17px", fontVariationSettings: "'FILL' 1" }}>login</span>
              Sign In
            </>
          )}
        </button>
      </form>

      {/* Switch to signup */}
      <p className="text-center text-sm text-on-surface-variant mt-6">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-bold text-primary hover:text-primary-dim transition-colors focus:outline-none focus:underline"
        >
          Create one free
        </button>
      </p>
    </div>
  );
}

// ── Signup form ───────────────────────────────────────────────────────────────

function SignupForm({ onSwitch }) {
  const router = useRouter();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwValue, setPwValue] = useState("");
  const nameId = useId();
  const emailId = useId();
  const pwId = useId();
  const confirmId = useId();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", terms: false },
  });

  const watchedPw = watch("password", "");

  const shakeForm = useCallback(() => {
    if (!formRef.current) return;
    formRef.current.classList.remove("auth-shake");
    void formRef.current.offsetWidth;
    formRef.current.classList.add("auth-shake");
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError("");
    try {
      const res = await signup({ email: data.email, password: data.password });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => { router.push("/calendar"); router.refresh(); }, 1400);
      } else {
        setServerError(res.error || "Failed to create account. Please try again.");
        shakeForm();
        setLoading(false);
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
      shakeForm();
      setLoading(false);
    }
  };

  const strength = getStrength(watchedPw);
  const strengthMeta = STRENGTH_META[strength];

  return (
    <div ref={formRef} className="relative">
      {success && <SuccessOverlay message="Account created!" />}

      <div className="mb-6">
        <h1 className="text-[1.6rem] font-black text-on-surface tracking-tight leading-tight">
          Start your journey
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Build the life you've been planning. It's free.
        </p>
      </div>

      {/* Social signup */}
      <div className="flex gap-3 mb-5">
        <SocialButton provider="Google" icon={<GoogleIcon />} onClick={() => alert("OAuth coming soon")} />
        <SocialButton provider="GitHub" icon={<GitHubIcon />} onClick={() => alert("OAuth coming soon")} />
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-outline-variant/30" />
        <span className="text-[11px] font-semibold text-on-surface-variant/60 uppercase tracking-wider">or with email</span>
        <div className="flex-1 h-px bg-outline-variant/30" />
      </div>

      {/* Error banner */}
      {serverError && (
        <div role="alert" className="mb-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-error-container/20 border border-error/25 text-on-error-container text-xs font-medium">
          <span className="material-symbols-outlined text-error flex-shrink-0" style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1" }}>error</span>
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3.5" aria-label="Sign up form">
        {/* Full name */}
        <Field label="Full name" icon="person" error={errors.fullName?.message} id={nameId}>
          <input
            id={nameId}
            type="text"
            placeholder="Alex Johnson"
            autoComplete="name"
            disabled={loading}
            className={`${inputBase} ${errors.fullName ? inputError : ""}`}
            aria-invalid={!!errors.fullName}
            {...register("fullName")}
          />
        </Field>

        {/* Email */}
        <Field label="Email address" icon="mail" error={errors.email?.message} id={emailId}>
          <input
            id={emailId}
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            disabled={loading}
            className={`${inputBase} ${errors.email ? inputError : ""}`}
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </Field>

        {/* Password + strength */}
        <div className="flex flex-col gap-1.5">
          <Field label="Password" icon="lock" error={errors.password?.message} id={pwId}>
            <input
              id={pwId}
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
              className={`${inputBase} pr-11 ${errors.password ? inputError : ""}`}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors focus:outline-none focus:text-primary"
              style={{ transition: "color 0.15s" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                {showPw ? "visibility_off" : "visibility"}
              </span>
            </button>
          </Field>

          {/* Strength bar */}
          {watchedPw.length > 0 && (
            <div className="flex items-center gap-2 px-0.5" role="status" aria-label={`Password strength: ${strengthMeta?.label ?? "none"}`}>
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4].map((lvl) => (
                  <div
                    key={lvl}
                    className="flex-1 h-1 rounded-full transition-all duration-300"
                    style={{
                      background: strength >= lvl && strengthMeta ? strengthMeta.color : "#dde3e7",
                    }}
                  />
                ))}
              </div>
              {strengthMeta && (
                <span className="text-[10px] font-bold" style={{ color: strengthMeta.color }}>
                  {strengthMeta.label}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Confirm password */}
        <Field label="Confirm password" icon="lock_reset" error={errors.confirmPassword?.message} id={confirmId}>
          <input
            id={confirmId}
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={loading}
            className={`${inputBase} pr-11 ${errors.confirmPassword ? inputError : ""}`}
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors focus:outline-none focus:text-primary"
            style={{ transition: "color 0.15s" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              {showConfirm ? "visibility_off" : "visibility"}
            </span>
          </button>
        </Field>

        {/* Terms */}
        <div>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 rounded border-outline-variant/50 accent-primary cursor-pointer flex-shrink-0 focus:ring-2 focus:ring-primary/30"
              disabled={loading}
              {...register("terms")}
            />
            <span className="text-xs text-on-surface-variant leading-relaxed">
              I agree to the{" "}
              <Link href="/terms" className="font-semibold text-primary hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>
            </span>
          </label>
          {errors.terms && (
            <p role="alert" className="text-[11px] font-medium text-error mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>error</span>
              {errors.terms.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm text-on-primary bg-primary hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-primary/25 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
          aria-busy={loading}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: "17px", fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
              Create My Account
            </>
          )}
        </button>
      </form>

      {/* Switch to login */}
      <p className="text-center text-sm text-on-surface-variant mt-5">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-bold text-primary hover:text-primary-dim transition-colors focus:outline-none focus:underline"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}

// ── Root exported component ───────────────────────────────────────────────────

export default function AuthFlow({ initialMode = "login" }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [animClass, setAnimClass] = useState("auth-in-right");

  const switchTo = useCallback(
    (next) => {
      if (next === mode) return;
      const exitClass = next === "signup" ? "auth-out-left" : "auth-out-right";
      const enterClass = next === "signup" ? "auth-in-right" : "auth-in-left";
      setAnimClass(exitClass);
      setTimeout(() => {
        setMode(next);
        setAnimClass(enterClass);
        router.replace(next === "signup" ? "/signup" : "/login", { scroll: false });
      }, 220);
    },
    [mode, router]
  );

  return (
    <div className="min-h-screen h-screen w-full flex bg-surface overflow-hidden">
      {/* Left decorative panel — lg+ */}
      <div className="hidden lg:block lg:w-[52%] flex-shrink-0">
        <LeftPanel />
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto px-6 py-10 sm:px-10 bg-surface-container-low/40">
        {/* Top-left brand on mobile only */}
        <div className="lg:hidden flex items-center gap-2 mb-8 self-start">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg,#0053dc,#3b82f6)" }}
          >
            <span
              className="material-symbols-outlined text-white"
              style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1" }}
            >
              calendar_month
            </span>
          </div>
          <span style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.04em", color: "#0053dc" }}>
            SperoFlow
          </span>
        </div>

        {/* Form card */}
        <div
          className={`w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/20 p-8 sm:p-10 ${animClass}`}
          style={{ animationDuration: "0.3s" }}
        >
          {mode === "login" ? (
            <LoginForm onSwitch={() => switchTo("signup")} />
          ) : (
            <SignupForm onSwitch={() => switchTo("login")} />
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-[11px] text-on-surface-variant/50 text-center">
          © {new Date().getFullYear()} SperoFlow · Built with intention.
        </p>
      </div>
    </div>
  );
}
