import { useState, useEffect } from "react";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  BuildingOffice2Icon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { FormModal, FormSection, FormActions, FormInput, FormSelect, FormTextarea } from "../../_shared/FormModal";

interface CompanyItem {
  id: number;
  uuid: string;
  code: string;
  name: string;
  legalName?: string;
  cin?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  stateCode?: string;
  pincode?: string;
  email?: string;
  phone?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankBranch?: string;
  logoUrl?: string;
  status: "active" | "inactive";
  projectsCount?: number;
  projects?: { id: number; name: string; code: string }[];
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    legalName: "",
    cin: "",
    gstin: "",
    pan: "",
    address: "",
    city: "Mumbai",
    stateCode: "27",
    pincode: "",
    email: "",
    phone: "",
    bankName: "",
    bankAccountNo: "",
    bankIfsc: "",
    bankBranch: "",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/realty/setup/companies");
      const list = res.data?.data || res.data || [];
      setCompanies(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load companies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCompany(null);
    setFormData({
      code: "",
      name: "",
      legalName: "",
      cin: "",
      gstin: "",
      pan: "",
      address: "",
      city: "Mumbai",
      stateCode: "27",
      pincode: "",
      email: "",
      phone: "",
      bankName: "",
      bankAccountNo: "",
      bankIfsc: "",
      bankBranch: "",
      status: "active",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (c: CompanyItem) => {
    setEditingCompany(c);
    setFormData({
      code: c.code,
      name: c.name,
      legalName: c.legalName || c.name,
      cin: c.cin || "",
      gstin: c.gstin || "",
      pan: c.pan || "",
      address: c.address || "",
      city: c.city || "Mumbai",
      stateCode: c.stateCode || "27",
      pincode: c.pincode || "",
      email: c.email || "",
      phone: c.phone || "",
      bankName: c.bankName || "",
      bankAccountNo: c.bankAccountNo || "",
      bankIfsc: c.bankIfsc || "",
      bankBranch: c.bankBranch || "",
      status: c.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCompany) {
        await axios.patch(`/realty/setup/companies/${editingCompany.id}`, formData);
      } else {
        await axios.post("/realty/setup/companies", formData);
      }
      setModalOpen(false);
      await fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save company");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: CompanyItem) => {
    if (!confirm(`Are you sure you want to delete or deactivate "${c.name}"?`)) return;
    try {
      await axios.delete(`/realty/setup/companies/${c.id}`);
      await fetchCompanies();
    } catch (err: any) {
      alert("Failed to delete company");
    }
  };

  const filtered = companies.filter((c) => {
    if (filterStatus === "active" && c.status !== "active") return false;
    if (filterStatus === "inactive" && c.status !== "inactive") return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.legalName && c.legalName.toLowerCase().includes(q)) ||
      c.code.toLowerCase().includes(q) ||
      (c.gstin && c.gstin.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
    );
  });

  return (
    <Page title="Companies & Sister Concerns">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 dark:border-dark-700">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-dark-100 flex items-center gap-2.5">
              <BuildingOffice2Icon className="size-7 text-primary-600" />
              Company Entities & Subsidiaries
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
              Multi-Company Management Layer: Configure distinct legal entities, GSTIN, PAN, bank payout accounts, and map them to their corresponding real estate projects.
            </p>
          </div>

          <Button
            variant="filled"
            color="primary"
            onClick={handleOpenAdd}
            className="flex items-center gap-2"
          >
            <PlusIcon className="size-4" />
            Add Company
          </Button>
        </div>

        {/* Search & Filter Bar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="relative w-full sm:w-80">
              <MagnifyingGlassIcon className="size-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search company by name, code, GSTIN..."
                className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-slate-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(["all", "active", "inactive"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                    filterStatus === st
                      ? "bg-primary-600 text-white"
                      : "bg-slate-100 dark:bg-dark-750 text-slate-600 dark:text-dark-300 hover:bg-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Company Cards Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading companies...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No company entities found matching your search.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((comp) => (
              <Card key={comp.id} className="p-5 flex flex-col justify-between border-slate-200 dark:border-dark-700 hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start justify-between gap-3 border-b pb-3 dark:border-dark-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-700 font-bold text-slate-700 dark:text-dark-200">
                          {comp.code}
                        </span>
                        <Badge
                          variant="soft"
                          color={comp.status === "active" ? "success" : "error"}
                          className="capitalize text-[11px]"
                        >
                          {comp.status}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-dark-100 mt-1.5">
                        {comp.name}
                      </h3>
                      {comp.legalName && comp.legalName !== comp.name && (
                        <p className="text-xs text-slate-500 dark:text-dark-400">
                          {comp.legalName}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(comp)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
                        title="Edit Company"
                      >
                        <PencilSquareIcon className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(comp)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete / Deactivate"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Legal & Tax Information */}
                  <div className="mt-3.5 space-y-2 text-xs text-slate-600 dark:text-dark-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">GSTIN:</span>
                      <span className="font-mono font-semibold">{comp.gstin || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">PAN:</span>
                      <span className="font-mono font-semibold">{comp.pan || "—"}</span>
                    </div>
                    {comp.cin && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">CIN:</span>
                        <span className="font-mono font-semibold">{comp.cin}</span>
                      </div>
                    )}
                    {comp.city && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Location:</span>
                        <span>{comp.city}, State: {comp.stateCode}</span>
                      </div>
                    )}
                  </div>

                  {/* Bank Details for Receipts */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-dark-750 border border-slate-100 dark:border-dark-700">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-dark-200 mb-1.5">
                      <BanknotesIcon className="size-4 text-emerald-600" />
                      Receipt Deposit Bank Account
                    </div>
                    {comp.bankAccountNo ? (
                      <div className="text-[11px] space-y-0.5 text-slate-600 dark:text-dark-400">
                        <p><strong className="text-slate-800 dark:text-dark-200">{comp.bankName}</strong> ({comp.bankBranch || "Main"})</p>
                        <p className="font-mono">A/C: {comp.bankAccountNo}</p>
                        <p className="font-mono">IFSC: {comp.bankIfsc}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No bank account configured</p>
                    )}
                  </div>

                  {/* Linked Projects */}
                  <div className="mt-4 pt-3 border-t dark:border-dark-700">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-medium text-slate-700 dark:text-dark-300">
                        Linked Projects ({comp.projectsCount || 0})
                      </span>
                    </div>
                    {comp.projects && comp.projects.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {comp.projects.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-900"
                          >
                            <span className="font-bold">{p.code}:</span> {p.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No projects assigned yet</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal for Add / Edit Company */}
        {modalOpen && (
          <FormModal
            onClose={() => setModalOpen(false)}
            title={editingCompany ? `Edit Company: ${editingCompany.name}` : "Add New Company / Sister Firm"}
            maxWidth="lg"
          >
            <form onSubmit={handleSave} className="space-y-6">
            <FormSection label="Basic Company Identity">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Company Name"
                  required
                  placeholder="e.g. Samarth Construction"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <FormInput
                  label="Company Code (Unique)"
                  required
                  placeholder="e.g. SAMARTH_CONST"
                  value={formData.code}
                  disabled={!!editingCompany}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>

              <FormInput
                label="Full Registered Legal Name"
                placeholder="e.g. Samarth Infrastructure & Construction LLP"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormInput
                  label="GSTIN"
                  placeholder="27AABCS5678G1Z2"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                />
                <FormInput
                  label="PAN"
                  placeholder="AABCS5678G"
                  value={formData.pan}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                />
                <FormInput
                  label="CIN (Optional)"
                  placeholder="U45200MH2015PTC..."
                  value={formData.cin}
                  onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                />
              </div>
            </FormSection>

            <FormSection label="Registered Address & Contact">
              <FormTextarea
                label="Office Address (Prints on Booking Forms & Receipts)"
                rows={2}
                placeholder="Floor, Building, Road..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormInput
                  label="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <FormInput
                  label="State Code"
                  placeholder="27 (Maharashtra)"
                  value={formData.stateCode}
                  onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                />
                <FormInput
                  label="PIN Code"
                  placeholder="400051"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Contact Email"
                  type="email"
                  placeholder="sales@company.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <FormInput
                  label="Contact Phone"
                  placeholder="+91 22 2830 8899"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </FormSection>

            <FormSection label="Bank Details (For Booking & Token Receipts)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Bank Name"
                  placeholder="e.g. HDFC Bank, ICICI Bank"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                />
                <FormInput
                  label="Account Number"
                  placeholder="e.g. 50200012345678"
                  value={formData.bankAccountNo}
                  onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="IFSC Code"
                  placeholder="e.g. HDFC0000123"
                  value={formData.bankIfsc}
                  onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value.toUpperCase() })}
                />
                <FormInput
                  label="Branch Name"
                  placeholder="e.g. BKC Branch, Mumbai"
                  value={formData.bankBranch}
                  onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                />
              </div>
            </FormSection>

            <FormSection label="Status">
              <FormSelect
                label="Entity Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ]}
              />
            </FormSection>

            <FormActions>
              <Button
                variant="outlined"
                type="button"
                disabled={saving}
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving..." : editingCompany ? "Update Company" : "Create Company"}
              </Button>
            </FormActions>
          </form>
        </FormModal>
      )}
      </div>
    </Page>
  );
}
