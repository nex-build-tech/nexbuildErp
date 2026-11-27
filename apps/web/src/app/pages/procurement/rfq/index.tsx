import { useState, useEffect } from "react";
import { Page } from "@/components/shared/Page";
import { Card, Button, Input } from "@/components/ui";
import axios from "@/utils/axios";
import {
  ScaleIcon,
  MagnifyingGlassIcon,
  CheckBadgeIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

export default function RfqComparativePage() {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [selectedRfq, setSelectedRfq] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRfqs();
  }, []);

  const fetchRfqs = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/procurement/rfqs");
      const list = res.data?.data || [];
      setRfqs(list);
      if (list.length > 0) {
        viewRfqDetail(list[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const viewRfqDetail = async (id: number) => {
    try {
      const res = await axios.get(`/procurement/rfqs/${id}`);
      setSelectedRfq(res.data?.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRfqs = rfqs.filter(
    (r) =>
      r.rfqNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.siteName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Page title="RFQ & Quotations Comparison">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <ScaleIcon className="size-6 text-[#c5a04e]" />
              RFQ &amp; Comparative Quotation Statement
            </h1>
            <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
              Multi-vendor quotation evaluation sheets with automated L1 (lowest bidder) calculation &amp; tax analysis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Active RFQs: {rfqs.length}
            </span>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800">
          <div className="w-full md:w-80">
            <Input
              placeholder="Search RFQ # or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefix={<MagnifyingGlassIcon className="size-4 text-slate-400" />}
            />
          </div>
        </Card>

        {/* Master & Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* RFQ List Column */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Procurement Inquiries
            </h2>
            {loading ? (
              <div className="py-12 text-center text-slate-400">Loading RFQs...</div>
            ) : filteredRfqs.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No RFQs found.</div>
            ) : (
              filteredRfqs.map((r) => {
                const isSelected = selectedRfq && selectedRfq.id === r.id;
                return (
                  <Card
                    key={r.id}
                    onClick={() => viewRfqDetail(r.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? "border-[#c5a04e] ring-1 ring-[#c5a04e] bg-amber-50/20 dark:bg-amber-950/20"
                        : "border-slate-200 dark:border-dark-700 hover:border-slate-300 dark:hover:border-dark-600 bg-white dark:bg-dark-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                        {r.rfqNumber}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {r.quotationCount} Quotes Received
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-dark-100 mt-2 line-clamp-1">
                      {r.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-dark-400 mt-1 flex items-center gap-1">
                      Site: {r.siteName}
                    </p>
                  </Card>
                );
              })
            )}
          </div>

          {/* Comparative Statement Detail Column */}
          <div className="lg:col-span-2 space-y-4">
            {selectedRfq ? (
              <div className="space-y-4">
                {/* RFQ Header Card */}
                <Card className="p-5 rounded-2xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3 dark:border-dark-700">
                    <div>
                      <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                        {selectedRfq.rfqNumber}
                      </span>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-dark-100 mt-1">
                        {selectedRfq.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-dark-400">
                        Delivery Site: {selectedRfq.siteName}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                      Status: {selectedRfq.status}
                    </span>
                  </div>

                  {/* Requested Items preview */}
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                      Inquired Specifications &amp; Quantities
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRfq.items?.map((it: any) => (
                        <span
                          key={it.id}
                          className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-dark-700 text-slate-800 dark:text-dark-200 font-medium"
                        >
                          {it.itemName}: <strong>{Number(it.quantity).toFixed(0)} {it.unitCode}</strong> (Target: ₹{Number(it.targetRate).toFixed(2)})
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Comparative Statement Matrix */}
                <Card className="p-5 rounded-2xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
                        <TrophyIcon className="size-5 text-amber-500" />
                        Vendor Rate Comparative Statement (L1 Evaluation)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Rates benchmarked across verified suppliers. The lowest qualified bid (L1) is highlighted.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedRfq.quotations?.map((quote: any) => {
                      const isL1 = quote.isLowest;
                      const isIntraState = quote.vendorStateCode === "27";
                      return (
                        <div
                          key={quote.id}
                          className={`p-4 rounded-xl border relative transition-all ${
                            isL1
                              ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm"
                              : "border-slate-200 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-700/30"
                          }`}
                        >
                          {/* L1 Badge */}
                          {isL1 && (
                            <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                              <TrophyIcon className="size-3" /> L1 Lowest Bidder
                            </span>
                          )}

                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-mono text-[11px] font-bold text-slate-500">
                                  {quote.vendorCode}
                                </span>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-dark-100">
                                  {quote.vendorName}
                                </h4>
                                <span className="text-[10px] font-mono text-slate-400">
                                  GSTIN: {quote.vendorGstin || "N/A"}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  isIntraState
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "bg-purple-50 text-purple-700 border border-purple-200"
                                }`}
                              >
                                {isIntraState ? "Intra-State (27)" : `Inter-State (${quote.vendorStateCode})`}
                              </span>
                            </div>

                            {/* Quote Breakdown */}
                            <div className="bg-white dark:bg-dark-800 p-3 rounded-xl border border-slate-100 dark:border-dark-700 space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Subtotal:</span>
                                <span className="font-semibold text-slate-800 dark:text-dark-200">
                                  ₹{Number(quote.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Taxes ({isIntraState ? "CGST+SGST" : "IGST"}):</span>
                                <span className="font-semibold text-slate-800 dark:text-dark-200">
                                  ₹{Number(quote.taxAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between border-t pt-1.5 dark:border-dark-700">
                                <span className="font-bold text-slate-900 dark:text-dark-100">
                                  Total Bid:
                                </span>
                                <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                                  ₹{Number(quote.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-500 space-y-0.5">
                              <p>Ref: {quote.quotationRef || "Direct Offer"}</p>
                              <p>Lead Time: {quote.deliveryLeadTimeDays || 3} days</p>
                              <p>Terms: {quote.paymentTerms || "30 Days Credit"}</p>
                              {quote.remarks && <p className="italic text-slate-400">{quote.remarks}</p>}
                            </div>

                            {isL1 && (
                              <div className="pt-2">
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 flex items-center justify-center gap-1 shadow-sm">
                                  <CheckBadgeIcon className="size-4" /> Award &amp; Issue PO
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400">
                Select an RFQ on the left to inspect comparative quotations.
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
