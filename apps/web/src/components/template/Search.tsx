// Import Dependencies
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  ChevronRightIcon,
  CurrencyRupeeIcon,
  ShoppingBagIcon,
  TagIcon,
  TruckIcon,
  CircleStackIcon,
  BriefcaseIcon,
  CalculatorIcon,
  DocumentChartBarIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  Squares2X2Icon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  ChartBarSquareIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router";
import { useHotkeys } from "react-hotkeys-hook";
import axios from "@/utils/axios";

// Local Imports
import { Avatar, Button, Input } from "@/components/ui";
import { useDisclosure, useFuse } from "@/hooks";
import { useThemeContext } from "@/app/contexts/theme/context";
import { useAuthContext } from "@/app/contexts/auth/context";
import { createScopedKeydownHandler } from "@/utils/dom/createScopedKeydownHandler";
import { getNavigationForRole, isSalesRole } from "@/app/navigation";
import { Highlight } from "@/components/shared/Highlight";
import { settings } from "@/app/navigation/segments/settings";
import { ColorType } from "@/constants/app";
import { NavigationTree } from "@/@types/navigation";

// ----------------------------------------------------------------------

interface PopularSearchItem {
  id: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  color: ColorType;
  to: string;
}

interface SearchProps {
  renderButton?: (openFn: () => void) => React.ReactNode;
}

interface SearchDialogProps {
  close: () => void;
}

const constructionShortcuts: PopularSearchItem[] = [
  {
    id: "0",
    Icon: TagIcon,
    title: "Items / SKUs",
    color: "primary",
    to: "/masters/items",
  },
  {
    id: "1",
    Icon: TruckIcon,
    title: "Vendors",
    color: "info",
    to: "/masters/vendors",
  },
  {
    id: "2",
    Icon: ShoppingBagIcon,
    title: "Purchase Orders",
    color: "warning",
    to: "/procurement/pos",
  },
  {
    id: "3",
    Icon: CircleStackIcon,
    title: "Stock Valuation",
    color: "success",
    to: "/inventory/stock",
  },
  {
    id: "4",
    Icon: BriefcaseIcon,
    title: "Work Orders",
    color: "secondary",
    to: "/contractors/work-orders",
  },
  {
    id: "5",
    Icon: CalculatorIcon,
    title: "RA Bills & MB",
    color: "error",
    to: "/contractors/ra-bills",
  },
  {
    id: "6",
    Icon: DocumentChartBarIcon,
    title: "TDS Register",
    color: "primary",
    to: "/dashboards/reports",
  },
];

const salesShortcuts: PopularSearchItem[] = [
  {
    id: "s0",
    Icon: ChartBarSquareIcon,
    title: "Sales Dashboard",
    color: "primary",
    to: "/realty/dashboard",
  },
  {
    id: "s1",
    Icon: UserGroupIcon,
    title: "Lead Pipeline",
    color: "info",
    to: "/realty/leads",
  },
  {
    id: "s2",
    Icon: CalendarDaysIcon,
    title: "Follow-ups & Calls",
    color: "warning",
    to: "/realty/followups",
  },
  {
    id: "s3",
    Icon: BuildingOfficeIcon,
    title: "Site Visits",
    color: "success",
    to: "/realty/site-visits",
  },
  {
    id: "s4",
    Icon: Squares2X2Icon,
    title: "Inventory Stacking Grid",
    color: "secondary",
    to: "/realty/inventory",
  },
  {
    id: "s5",
    Icon: DocumentTextIcon,
    title: "Cost Sheets & Quotations",
    color: "primary",
    to: "/realty/cost-sheets",
  },
  {
    id: "s6",
    Icon: ClipboardDocumentCheckIcon,
    title: "Bookings & Allotments",
    color: "error",
    to: "/realty/bookings",
  },
];

export function Search({ renderButton }: SearchProps) {
  const [isOpen, { open, close }] = useDisclosure(false);

  useHotkeys("/", () => open(), {
    ignoreModifiers: true,
    preventDefault: true,
  });

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden sm:px-5 sm:py-6"
          onClose={close}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40" />
          </TransitionChild>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="dark:bg-dark-750 relative flex h-full w-full max-w-xl origin-bottom flex-col bg-white transition-all duration-300 sm:max-h-[640px] sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-dark-600 overflow-hidden">
              <SearchDialog close={close} />
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>

      {renderButton ? renderButton(open) : null}
    </>
  );
}

