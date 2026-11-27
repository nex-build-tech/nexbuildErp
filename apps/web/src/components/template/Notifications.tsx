// Import Dependencies
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import {
  DocumentTextIcon,
  InboxArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "@/utils/axios";

// Local Imports
import {
  AvatarDot,
  Badge,
  Button,
} from "@/components/ui";
import AlarmIcon from "@/assets/dualicons/alarm.svg?react";

export function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "PO" | "INVENTORY">("ALL");

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        axios.get("/notifications?limit=25"),
        axios.get("/notifications/unread-count"),
      ]);
      const rawData = listRes.data?.data;
      const list = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
        ? rawData.data
        : [];
      setNotifications(list);
      setUnreadCount(countRes.data?.data?.unreadCount ?? 0);
    } catch {
      setNotifications([]);
    }
  };

  const handleMarkAsRead = async (id: number, link?: string, close?: () => void) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        Array.isArray(prev) ? prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)) : []
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (link) {
        close?.();
        navigate(link);
      }
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await axios.patch("/notifications/read-all");
      setNotifications((prev) =>
        Array.isArray(prev) ? prev.map((n) => ({ ...n, isRead: true })) : []
      );
      setUnreadCount(0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const filteredNotifications = safeNotifications.filter((n) => {
    if (!n) return false;
    if (filter === "UNREAD") return !n.isRead;
    if (filter === "PO") return n.type === "PO_APPROVAL" || n.type === "PO_SENT";
    if (filter === "INVENTORY") return n.type === "GRN_DONE" || n.type === "LOW_STOCK";
    return true;
  });

  return (
    <Popover className="relative flex">
      <PopoverButton
        as={Button}
        variant="flat"
        isIcon
        className="relative size-9 rounded-full"
        title="Notifications"
      >
        <AlarmIcon className="size-6 text-gray-900 dark:text-dark-100" />
        {unreadCount > 0 && (
          <AvatarDot
            color="error"
            isPing
            className="top-0 ltr:right-0 rtl:left-0"
          />
        )}
      </PopoverButton>
      <Transition
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 translate-y-2 scale-95"
        enterTo="opacity-100 translate-y-0 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 translate-y-0 scale-100"
        leaveTo="opacity-0 translate-y-2 scale-95"
      >
        <PopoverPanel
          anchor={{ to: "bottom end", gap: 8 }}
          className="z-70 mx-4 flex max-h-[85vh] w-[calc(100vw-2rem)] sm:w-96 flex-col rounded-2xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-2xl overflow-hidden"
        >
          {({ close }) => (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-dark-900 border-b border-slate-200 dark:border-dark-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-dark-100">
                    Notifications
                  </h3>
                  {unreadCount > 0 ? (
                    <Badge color="primary" className="h-5 rounded-full px-2 text-[10px] font-bold">
                      {unreadCount} New
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-medium">All caught up</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={loading}
                    className="text-[11px] text-[#c5a04e] hover:underline font-bold disabled:opacity-50"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 overflow-x-auto text-[11px] font-semibold text-slate-500">
                {(["ALL", "UNREAD", "PO", "INVENTORY"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                      filter === t
                        ? "bg-[#c5a04e] text-white font-bold"
                        : "hover:bg-slate-100 dark:hover:bg-dark-700"
                    }`}
                  >
                    {t === "ALL" ? "All" : t === "UNREAD" ? "Unread" : t === "PO" ? "Procurement" : "Inventory"}
                  </button>
                ))}
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-700 max-h-[360px]">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <CheckCircleIcon className="size-8 mx-auto mb-2 text-emerald-500" />
                    No notifications in this category.
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const isUnread = !notif.isRead;
                    const docLink = notif.data?.link;

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id, docLink, close)}
                        className={`p-3.5 transition cursor-pointer flex items-start gap-3 ${
                          isUnread
                            ? "bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            : "hover:bg-slate-50 dark:hover:bg-dark-750"
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {notif.type === "PO_APPROVAL" ? (
                            <div className="size-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                              <ClockIcon className="size-4.5" />
                            </div>
                          ) : notif.type === "LOW_STOCK" ? (
                            <div className="size-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                              <ExclamationTriangleIcon className="size-4.5" />
                            </div>
                          ) : notif.type === "GRN_DONE" ? (
                            <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                              <InboxArrowDownIcon className="size-4.5" />
                            </div>
                          ) : notif.type === "RA_BILL_CERTIFIED" ? (
                            <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                              <CheckBadgeIcon className="size-4.5" />
                            </div>
                          ) : (
                            <div className="size-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                              <DocumentTextIcon className="size-4.5" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className={`text-xs truncate ${isUnread ? "font-bold text-slate-900 dark:text-dark-100" : "font-medium text-slate-700 dark:text-dark-300"}`}>
                              {notif.title}
                            </h5>
                            {isUnread && (
                              <span className="size-2 rounded-full bg-[#c5a04e] shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                            <span className="text-slate-400">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-dark-700 text-slate-500 font-mono">
                              BullMQ/Queue
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 font-mono">
                              WhatsApp
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-dark-900 border-t border-slate-200 dark:border-dark-700 text-center">
                <span className="text-[11px] text-slate-400 font-medium">
                  Kings Builders &bull; Multi-Channel Alerts Active
                </span>
              </div>
            </div>
          )}
        </PopoverPanel>
      </Transition>
    </Popover>
  );
}
