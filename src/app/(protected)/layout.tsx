import UserGuard from '../providers/UserGuard';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserGuard>{children}</UserGuard>;
} 