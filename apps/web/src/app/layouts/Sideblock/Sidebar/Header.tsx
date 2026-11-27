// Import Dependencies
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

// Local Imports
import { CoBrandLogo } from "@/components/shared/CoBrandLogo";
import { Button } from "@/components/ui";
import { useSidebarContext } from "@/app/contexts/sidebar/context";

// ----------------------------------------------------------------------

export function Header() {
  const { close } = useSidebarContext();
  return (
    <header className="relative flex h-[65px] shrink-0 items-center justify-between ltr:pl-4 ltr:pr-3 rtl:pl-3 rtl:pr-4 border-b border-slate-100 dark:border-dark-750">
      <div className="flex items-center justify-start pt-1">
        <CoBrandLogo variant="header" />
      </div>
      <div className="pt-1 xl:hidden">
        <Button
          onClick={close}
          variant="flat"
          isIcon
          className="size-6 rounded-full"
        >
          <ChevronLeftIcon className="size-5 rtl:rotate-180" />
        </Button>
      </div>
    </header>
  );
}
