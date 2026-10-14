"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PrimaryButton, TextInput } from "@/components/controls";
import { useLogin } from "@/features/auth.hooks";
import { ApiError } from "@/lib/api-client";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
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
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <main className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-[15px] font-semibold tracking-tight text-primary">
            perplexity
          </p>
          <h1 className="mt-2 text-xl font-medium tracking-tight text-primary">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Log in to continue researching.
          </p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3 rounded-xl border border-line bg-surface p-5 shadow-lift"
        >
          <div>
            <label htmlFor="email" className="mb-1 block text-[13px] font-medium text-primary">
              Email
            </label>
            <TextInput
              id="email"
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-[13px] font-medium text-primary">
              Password
            </label>
            <TextInput
              id="password"
              {...register("password")}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
            />
          </div>
          {login.isError && (
            <ErrorBanner
              message={
                login.error instanceof ApiError
                  ? login.error.message
                  : "Login failed. Try again."
              }
            />
          )}
          <PrimaryButton type="submit" disabled={login.isPending} className="w-full">
            {login.isPending ? "Logging in…" : "Log in"}
          </PrimaryButton>
        </form>
        <p className="mt-4 text-center text-[13px] text-secondary">
          No account?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Create one
          </Link>
        </p>
      </main>
    </div>
  );
}
