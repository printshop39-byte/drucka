"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  // TODO: wire this form to a real auth backend. Currently a front-end placeholder.
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setDone(true);
    setTimeout(() => router.push("/"), 900);
  }

  return (
    <>
      <Navbar active="login" />
      <main className="flex-1 flex items-center justify-center px-[22px] py-12 min-h-[70vh]">
        <div className="w-full max-w-[420px] bg-white border border-brand-border rounded-premium shadow-soft p-[36px_30px]">
          <span className="eyebrow">Account</span>
          <h1 className="text-[1.9rem] my-[14px_4px]">Welcome back</h1>
          <p className="text-brand-muted text-[0.92rem] mb-6">Log in to track orders, save designs and check out faster.</p>

          <form onSubmit={submit}>
            <div className="mb-4">
              <label className="block text-[0.82rem] font-bold mb-[7px]" htmlFor="email">Email or Phone</label>
              <input id="email" className="input-premium" type="text" placeholder="you@example.com" autoComplete="username" required />
            </div>
            <div className="mb-4">
              <label className="block text-[0.82rem] font-bold mb-[7px]" htmlFor="pass">Password</label>
              <input id="pass" className="input-premium" type="password" placeholder="••••••••" autoComplete="current-password" required />
            </div>
            <button type="submit" className="btn-primary w-full mt-[6px]" style={done ? { background: "linear-gradient(135deg,#08483B,#06382F)" } : undefined}>
              {done ? "✓ Logged In (demo)" : "Log In →"}
            </button>
          </form>

          <p className="text-center mt-[18px] text-[0.88rem] text-brand-muted">New to Drucka? <Link href="/" className="text-brand-primary font-bold">Start customizing</Link></p>
          <div className="mt-5 bg-brand-mint border border-brand-border rounded-[0.8rem] p-[12px_14px] text-[0.8rem] text-brand-muted">
            This is a demo login page. Account features are coming soon — meanwhile you can browse, customize and order as a guest.
          </div>
        </div>
      </main>
    </>
  );
}
