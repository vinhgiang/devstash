'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => null);

    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Package className="size-6 text-primary" />
            <span className="font-semibold text-xl">DevStash</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot your password?</CardTitle>
            <CardDescription>
              {submitted
                ? "Check your inbox for the reset link."
                : "Enter your email and we'll send you a reset link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <p className="text-sm text-muted-foreground">
                If an account with that email exists, a password reset link has been sent. It
                expires in 24 hours.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link href="/sign-in" className="text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
