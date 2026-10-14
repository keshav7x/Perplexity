"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PrimaryButton, TextInput } from "@/components/controls";
import { useRegister } from "@/features/auth.hooks";
import { ApiError } from "@/lib/api-client";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  age: z.coerce.number().int().min(1, "Enter a valid age").max(150),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
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
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <main className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-[15px] font-semibold tracking-tight text-primary">
            perplexity
          </p>
          <h1 className="mt-2 text-xl font-medium tracking-tight text-primary">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-secondary">
            You&apos;ll verify your email before logging in.
          </p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3 rounded-xl border border-line bg-surface p-5 shadow-lift"
        >
          <div>
            <label htmlFor="name" className="mb-1 block text-[13px] font-medium text-primary">
              Name
            </label>
            <TextInput
              id="name"
              {...register("name")}
              autoComplete="name"
              placeholder="Ada Lovelace"
              error={errors.name?.message}
            />
          </div>
          <div>
            <label htmlFor="age" className="mb-1 block text-[13px] font-medium text-primary">
              Age
            </label>
            <TextInput
              id="age"
              {...register("age", { valueAsNumber: true })}
              type="number"
              placeholder="30"
              error={errors.age?.message}
            />
          </div>
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              error={errors.password?.message}
            />
          </div>
          {registerMutation.isError && (
            <ErrorBanner
              message={
                registerMutation.error instanceof ApiError
                  ? registerMutation.error.message
                  : "Registration failed. Try again."
              }
            />
          )}
          {registerMutation.isSuccess && (
            <p className="rounded-lg border border-line bg-raised px-3 py-2 text-sm text-secondary">
              Registered — check your email for the verification link, then log in.
            </p>
          )}
          <PrimaryButton
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full"
          >
            {registerMutation.isPending ? "Creating…" : "Create account"}
          </PrimaryButton>
        </form>
        <p className="mt-4 text-center text-[13px] text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </p>
      </main>
    </div>
  );
}
