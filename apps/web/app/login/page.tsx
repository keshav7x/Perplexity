"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLogin } from "@/features/auth.hooks";
import { ApiError } from "@/lib/api-client";

const schema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    login.mutate(values, { onSuccess: () => router.replace("/") });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 text-zinc-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-ink-700 bg-ink-900 p-6"
      >
        <h1 className="text-xl font-semibold">Welcome back</h1>
        <div>
          <input
            {...register("email")}
            type="email"
            placeholder="Email"
            className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm outline-none focus:border-accent-500"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>
        <div>
          <input
            {...register("password")}
            type="password"
            placeholder="Password"
            className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm outline-none focus:border-accent-500"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>
        {login.isError && (
          <p className="text-sm text-red-400">
            {login.error instanceof ApiError
              ? login.error.message
              : "Login failed"}
          </p>
        )}
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full rounded-lg bg-accent-500 py-2 text-sm font-medium text-black hover:bg-accent-400 disabled:opacity-50"
        >
          {login.isPending ? "Logging in…" : "Log in"}
        </button>
        <p className="text-center text-xs text-zinc-400">
          No account?{" "}
          <Link href="/register" className="text-accent-400 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
