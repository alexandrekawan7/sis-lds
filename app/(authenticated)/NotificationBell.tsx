"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function NotificationBell() {
  const router = useRouter();
  const trpc = useTRPC();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], refetch } = useQuery({
    ...trpc.notification.list.queryOptions(),
    refetchInterval: 5000,
  });

  const markAsReadMutation = useMutation(
    trpc.notification.markAsRead.mutationOptions({
      onSuccess: () => refetch(),
    })
  );

  const markAllAsReadMutation = useMutation(
    trpc.notification.markAllAsRead.mutationOptions({
      onSuccess: () => refetch(),
    })
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsReadMutation.mutateAsync({ id: notification.id });
    }
    setIsOpen(false);
    if (notification.link) {
      router.push(notification.link);

      setTimeout(() => {
        if (notification.link.includes("#")) {
          const hash = notification.link.substring(notification.link.indexOf("#"));
          const el = document.querySelector(hash);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-4", "ring-[#2ea03b]", "ring-offset-2", "transition-shadow", "duration-1000");
            setTimeout(() => el.classList.remove("ring-4", "ring-[#2ea03b]", "ring-offset-2"), 3000);
          }
        }
      }, 200);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#555] shadow-sm transition hover:bg-gray-50 focus:outline-none"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-14 z-50 w-80 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs font-medium text-[#2ea03b] hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-96 space-y-2 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                Você não tem notificações.
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full rounded-xl p-3 text-left transition hover:bg-gray-50 ${
                    !notification.read ? "bg-green-50/50" : ""
                  }`}
                >
                  <p
                    className={`text-sm ${
                      !notification.read ? "font-semibold text-gray-900" : "text-gray-600"
                    }`}
                  >
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(notification.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
