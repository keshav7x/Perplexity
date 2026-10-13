"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRegister } from "@/features/auth.hooks";
import { ApiError } from "@/lib/api-client";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  age: z.coerce.number().int().min(1, "Age is required").max(150),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Min 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    registerMutation.mutate(values, {
      onSuccess: () => router.push("/login"),
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 text-zinc-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-ink-700 bg-ink-900 p-6"
      >
        <h1 className="text-xl font-semibold">Create account</h1>
        <p className="-mt-2 text-xs text-zinc-400">
          You will receive a verification email before you can log in.
        </p>
        <div>
          <input
            {...register("name")}
            placeholder="Name"
            className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm outline-none focus:border-accent-500"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>
        <div>
          <input
            {...register("age", { valueAsNumber: true })}
            type="number"
            placeholder="Age"
            className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm outline-none focus:border-accent-500"
          />
          {errors.age && (
            <p className="mt-1 text-xs text-red-400">{errors.age.message}</p>
          )}
        </div>
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
        {registerMutation.isError && (
          <p className="text-sm text-red-400">
            {registerMutation.error instanceof ApiError
              ? registerMutation.error.message
              : "Registration failed"}
          </p>
        )}
        {registerMutation.isSuccess && (
          <p className="text-sm text-emerald-400">
            Registered — check your email, then log in.
          </p>
        )}
        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full rounded-lg bg-accent-500 py-2 text-sm font-medium text-black hover:bg-accent-400 disabled:opacity-50"
        >
          {registerMutation.isPending ? "Creating…" : "Register"}
        </button>
        <p className="text-center text-xs text-zinc-400">
          Have an account?{" "}
          <Link href="/login" className="text-accent-400 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
