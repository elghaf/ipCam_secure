'use client';

import { auth } from "@/lib/firebase";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      await auth.signOut();
      router.push('/login');
    };

    handleLogout();
  }, [router]);

  return null;
} 