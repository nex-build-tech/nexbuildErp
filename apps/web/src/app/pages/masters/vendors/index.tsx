import { useState, useEffect } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Button, Input } from "@/components/ui";
import axios from "@/utils/axios";
import {
  TruckIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  IdentificationIcon,
  BanknotesIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function VendorsMaster() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [tab, setTab] = useState<"VENDORS" | "CONTRACTORS">("VENDORS");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, cRes] = await Promise.all([
        axios.get("/masters/vendors"),
        axios.get("/masters/contractors"),
      ]);
      setVendors(vRes.data?.data || []);
      setContractors(cRes.data?.data || []);
    } catch (err) {
      console.error("Error fetching vendors/contractors", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.code?.toLowerCase().includes(search.toLowerCase()) ||
      v.gstin?.toLowerCase().includes(search.toLowerCase()) ||
      v.city?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredContractors = contractors.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.code?.toLowerCase().includes(search.toLowerCase()) ||
      c.pan?.toLowerCase().includes(search.toLowerCase()) ||
      c.contractorType?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Page title="Vendors & Contractors Master">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <TruckIcon className="size-6 text-[#c5a04e]" />
              Vendors &amp; Contractors Directory
            </h1>
            <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
              Supplier database with verified GSTIN, PAN, Bank Details, and State tax classification (Intra vs Inter-state).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {tab === "VENDORS" ? `Vendors: ${filteredVendors.length}` : `Contractors: ${filteredContractors.length}`}
            </span>
            <Button color="primary" className="flex items-center gap-1.5 text-xs py-2">
              <PlusIcon className="size-4" /> Add {tab === "VENDORS" ? "Vendor" : "Contractor"}
            </Button>
          </div>
        </div>

        {/* Tab & Search Bar */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-dark-700/60 rounded-xl w-full md:w-auto">
              <button
                onClick={() => setTab("VENDORS")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  tab === "VENDORS"
                    ? "bg-white dark:bg-dark-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-dark-300 hover:text-slate-900"
                }`}
              >
                Material Suppliers &amp; Vendors ({vendors.length})
              </button>
              <button
                onClick={() => setTab("CONTRACTORS")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  tab === "CONTRACTORS"
                    ? "bg-white dark:bg-dark-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-dark-300 hover:text-slate-900"
                }`}
              >
                Labour &amp; Work Contractors ({contractors.length})
              </button>
            </div>

            {/* Search */}
            <div className="w-full md:w-80">
              <Input
                placeholder={`Search ${tab === "VENDORS" ? "vendor, GSTIN, code" : "contractor, PAN, trade"}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                prefix={<MagnifyingGlassIcon className="size-4 text-slate-400" />}
              />
            </div>
          </div>
        </Card>

        {/* Content Table/Grid */}
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading directory...</div>
        ) : tab === "VENDORS" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVendors.map((vendor) => {
              const isIntraState = vendor.stateCode === "27";
              return (
                <Card
                  key={vendor.id}
                  className="rounded-2xl border border-slate-200 dark:border-dark-700 p-5 bg-white dark:bg-dark-800 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                            {vendor.code}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              isIntraState
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300"
                            }`}
                          >
                            {isIntraState ? "Intra-State (CGST+SGST)" : "Inter-State (IGST)"}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-dark-100 mt-2">
                          {vendor.name}
                        </h3>
                        {vendor.tradeName && vendor.tradeName !== vendor.name && (
                          <p className="text-xs text-slate-500 dark:text-dark-400 italic">
                            T/A: {vendor.tradeName}
                          </p>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        <CheckCircleIcon className="size-3.5" /> Active
                      </span>
                    </div>

                    {/* Tax & Identifiers */}
                    <div className="bg-slate-50 dark:bg-dark-700/50 p-3 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-dark-400 flex items-center gap-1">
                          <IdentificationIcon className="size-3.5" /> GSTIN
                        </span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-dark-100">
                          {vendor.gstin || "URP (Unregistered)"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-dark-400">PAN</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-dark-200">
                          {vendor.pan || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-dark-400">State</span>
                        <span className="font-medium text-slate-800 dark:text-dark-200">
                          {vendor.stateName} ({vendor.stateCode})
                        </span>
                      </div>
                    </div>

                    {/* Contact & Banking */}
                    <div className="text-xs space-y-1 text-slate-600 dark:text-dark-300">
                      {vendor.contactPerson && (
                        <p className="font-medium text-slate-800 dark:text-dark-200">
                          Contact: {vendor.contactPerson}
                        </p>
                      )}
                      {vendor.phone && (
                        <p className="flex items-center gap-1.5">
                          <PhoneIcon className="size-3 text-slate-400" />
                          {vendor.phone}
                        </p>
                      )}
                      {vendor.email && (
                        <p className="flex items-center gap-1.5 truncate">
                          <EnvelopeIcon className="size-3 text-slate-400 shrink-0" />
                          <span className="truncate">{vendor.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bank info footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-dark-400">
                    <span className="flex items-center gap-1">
                      <BanknotesIcon className="size-3.5 text-amber-500" />
                      {vendor.bankName || "Bank on file"}
                    </span>
                    <span className="font-mono">Terms: {vendor.paymentTermsDays || 30} Days</span>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredContractors.map((contractor) => (
              <Card
                key={contractor.id}
                className="rounded-2xl border border-slate-200 dark:border-dark-700 p-5 bg-white dark:bg-dark-800 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                        {contractor.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-dark-100 mt-2">
                        {contractor.name}
                      </h3>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        {contractor.contractorType || "General Contractor"}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      <CheckCircleIcon className="size-3.5" /> Verified
                    </span>
                  </div>

                  {/* Identifiers */}
                  <div className="bg-slate-50 dark:bg-dark-700/50 p-3 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-dark-400">PAN Number</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-dark-100">
                        {contractor.pan || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-dark-400">TDS Rate</span>
                      <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {contractor.tdsRate || "1% (194C Ind/HUF)"}
                      </span>
                    </div>
                    {contractor.pfRegNo && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-dark-400">PF Reg #</span>
                        <span className="font-mono text-slate-800 dark:text-dark-200">
                          {contractor.pfRegNo}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contact details */}
                  <div className="text-xs space-y-1 text-slate-600 dark:text-dark-300">
                    {contractor.phone && (
                      <p className="flex items-center gap-1.5">
                        <PhoneIcon className="size-3 text-slate-400" />
                        {contractor.phone}
                      </p>
                    )}
                    {contractor.email && (
                      <p className="flex items-center gap-1.5 truncate">
                        <EnvelopeIcon className="size-3 text-slate-400 shrink-0" />
                        <span className="truncate">{contractor.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Bank / IFSC footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-dark-400">
                  <span className="flex items-center gap-1">
                    <BanknotesIcon className="size-3.5 text-amber-500" />
                    {contractor.bankName || "Bank on file"}
                  </span>
                  <span className="font-mono text-slate-600 dark:text-dark-300">
                    IFSC: {contractor.bankIfsc || "N/A"}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
