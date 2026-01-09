'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkAuthRateLimit, recordAuthFailure } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  companyName: z.string().min(1, 'Company name is required').max(100),
});

export interface AuthResult {
  error?: string;
}

export async function login(formData: FormData): Promise<AuthResult> {
  const rateLimit = await checkAuthRateLimit();
  if (!rateLimit.allowed) {
    return {
      error: 'Too many login attempts. Please try again in 15 minutes.',
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    await recordAuthFailure();
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const rateLimit = await checkAuthRateLimit();
  if (!rateLimit.allowed) {
    return {
      error: 'Too many signup attempts. Please try again in 15 minutes.',
    };
  }

  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    companyName: formData.get('companyName'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        company_name: parsed.data.companyName,
      },
    },
  });

  if (error) {
    await recordAuthFailure();
    return { error: error.message };
  }

  redirect('/dashboard');
}
