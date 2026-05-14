'use client';

import { useEffect, useRef } from 'react';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

type ToastKind = 'success' | 'error';

interface QueryToast {
  param: string;
  matchValue?: string;
  kind: ToastKind;
  message: string | ((value: string) => string);
}

const QUERY_TOASTS: QueryToast[] = [
  {
    param: 'registered',
    matchValue: '1',
    kind: 'success',
    message: 'Account created. Check your email to verify your address.',
  },
  {
    param: 'registered_direct',
    matchValue: '1',
    kind: 'success',
    message: 'Account created. You can now sign in.',
  },
  {
    param: 'verified',
    matchValue: '1',
    kind: 'success',
    message: 'Email verified. You can now sign in.',
  },
  {
    param: 'error',
    matchValue: 'verify_expired',
    kind: 'error',
    message: 'That verification link has expired. Please register again or request a new email.',
  },
  {
    param: 'error',
    matchValue: 'verify_invalid',
    kind: 'error',
    message: 'That verification link is invalid or has already been used.',
  },
  {
    param: 'password_reset',
    matchValue: '1',
    kind: 'success',
    message: 'Password updated. You can now sign in with your new password.',
  },
];

function findMatch(params: ReadonlyURLSearchParams): QueryToast | null {
  for (const t of QUERY_TOASTS) {
    const value = params.get(t.param);
    if (value === null) continue;
    if (t.matchValue !== undefined && value !== t.matchValue) continue;
    return t;
  }
  return null;
}

export function useSignInQueryToasts() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;

    const match = findMatch(searchParams);
    if (!match) return;

    shown.current = true;

    const value = searchParams.get(match.param)!;
    const message = typeof match.message === 'function' ? match.message(value) : match.message;
    toast[match.kind](message);

    const next = new URLSearchParams(searchParams.toString());
    next.delete(match.param);
    const query = next.toString();
    router.replace(query ? `/sign-in?${query}` : '/sign-in');
  }, [searchParams, router]);
}

const SIGN_IN_ERROR_MESSAGES: Record<string, string> = {
  email_not_verified:
    'Please verify your email before signing in. Check your inbox for the verification link.',
  rate_limited:
    'Too many sign-in attempts. Please wait a few minutes before trying again.',
};

export function getSignInErrorMessage(code: string | undefined): string {
  if (code && SIGN_IN_ERROR_MESSAGES[code]) return SIGN_IN_ERROR_MESSAGES[code];
  return 'Invalid email or password.';
}
