import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  ShareIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

interface ScopedUnit {
  id: number;
  unitNo: string;
  wing: string;
  type: string;
  carpetSqFt: number;
  indicativePrice: number;
  status: string;
}

export default function CpInventoryPage() {
  const [units, setUnits] = useState<ScopedUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("");
  const [selectedWing, setSelectedWing] = useState("");
  const [sharedAlert, setSharedAlert] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/realty/channel-partners/portal/inventory?siteId=1");
      const raw = res.data?.data;
      const data = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      setUnits(data);
    } catch (err) {
      console.error("Failed to load scoped inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (u: ScopedUnit) => {
    const text = `*Kings Heights - ${u.wing} Unit ${u.unitNo}*\nConfiguration: ${u.type}\nCarpet Area: ${u.carpetSqFt} sq.ft.\nAll-Inclusive Guide Price: ₹${(u.indicativePrice / 100000).toFixed(1)} Lakhs\nContact us for sample flat tour & booking!`;
    navigator.clipboard.writeText(text);
    setSharedAlert(`Copied unit ${u.unitNo} summary to clipboard! Ready to paste in WhatsApp.`);
    setTimeout(() => setSharedAlert(null), 5000);
  };

  const filteredUnits = units.filter((u) => {
    if (selectedType && !u.type.includes(selectedType)) return false;
    if (selectedWing && u.wing !== selectedWing) return false;
    return true;
  });

  return (
    <Page title="Kings Heights Live Inventory">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Available Units & Price Guide
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Live inventory for Kings Heights Tower A & B • Client-ready carpet areas and indicative pricing
            </p>
          </div>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => alert("Downloading Kings Heights Project Brochure PDF...")}
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />
            Download Brochure
          </Button>
        </div>

        {sharedAlert && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-300">
            {sharedAlert}
          </div>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Configuration</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full py-2 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <option value="">All Configurations (1 / 2 / 3 BHK)</option>
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="3 BHK">3 BHK</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Wing / Building</label>
              <select
                value={selectedWing}
                onChange={(e) => setSelectedWing(e.target.value)}
                className="w-full py-2 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <option value="">All Wings (Tower A & Tower B)</option>
                <option value="Wing A">Tower A</option>
                <option value="Wing B">Tower B</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Inventory Grid */}
        {loading ? (
          <div className="py-20 text-center text-gray-500">Loading live inventory...</div>
        ) : filteredUnits.length === 0 ? (
          <div className="py-20 text-center text-gray-500">No available units matching criteria.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUnits.map((u) => (
              <Card key={u.id} className="p-5 flex flex-col justify-between hover:border-primary-400 transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-gray-900 dark:text-white font-mono">
                      {u.unitNo}
                    </span>
                    <Badge variant="soft" color={u.status === "available" ? "success" : "warning"} className="text-[10px] capitalize">
                      {u.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{u.wing}</div>

                  <div className="mt-4 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Layout:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{u.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">RERA Carpet:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{u.carpetSqFt} sq.ft.</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Guide Price</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{(u.indicativePrice / 100000).toFixed(2)} Lakhs
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center gap-2">
                  <Button
                    variant="outlined"
                    color="primary"
                    className="w-full text-xs"
                    onClick={() => handleShare(u)}
                  >
                    <ShareIcon className="w-3.5 h-3.5 mr-1" /> Share on WhatsApp
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
