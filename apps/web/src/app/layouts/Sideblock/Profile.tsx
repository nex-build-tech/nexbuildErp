// Import Dependencies
import React from "react";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import {
  ArrowLeftStartOnRectangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { TbCoins, TbUser } from "react-icons/tb";
import { Link } from "react-router";

// Local Imports
import { Avatar, AvatarDot, type AvatarProps, Button } from "@/components/ui";
import { useAuthContext } from "@/app/contexts/auth/context";

// ----------------------------------------------------------------------

interface LinkItem {
  id: string;
  title: string;
  description: string;
  to: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: AvatarProps["initialColor"];
}

const links: LinkItem[] = [
  {
    id: "1",
    title: "Profile & Account",
    description: "User details & credentials",
    to: "/settings/general",
    Icon: TbUser,
    color: "warning",
  },
  {
    id: "2",
    title: "Appearance & Theme",
    description: "Dark mode & primary colors",
    to: "/settings/appearance",
    Icon: Cog6ToothIcon,
    color: "success",
  },
  {
    id: "3",
    title: "TDS & Billing Reports",
    description: "Statutory 194C & GST",
    to: "/dashboards/reports",
    Icon: TbCoins,
    color: "primary",
  },
];

export function Profile() {
  const { user, logout } = useAuthContext();
  const roleName = typeof user?.role === "object" ? user?.role?.name : user?.role || "Director / Boss";
  const displayName = user?.fullName || user?.username || "Kings User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Popover className="relative flex">
      <PopoverButton
        as={Avatar}
        size={9}
        role="button"
        indicator={
          <AvatarDot
            color="success"
            className="-m-0.5 size-3 ltr:right-0 rtl:left-0"
          />
        }
        className="cursor-pointer bg-[#c5a04e] text-white font-bold"
      >
        {initials}
      </PopoverButton>
      <Transition
        enter="duration-200 ease-out"
        enterFrom="translate-y-2 opacity-0"
        enterTo="translate-y-0 opacity-100"
        leave="duration-200 ease-out"
        leaveFrom="translate-y-0 opacity-100"
        leaveTo="translate-y-2 opacity-0"
      >
        <PopoverPanel
          anchor={{ to: "bottom end", gap: 12 }}
          className="border-gray-150 shadow-soft dark:border-dark-600 dark:bg-dark-700 z-70 flex w-64 flex-col rounded-lg border bg-white transition dark:shadow-none"
        >
          {({ close }: { close: () => void }) => (
            <>
              <div className="dark:bg-dark-800 flex items-center gap-4 rounded-t-lg bg-gray-100 px-4 py-5">
                <div className="size-12 rounded-xl bg-[#c5a04e] text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {initials}
                </div>
                <div className="truncate">
                  <div className="text-sm font-bold text-gray-800 dark:text-dark-100 truncate">
                    {displayName}
                  </div>
                  <p className="mt-0.5 text-xs text-amber-600 font-semibold truncate">
                    {roleName}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    @{user?.username || "kings"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col pt-2 pb-5">
                {links.map((link) => (
                  <Link
                    key={link.id}
                    to={link.to}
                    onClick={close}
                    className="group dark:hover:bg-dark-600 dark:focus:bg-dark-600 flex items-center gap-3 px-4 py-2 tracking-wide outline-hidden transition-all hover:bg-gray-100 focus:bg-gray-100"
                  >
                    <Avatar
                      size={8}
                      initialColor={link.color}
                      classNames={{ display: "rounded-lg" }}
                    >
                      <link.Icon className="size-4.5" />
                    </Avatar>
                    <div>
                      <h2 className="group-hover:text-primary-600 group-focus:text-primary-600 dark:text-dark-100 dark:group-hover:text-primary-400 dark:group-focus:text-primary-400 font-medium text-gray-800 transition-colors text-xs">
                        {link.title}
                      </h2>
                      <div className="dark:text-dark-300 truncate text-[10px] text-gray-400">
                        {link.description}
                      </div>
                    </div>
                  </Link>
                ))}
                <div className="px-4 pt-4 border-t border-gray-100 dark:border-dark-600">
                  <Button
                    color="error"
                    variant="soft"
                    onClick={() => {
                      close();
                      logout();
                    }}
                    className="w-full gap-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <ArrowLeftStartOnRectangleIcon className="size-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </PopoverPanel>
      </Transition>
    </Popover>
  );
}
