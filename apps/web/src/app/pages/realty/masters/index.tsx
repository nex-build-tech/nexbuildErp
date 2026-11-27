import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  TagIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { FormModal, FormSection, FormActions, FormInput, FormSelect, FormTextarea } from "../_shared/FormModal";

interface SalesMasterItem {
  id: number;
  uuid: string;
  category: string;
  code: string;
  name: string;
  description?: string;
  color: string;
  sequence: number;
  active: boolean;
  isDefault: boolean;
  metadata?: any;
}

const CATEGORIES = [
  { id: "all", label: "All Masters", icon: "🌐", desc: "All configured sales dropdown options" },
  { id: "lead_stage", label: "Lead Pipeline Stages", icon: "🔄", desc: "Pipeline stages from New to Booked/Lost" },
  { id: "lead_source", label: "Lead Sources", icon: "🏷️", desc: "Lead channels, ads, portals, referrals, walk-ins" },
  { id: "unit_type", label: "Unit Typologies", icon: "🏠", desc: "Flat configurations (1BHK, 2BHK, 3BHK, Shops)" },
  { id: "purchase_purpose", label: "Purchase Purpose", icon: "🎯", desc: "Buyer intent: End Use, Investment, Rental" },
  { id: "interaction_type", label: "Activity / Follow-up Types", icon: "📞", desc: "Call, WhatsApp, Meeting, Site Visit, Email" },
  { id: "loss_reason", label: "Loss / Drop Reasons", icon: "❌", desc: "Disqualification reasons: Budget, Location, Competitor" },
  { id: "visit_rating", label: "Site Visit Ratings", icon: "⭐", desc: "Customer interest ratings & intent levels" },
  { id: "cp_tier", label: "Channel Partner Tiers", icon: "🤝", desc: "CP commission slabs (Silver, Gold, Platinum)" },
  { id: "booking_status", label: "Booking Statuses", icon: "📋", desc: "Deal milestones: Token to Key Possession" },
];

const BADGE_COLORS = [
  { label: "Primary (Blue)", value: "primary" },
  { label: "Success (Green)", value: "success" },
  { label: "Warning (Yellow/Orange)", value: "warning" },
  { label: "Danger (Red)", value: "danger" },
  { label: "Info (Sky)", value: "info" },
  { label: "Purple", value: "purple" },
  { label: "Amber", value: "amber" },
  { label: "Emerald", value: "emerald" },
  { label: "Indigo", value: "indigo" },
  { label: "Gray", value: "gray" },
];

