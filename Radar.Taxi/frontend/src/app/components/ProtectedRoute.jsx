"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";

/**
 * ✅ Public routes which should NEVER be protected
 * (avoid infinite redirect loops)
 */
const PUBLIC_ROUTES = ["/auth", "/forgot-password"];

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const router = useRouter();
  const pathname = usePathname();

  const { user, authChecked, isAuthenticated, loading } = useSelector(
    (state) => state.auth
  );

  const isRedirectingRef = useRef(false);

  useEffect(() => {
    // ⏳ Wait until auth status is checked
    if (!authChecked) return;

    if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) return;

    // 🔐 Not authenticated → redirect to login
    if (!isAuthenticated && !isRedirectingRef.current) {
      isRedirectingRef.current = true;
      router.replace("/auth/login");
      return;
    }

    // 🚫 Role not allowed → unauthorized page
    if (
      isAuthenticated &&
      allowedRoles.length > 0 &&
      !allowedRoles.includes(user?.role) &&
      !isRedirectingRef.current
    ) {
      isRedirectingRef.current = true;
      router.replace("/unauthorized");
    }
  }, [
    authChecked,
    isAuthenticated,
    user,
    allowedRoles,
    pathname,
    router,
  ]);

  // ⏳ Loading state (prevents flicker)
  if (!authChecked || loading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        ⏳ Checking authorization...
      </div>
    );
  }

  // ✅ Authorized → render content
  if (
    isAuthenticated &&
    (allowedRoles.length === 0 || allowedRoles.includes(user?.role))
  ) {
    return <>{children}</>;
  }

  // ❌ Unauthorized → render nothing (redirect already handled)
  return null;
};

export default ProtectedRoute;

