// Import Dependencies
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
import { TbUser, TbCoins } from "react-icons/tb";
import { Link } from "react-router";

// Local Imports
import { Avatar, AvatarDot, Button } from "@/components/ui";
import { ColorType } from "@/constants/app";
import { useAuthContext } from "@/app/contexts/auth/context";

// Define Link Types
interface LinkItem {
  id: string;
  title: string;
  description: string;
  to: string;
  Icon: React.ElementType;
  color: ColorType;
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

// ----------------------------------------------------------------------

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
    <Popover className="relative">
      <PopoverButton
        as={Avatar}
        size={12}
        role="button"
        alt={displayName}
        indicator={
          <AvatarDot color="success" className="ltr:right-0 rtl:left-0" />
        }
        className="cursor-pointer bg-[#c5a04e] text-white font-bold"
      >
        {initials}
      </PopoverButton>
      <Transition
        enter="duration-200 ease-out"
        enterFrom="translate-x-2 opacity-0"
        enterTo="translate-x-0 opacity-100"
        leave="duration-200 ease-out"
        leaveFrom="translate-x-0 opacity-100"
        leaveTo="translate-x-2 opacity-0"
      >
        <PopoverPanel
          anchor={{ to: "right end", gap: 12 }}
          className="z-70 flex w-64 flex-col rounded-lg border border-gray-150 bg-white shadow-soft transition dark:border-dark-600 dark:bg-dark-700 dark:shadow-none"
        >
          {({ close }) => (
            <>
              {/* User Info */}
              <div className="flex items-center gap-4 rounded-t-lg bg-gray-100 px-4 py-5 dark:bg-dark-800">
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

              {/* Navigation Links */}
              <div className="flex flex-col pb-5 pt-2">
                {links.map((link) => (
                  <Link
                    key={link.id}
                    to={link.to}
                    onClick={() => close()}
                    className="group flex items-center gap-3 px-4 py-2 tracking-wide outline-hidden transition-all hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-dark-600 dark:focus:bg-dark-600"
                  >
                    <Avatar
                      size={8}
                      initialColor={link.color}
                      classNames={{ display: "rounded-lg" }}
                    >
                      <link.Icon className="size-4.5" />
                    </Avatar>
                    <div>
                      <h2 className="font-medium text-gray-800 transition-colors group-hover:text-primary-600 group-focus:text-primary-600 dark:text-dark-100 dark:group-hover:text-primary-400 dark:group-focus:text-primary-400 text-xs">
                        {link.title}
                      </h2>
                      <div className="truncate text-[10px] text-gray-400 dark:text-dark-300">
                        {link.description}
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Logout Button */}
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
