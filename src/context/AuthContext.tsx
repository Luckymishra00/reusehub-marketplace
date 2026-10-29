"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  profileImage: string | null;
  bio: string | null;
  location: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  unreadMessages: number;
  refreshUser: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  logout: () => Promise<void>;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/dashboard", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setUnreadMessages(json?.data?.stats?.unreadMessages ?? 0);
      }
    } catch {
      // ignore
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/auth/me", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setUser(json?.data?.user || null);
        await refreshUnreadCount();
      } else {
        setUser(null);
        setUnreadMessages(0);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      setUser(null);
      setUnreadMessages(0);
      showToast("Signed out of ReUseHub", "info");
    } catch {
      showToast("Error signing out", "error");
    }
  }, [showToast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        unreadMessages,
        refreshUser,
        refreshUnreadCount,
        setUser,
        logout,
        showToast,
      }}
    >
      {children}

      {/* Accessible Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-lg border transition-all duration-200 ${
              toast.type === "error"
                ? "bg-[#FDF3F2] border-[#F5C6C2] text-[#8E261B]"
                : toast.type === "info"
                ? "bg-[#FAF8F5] border-[#D6CEC2] text-[#3B2B25]"
                : "bg-[#F1F5EF] border-[#C5D6BE] text-[#2F472B]"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#B93829]" />
            ) : toast.type === "info" ? (
              <Info className="w-5 h-5 shrink-0 mt-0.5 text-[#3B2B25]" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#4E7A47]" />
            )}
            <p className="text-sm font-medium flex-1 leading-snug">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              className="text-current opacity-60 hover:opacity-100 p-0.5"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
