'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface FormState {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

interface FieldError {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(data: FormState): FieldError {
  const errors: FieldError = {};

  if (!data.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = 'Enter a valid email';

  if (!data.username.trim()) errors.username = 'Username is required';
  else if (data.username.length < 3)
    errors.username = 'Minimum 3 characters';
  else if (data.username.length > 50)
    errors.username = 'Maximum 50 characters';
  else if (!/^[a-zA-Z0-9_-]+$/.test(data.username))
    errors.username = 'Only letters, numbers, _ and - allowed';

  if (!data.password) errors.password = 'Password is required';
  else if (data.password.length < 8)
    errors.password = 'Minimum 8 characters';

  if (!data.confirmPassword)
    errors.confirmPassword = 'Please confirm your password';
  else if (data.password !== data.confirmPassword)
    errors.confirmPassword = 'Passwords do not match';

  return errors;
}

export default function RegisterPage() {
  const { register } = useAuth();

  const [form, setForm] = useState<FormState>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FieldError]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');

    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await register(form.email, form.username, form.password);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Registration failed. Please try again.';
      setServerError(typeof msg === 'string' ? msg : 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Create an account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start building your developer OS
        </p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className={`w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring ${
              errors.email ? 'border-red-500' : 'border-border'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Username */}
        <div>
          <label
            htmlFor="username"
            className="mb-1.5 block text-sm font-medium"
          >
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={form.username}
            onChange={handleChange}
            placeholder="devuser"
            className={`w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring ${
              errors.username ? 'border-red-500' : 'border-border'
            }`}
          />
          {errors.username && (
            <p className="mt-1 text-xs text-red-500">{errors.username}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring ${
              errors.password ? 'border-red-500' : 'border-border'
            }`}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm font-medium"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring ${
              errors.confirmPassword ? 'border-red-500' : 'border-border'
            }`}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