export default function SalesMastersPage() {
  const [items, setItems] = useState<SalesMasterItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SalesMasterItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    category: "lead_source",
    code: "",
    name: "",
    description: "",
    color: "primary",
    sequence: 1,
    active: true,
  });

  useEffect(() => {
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/realty/setup/sales-masters");
      const list = res.data?.data || res.data || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load sales dropdown masters:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = (category?: string) => {
    const cat = category && category !== "all" ? category : (selectedCategory !== "all" ? selectedCategory : "lead_source");
    const countInCat = items.filter((i) => i.category === cat).length;
    setEditingItem(null);
    setFormData({
      category: cat,
      code: "",
      name: "",
      description: "",
      color: "primary",
      sequence: countInCat + 1,
      active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: SalesMasterItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      code: item.code,
      name: item.name,
      description: item.description || "",
      color: item.color || "primary",
      sequence: item.sequence,
      active: item.active,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        await axios.patch(`/realty/setup/sales-masters/${editingItem.id}`, {
          name: formData.name,
          description: formData.description,
          color: formData.color,
          sequence: Number(formData.sequence),
          active: formData.active,
        });
      } else {
        await axios.post("/realty/setup/sales-masters", {
          category: formData.category,
          code: formData.code,
          name: formData.name,
          description: formData.description,
          color: formData.color,
          sequence: Number(formData.sequence),
          active: formData.active,
        });
      }
      setModalOpen(false);
      await fetchMasters();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save master option");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: SalesMasterItem) => {
    try {
      await axios.patch(`/realty/setup/sales-masters/${item.id}`, {
        active: !item.active,
      });
      await fetchMasters();
    } catch (err: any) {
      alert("Failed to toggle status");
    }
  };

  const handleDelete = async (item: SalesMasterItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}" from ${item.category}?`)) return;
    try {
      await axios.delete(`/realty/setup/sales-masters/${item.id}`);
      await fetchMasters();
    } catch (err: any) {
      alert("Failed to delete master option");
    }
  };

  // Filtered List
  const filteredItems = items.filter((item) => {
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    if (filterActive === "active" && !item.active) return false;
    if (filterActive === "inactive" && item.active) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  const getCategoryInfo = (catId: string) => {
    return CATEGORIES.find((c) => c.id === catId) || { label: catId, icon: "📁", desc: "" };
  };

  return (
    <Page title="Sales Dropdown Masters">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 dark:border-dark-700">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-dark-100 flex items-center gap-2.5">
              <AdjustmentsHorizontalIcon className="size-7 text-primary-600" />
              Sales Dropdown Masters
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
              Sales Head Configuration Workspace: Define, order, and customize all dropdown choices across Leads, Pipeline Stages, Activities, and Bookings.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="filled"
              color="primary"
              onClick={() => handleOpenAdd()}
            >
              <PlusIcon className="size-4 mr-1.5" />
              Add Master Option
            </Button>
          </div>
        </div>

        {/* Category Horizontal Scroll / Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {CATEGORIES.map((cat) => {
            const count = cat.id === "all" ? items.length : items.filter((i) => i.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  isSelected
                    ? "bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-500/20"
                    : "bg-white dark:bg-dark-800 text-slate-600 dark:text-dark-300 border-slate-200 dark:border-dark-700 hover:border-primary-400 hover:text-primary-600"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-dark-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Category Header Banner */}
        {selectedCategory !== "all" && (
          <Card className="p-4 bg-gradient-to-r from-primary-50/70 to-indigo-50/50 dark:from-primary-950/20 dark:to-indigo-950/20 border-primary-200 dark:border-primary-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryInfo(selectedCategory).icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {getCategoryInfo(selectedCategory).label}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-dark-300">
                    {getCategoryInfo(selectedCategory).desc}
                  </p>
                </div>
              </div>
              <Button
                variant="outlined"
                color="primary"
                className="px-2.5 py-1 text-xs shrink-0"
                onClick={() => handleOpenAdd(selectedCategory)}
              >
                <PlusIcon className="size-3.5 mr-1" /> Add to {getCategoryInfo(selectedCategory).label}
              </Button>
            </div>
          </Card>
        )}

        {/* Filters and Search Bar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <MagnifyingGlassIcon className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by code or display label..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50/60 dark:bg-dark-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
              <span className="text-slate-500 font-medium">Filter Status:</span>
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-dark-700 p-0.5 bg-slate-50 dark:bg-dark-800">
                {(["all", "active", "inactive"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterActive(status)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all ${
                      filterActive === status
                        ? "bg-white dark:bg-dark-700 text-primary-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:text-dark-400"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <span className="text-slate-400 font-mono text-[11px]">({filteredItems.length} options)</span>
            </div>
          </div>
        </Card>

        {/* Masters Table */}
        <Card className="overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              Loading sales dropdown masters...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-800/60 border-b border-slate-200 dark:border-dark-700 text-slate-600 dark:text-dark-300 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 text-center w-14">Order</th>
                    <th className="py-3 px-3">Dropdown Category</th>
                    <th className="py-3 px-3">System Code</th>
                    <th className="py-3 px-4">Display Label (Shown in Dropdown)</th>
                    <th className="py-3 px-3 text-center">Badge Color</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                  {filteredItems.map((item) => {
                    const catInfo = getCategoryInfo(item.category);
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-dark-750/50 transition-colors ${
                          !item.active ? "opacity-60 bg-slate-50/30 dark:bg-dark-850/30" : ""
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                          #{item.sequence}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-dark-200">
                            <span>{catInfo.icon}</span>
                            <span>{catInfo.label}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-primary-600 dark:text-primary-400">
                          {item.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-dark-100 text-sm">
                              {item.name}
                            </span>
                            {item.isDefault && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border dark:bg-dark-700 dark:text-dark-300">
                                Default
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant="soft" color={(item.color as any) || "primary"} className="capitalize">
                            {item.color}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(item)}
                            className={`cursor-pointer px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                              item.active
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-slate-200 text-slate-600 dark:bg-dark-700 dark:text-dark-400"
                            }`}
                          >
                            {item.active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors"
                              title="Edit Dropdown Option"
                            >
                              <PencilSquareIcon className="size-4" />
                            </button>
                            {!item.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Delete Option"
                              >
                                <TrashIcon className="size-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <TagIcon className="size-10 mx-auto mb-2 opacity-40" />
                        <p className="text-sm font-semibold">No sales dropdown options match your filters.</p>
                        <p className="text-xs mt-1">Click &quot;Add Master Option&quot; above to add a new option.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* MODAL: ADD / EDIT SALES MASTER OPTION */}
        {modalOpen && (
          <FormModal
            title={editingItem ? `Edit Dropdown Option: ${editingItem.name}` : "Add Sales Dropdown Option"}
            subtitle="Configures live dropdown choices available to sales executives across the CRM."
            icon={<TagIcon className="w-5 h-5 text-primary-600" />}
            onClose={() => setModalOpen(false)}
            maxWidth="md"
          >
            <form onSubmit={handleSave} className="space-y-4">
              <FormSection label="Option Classification">
                <FormSelect
                  label="Dropdown Category *"
                  value={formData.category}
                  disabled={Boolean(editingItem)}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={CATEGORIES.filter((c) => c.id !== "all").map((c) => ({
                    label: `${c.icon} ${c.label}`,
                    value: c.id,
                  }))}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="System Code *"
                    type="text"
                    required
                    disabled={Boolean(editingItem)}
                    placeholder="e.g. google_ads or 3bhk"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
                  />
                  <FormInput
                    label="Display Order (Sequence) *"
                    type="number"
                    required
                    min={1}
                    value={formData.sequence}
                    onChange={(e) => setFormData({ ...formData, sequence: Number(e.target.value) })}
                  />
                </div>
              </FormSection>

              <FormSection label="Display & Styling">
                <FormInput
                  label="Display Label (Shown in Dropdown) *"
                  type="text"
                  required
                  placeholder="e.g. Google Ads (Search & PPC)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormSelect
                    label="Badge / Highlight Color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    options={BADGE_COLORS}
                  />

                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-dark-200 mb-1.5 block">
                      Active Status
                    </label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="rounded text-primary-600 focus:ring-primary-500 size-4"
                      />
                      <span className="text-xs font-medium text-slate-700 dark:text-dark-300">
                        Enable in Sales Dropdowns
                      </span>
                    </label>
                  </div>
                </div>

                <FormTextarea
                  label="Description / Context (Optional)"
                  rows={2}
                  placeholder="Notes about when this dropdown choice applies..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </FormSection>

              <FormActions>
                <Button variant="outlined" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button color="primary" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingItem ? "Update Option" : "Create Master Option"}
                </Button>
              </FormActions>
            </form>
          </FormModal>
        )}
      </div>
    </Page>
  );
}
