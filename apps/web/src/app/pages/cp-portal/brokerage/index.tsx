import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface BrokerageItem {
  id: number;
  bookingNo: string;
  customerName: string;
  base: string;
  pct: string;
  brokerage: string;
  gst: string;
  tds194h: string;
  net: string;
  status: "accrued" | "eligible" | "invoiced" | "approved" | "paid";
  createdAt: string;
}

export default function CpBrokeragePage() {
  const [entries, setEntries] = useState<BrokerageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrokerage();
  }, []);

  const fetchBrokerage = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/realty/channel-partners/brokerage?cpId=1");
      const raw = res.data?.data;
      const data = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      setEntries(data);
    } catch (err) {
      console.error("Failed to load CP brokerage ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalGross = entries.reduce((acc, e) => acc + Number(e.brokerage || 0), 0);
  const totalTds = entries.reduce((acc, e) => acc + Number(e.tds194h || 0), 0);
  const totalNet = entries.reduce((acc, e) => acc + Number(e.net || 0), 0);
  const totalPaid = entries
    .filter((e) => e.status === "paid")
    .reduce((acc, e) => acc + Number(e.net || 0), 0);

  return (
    <Page title="My Brokerage & Payouts">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Brokerage & Payout Ledger
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Clear invoice tracking, Section 194-H TDS certificates, and bank settlement status
            </p>
          </div>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => alert("Downloading Form 16A TDS Certificate statement...")}
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-1.5" />
            Download TDS Certificate
          </Button>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <BanknotesIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Commission</p>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ₹{(totalGross / 100000).toFixed(2)}L
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl">
              <ShieldCheckIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">TDS 194-H (5%)</p>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                ₹{(totalTds / 100000).toFixed(2)}L
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
              <ClockIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Net Entitlement</p>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                ₹{(totalNet / 100000).toFixed(2)}L
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <CheckCircleIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Disbursed</p>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{(totalPaid / 100000).toFixed(2)}L
              </div>
            </div>
          </Card>
        </div>

        {/* Ledger Table */}
        <Card className="overflow-hidden">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <span>TDS Section 194-H at 5% is deposited quarterly to your PAN account with Form 16A generation.</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Total Invoices: {entries.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Booking No</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Agreement Value</th>
                  <th className="py-3.5 px-4">Slab %</th>
                  <th className="py-3.5 px-4">Gross Commission</th>
                  <th className="py-3.5 px-4">GST (18%)</th>
                  <th className="py-3.5 px-4">TDS 194-H (-5%)</th>
                  <th className="py-3.5 px-4">Net Receivable</th>
                  <th className="py-3.5 px-4 text-right">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-500">Loading commission ledger...</td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-500">
                      No brokerage entries recorded yet. Tag leads and close bookings to accrue commissions.
                    </td>
                  </tr>
                ) : (
                  entries.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-semibold text-primary-600 text-xs">
                        {e.bookingNo}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-gray-800 dark:text-gray-200">
                        {e.customerName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-700 dark:text-gray-300">
                        ₹{(Number(e.base) / 100000).toFixed(1)}L
                      </td>
                      <td className="py-3.5 px-4 font-bold text-xs">{e.pct}%</td>
                      <td className="py-3.5 px-4 font-mono text-xs">₹{Number(e.brokerage).toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-500">₹{Number(e.gst).toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-red-600 dark:text-red-400">
                        -₹{Number(e.tds194h).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{Number(e.net).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Badge
                          variant="soft"
                          color={e.status === "paid" ? "success" : e.status === "approved" ? "primary" : "warning"}
                          className="capitalize text-xs font-semibold"
                        >
                          {e.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Page>
  );
}