const searchInput = Math.random().toString(36).substring(2, 11);

export function SearchDialog({ close }: SearchDialogProps) {
  const { isDark } = useThemeContext();
  const { user, tenant } = useAuthContext();
  const isSales = isSalesRole(user?.role);
  const activeShortcuts = isSales ? salesShortcuts : constructionShortcuts;

  const roleNavData = useMemo(() => {
    return flattenNav([...getNavigationForRole(user?.role, tenant?.modules), settings]);
  }, [user?.role, tenant?.modules]);

  const searchInputId = useRef(`search-input-${searchInput}`).current;
  const { result, query, setQuery } = useFuse(roleNavData, {
    keys: ["title"],
    threshold: 0.2,
    matchAllOnEmptyQuery: false,
  });

  const [dbResults, setDbResults] = useState<{
    items: any[];
    vendors: any[];
    purchaseOrders: any[];
    workOrders: any[];
    contractors: any[];
  }>({
    items: [],
    vendors: [],
    purchaseOrders: [],
    workOrders: [],
    contractors: [],
  });

  const [searchingDb, setSearchingDb] = useState(false);

  useEffect(() => {
    const inputElement = document.getElementById(
      searchInputId,
    ) as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  }, [searchInputId]);

  // Real-time backend search across materials, vendors, POs (non-sales only)
  useEffect(() => {
    if (isSales || !query || query.trim().length < 2) {
      setDbResults({ items: [], vendors: [], purchaseOrders: [], workOrders: [], contractors: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingDb(true);
      try {
        const res = await axios.get(`/dashboard/global-search?q=${encodeURIComponent(query.trim())}`);
        setDbResults(res.data?.data || { items: [], vendors: [], purchaseOrders: [], workOrders: [], contractors: [] });
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setSearchingDb(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const hasDbResults =
    (dbResults.items?.length || 0) +
    (dbResults.vendors?.length || 0) +
    (dbResults.purchaseOrders?.length || 0) +
    (dbResults.workOrders?.length || 0) +
    (dbResults.contractors?.length || 0) > 0;

  return (
    <div data-search-wrapper className="flex flex-col h-full overflow-hidden">
      {/* Top Search Input */}
      <div className="dark:bg-dark-800 bg-slate-100 p-3 border-b border-slate-200 dark:border-dark-700">
        <div className="flex items-center justify-between gap-2">
          <Input
            id={searchInputId}
            placeholder="Search items, vendors, POs, contractors, work orders..."
            value={query}
            data-search-item
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setQuery(event.target.value)
            }
            classNames={{ root: "flex-1", input: "border-none text-sm bg-transparent" }}
            prefix={<MagnifyingGlassIcon className="size-5 text-[#c5a04e]" />}
            onKeyDown={createScopedKeydownHandler({
              siblingSelector: "[data-search-item]",
              parentSelector: "[data-search-wrapper]",
              activateOnFocus: false,
              loop: true,
              orientation: "vertical",
            })}
          />
          <Button
            onClick={close}
            variant={isDark ? "filled" : "outlined"}
            className="px-2.5 py-1 text-xs font-mono font-semibold"
          >
            ESC
          </Button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* State A: Empty Query -> Construction Launchpad */}
        {query === "" && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Quick Navigation Shortcuts
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {activeShortcuts.map(({ id, to, Icon, title, color }) => (
                <Link
                  key={id}
                  to={to}
                  onClick={close}
                  className="p-3 rounded-xl border border-slate-200 dark:border-dark-700 hover:border-[#c5a04e] hover:bg-amber-50/30 dark:hover:bg-dark-700 transition flex items-center gap-3 text-start"
                >
                  <Avatar
                    size={8}
                    initialColor={color}
                    classNames={{ display: "rounded-lg" }}
                  >
                    <Icon className="size-4 stroke-2" />
                  </Avatar>
                  <span className="text-xs font-semibold text-slate-800 dark:text-dark-100 truncate">
                    {title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* State B: Live Database Matches */}
        {query !== "" && (
          <div className="space-y-4">
            {searchingDb && (
              <div className="text-xs text-slate-400 italic">
                Searching BuildERP database...
              </div>
            )}

            {/* Items / Materials */}
            {dbResults.items?.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TagIcon className="size-3.5" /> Items &amp; Materials ({dbResults.items.length})
                </h4>
                <div className="space-y-1.5">
                  {dbResults.items.map((it: any) => (
                    <Link
                      key={it.id}
                      to="/masters/items"
                      onClick={close}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-dark-700 hover:bg-amber-50/50 dark:hover:bg-dark-650 border border-slate-200 dark:border-dark-600 flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-dark-100">{it.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Code: {it.code} &bull; Brand: {it.brand || "Standard"}</div>
                      </div>
                      <ChevronRightIcon className="size-4 text-slate-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Vendors & Suppliers */}
            {dbResults.vendors?.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TruckIcon className="size-3.5" /> Suppliers &amp; Vendors ({dbResults.vendors.length})
                </h4>
                <div className="space-y-1.5">
                  {dbResults.vendors.map((v: any) => (
                    <Link
                      key={v.id}
                      to="/masters/vendors"
                      onClick={close}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-dark-700 hover:bg-blue-50/50 dark:hover:bg-dark-650 border border-slate-200 dark:border-dark-600 flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-dark-100">{v.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">GSTIN: {v.gstin || "N/A"} &bull; Phone: {v.phone || "N/A"}</div>
                      </div>
                      <ChevronRightIcon className="size-4 text-slate-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase Orders */}
            {dbResults.purchaseOrders?.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CurrencyRupeeIcon className="size-3.5" /> Purchase Orders ({dbResults.purchaseOrders.length})
                </h4>
                <div className="space-y-1.5">
                  {dbResults.purchaseOrders.map((po: any) => (
                    <Link
                      key={po.id}
                      to="/procurement/pos"
                      onClick={close}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-dark-700 hover:bg-emerald-50/50 dark:hover:bg-dark-650 border border-slate-200 dark:border-dark-600 flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <div className="font-bold font-mono text-slate-900 dark:text-dark-100">{po.poNumber}</div>
                        <div className="text-[11px] text-slate-500">Vendor: {po.vendorName} &bull; Total: ₹{Number(po.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                      </div>
                      <ChevronRightIcon className="size-4 text-slate-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Subcontract Work Orders */}
            {dbResults.workOrders?.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BriefcaseIcon className="size-3.5" /> Subcontracts (WO) ({dbResults.workOrders.length})
                </h4>
                <div className="space-y-1.5">
                  {dbResults.workOrders.map((wo: any) => (
                    <Link
                      key={wo.id}
                      to="/contractors/work-orders"
                      onClick={close}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-dark-700 hover:bg-indigo-50/50 dark:hover:bg-dark-650 border border-slate-200 dark:border-dark-600 flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <div className="font-bold font-mono text-slate-900 dark:text-dark-100">{wo.woNumber}</div>
                        <div className="text-[11px] text-slate-500">{wo.title} &bull; Value: ₹{Number(wo.contractValue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                      </div>
                      <ChevronRightIcon className="size-4 text-slate-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Pages */}
            {result.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Application Pages ({result.length})
                </h4>
                <div className="space-y-1.5">
                  {result.map(({ item, refIndex }: any) => (
                    <Link
                      key={refIndex}
                      to={item.path || "#"}
                      onClick={close}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-dark-700 hover:bg-slate-100 dark:hover:bg-dark-600 flex items-center justify-between text-xs transition"
                    >
                      <span className="font-semibold text-slate-800 dark:text-dark-100">
                        <Highlight query={query}>{item.title || ""}</Highlight>
                      </span>
                      <ChevronRightIcon className="size-3.5 text-slate-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {!hasDbResults && result.length === 0 && !searchingDb && (
              <div className="py-8 text-center text-slate-400 text-xs">
                No items, vendors, POs, or pages found matching &ldquo;{query}&rdquo;.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function flattenNav(items: NavigationTree[]): NavigationTree[] {
  let flatArray: NavigationTree[] = [];
  items.forEach((item) => {
    if (item.path && item.type !== "collapse") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { transKey, ...filteredItem } = item;
      flatArray.push(filteredItem);
    }
    if (item.childs) {
      flatArray = flatArray.concat(flattenNav(item.childs));
    }
  });
  return flatArray;
}
