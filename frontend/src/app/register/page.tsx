'use client';

import { AuthForm } from "@/components/AuthForm";

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-muted-foreground">Sign up for SecureWatch Pro</p>
        </div>
        <AuthForm mode="register" />
      </div>
    </div>
  );
} 