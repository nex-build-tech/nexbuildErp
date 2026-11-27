import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "@/utils/axios";
import { Page } from "@/components/shared/Page";
import { Card, Button, Badge } from "@/components/ui";
import {
  DocumentCheckIcon,
  UserIcon,
  UsersIcon,
  CurrencyRupeeIcon,
  TruckIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

interface UnitOption {
  id: number;
  unitNo: string;
  carpetArea: string;
  baseRate: string;
  status: string;
  unitType?: { name: string };
  floor?: { levelNo: number; name: string };
}

interface SchemeOption {
  id: number;
  name: string;
  maxDiscountPct: string;
  stampByBuilder: boolean;
  registrationByBuilder: boolean;
}

interface ParkingOption {
  id: number;
  slotNo: string;
  type: string;
  price: string;
  status: string;
}

interface CoApplicant {
  type: "co1" | "co2" | "co3";
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  pan: string;
  aadhaar: string;
  mobile: string;
  email: string;
  relation: string;
}

export default function RealtyNewBookingPage() {
  const navigate = useNavigate();

  // Wizard Step (1 to 7)
  const [currentStep, setCurrentStep] = useState(1);

  // Loading & Options
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [schemes, setSchemes] = useState<SchemeOption[]>([]);
  const [parkingSlots, setParkingSlots] = useState<ParkingOption[]>([]);

  // Step 1: Unit & Scheme
  const [siteId] = useState(1); // Kings Heights
  const [selectedUnitId, setSelectedUnitId] = useState<number | "">("");
  const [selectedSchemeId, setSelectedSchemeId] = useState<number | "">("");

  // Live Cost Sheet Preview
  const [previewCalc, setPreviewCalc] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  // Step 2: Primary Applicant
  const [applicant, setApplicant] = useState({
    title: "Mr.",
    firstName: "",
    middleName: "",
    lastName: "",
    dob: "",
    gender: "male" as "male" | "female" | "other",
    occupation: "",
    pan: "",
    aadhaar: "",
    mobile: "",
    email: "",
    permanentAddress: "",
    correspondenceAddress: "",
    sameAddress: true,
    city: "Mumbai",
    stateCode: "MH",
    pincode: "",
  });

  // Step 3: Co-Applicants
  const [coApplicants, setCoApplicants] = useState<CoApplicant[]>([]);

  // Step 4: Cost & Taxes & Discount
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [flatDiscountAmt, setFlatDiscountAmt] = useState<number>(0);

  // Step 5: Charges & Parking
  const [selectedParkingSlotId, setSelectedParkingSlotId] = useState<number | "">("");

  // Step 6: Booking Amount
  const [bookingAmount, setBookingAmount] = useState<number>(200000);
  const [paymentMode, setPaymentMode] = useState("NEFT");
  const [referenceNo, setReferenceNo] = useState("");
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState("");

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Initial Load: Units, Schemes, Parkings
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingUnits(true);
        // Available or held units
        const [unitsRes, schemesRes, parkingsRes] = await Promise.all([
          axios.get(`/realty/inventory/units?siteId=${siteId}`),
          axios.get(`/realty/setup/schemes?siteId=${siteId}`),
          axios.get(`/realty/inventory/parking-grid?siteId=${siteId}`),
        ]);

        const uData = unitsRes.data?.data || unitsRes.data || [];
        const sData = schemesRes.data?.data || schemesRes.data || [];
        const pData = parkingsRes.data?.data || parkingsRes.data || [];

        // filter available units
        const availUnits = uData.filter((u: any) => u.status === "available" || u.status === "hold");
        setUnits(availUnits);
        setSchemes(sData);

        // filter available parking
        const availParkings = pData.filter((p: any) => p.status === "available");
        setParkingSlots(availParkings);
      } catch (err) {
        console.error("Failed to load setup data", err);
      } finally {
        setLoadingUnits(false);
      }
    };
    loadInitialData();
  }, [siteId]);

  // 2. Fetch live pricing calculation whenever unit, scheme, discount or parking changes
  useEffect(() => {
    if (!selectedUnitId || !selectedSchemeId) {
      setPreviewCalc(null);
      return;
    }

    const fetchPreview = async () => {
      try {
        setCalculating(true);
        const params = new URLSearchParams({
          schemeId: String(selectedSchemeId),
          discountPct: String(discountPct || 0),
          flatDiscountAmt: String(flatDiscountAmt || 0),
        });
        if (selectedParkingSlotId) {
          params.append("parkingSlotId", String(selectedParkingSlotId));
        }
        const res = await axios.get(
          `/realty/inventory/units/${selectedUnitId}/cost-sheet-preview?${params.toString()}`
        );
        const data = res.data?.data || res.data;
        setPreviewCalc(data?.calculation || null);
      } catch (err) {
        console.error("Pricing preview calculation failed", err);
      } finally {
        setCalculating(false);
      }
    };

    fetchPreview();
  }, [selectedUnitId, selectedSchemeId, discountPct, flatDiscountAmt, selectedParkingSlotId]);

  // Co-applicant helpers
  const addCoApplicant = () => {
    if (coApplicants.length >= 3) return;
    const nextType = (`co${coApplicants.length + 1}`) as "co1" | "co2" | "co3";
    setCoApplicants([
      ...coApplicants,
      {
        type: nextType,
        title: "Mrs.",
        firstName: "",
        middleName: "",
        lastName: "",
        pan: "",
        aadhaar: "",
        mobile: "",
        email: "",
        relation: "Spouse",
      },
    ]);
  };

  const removeCoApplicant = (index: number) => {
    setCoApplicants(coApplicants.filter((_, i) => i !== index));
  };

  const updateCoApplicant = (index: number, field: keyof CoApplicant, value: string) => {
    const updated = [...coApplicants];
    if (updated[index]) {
      (updated[index] as any)[field] = value;
      setCoApplicants(updated);
    }
  };

  // Step Validation
  const validateStep = (step: number): boolean => {
    setErrorMsg("");
    if (step === 1) {
      if (!selectedUnitId) {
        setErrorMsg("Please select an available unit.");
        return false;
      }
      if (!selectedSchemeId) {
        setErrorMsg("Please select a payment scheme.");
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!applicant.firstName.trim() || !applicant.lastName.trim()) {
        setErrorMsg("Primary applicant First and Last Name are required.");
        return false;
      }
      if (!applicant.mobile || applicant.mobile.trim().length < 10) {
        setErrorMsg("Valid 10-digit mobile number is required.");
        return false;
      }
      if (applicant.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(applicant.pan.toUpperCase())) {
        setErrorMsg("Invalid PAN format. Standard format is ABCDE1234F.");
        return false;
      }
      if (applicant.aadhaar && applicant.aadhaar.replace(/\D/g, "").length !== 12) {
        setErrorMsg("Aadhaar must be exactly 12 digits.");
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(7, prev + 1));
    }
  };

  const handlePrev = () => {
    setErrorMsg("");
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Submit Final Booking
  const handleSubmitBooking = async () => {
    try {
      setSubmitting(true);
      setErrorMsg("");

      const payload = {
        siteId,
        unitId: Number(selectedUnitId),
        schemeId: Number(selectedSchemeId),
        bookingDate,
        discountPct: discountPct || 0,
        flatDiscountAmt: flatDiscountAmt || 0,
        parkingSlotId: selectedParkingSlotId ? Number(selectedParkingSlotId) : undefined,
        bookingAmount,
        paymentMode,
        referenceNo,
        remarks,
        applicant: {
          ...applicant,
          pan: applicant.pan ? applicant.pan.toUpperCase() : undefined,
          aadhaar: applicant.aadhaar ? applicant.aadhaar.replace(/\D/g, "") : undefined,
        },
        coApplicants: coApplicants.map((c) => ({
          ...c,
          pan: c.pan ? c.pan.toUpperCase() : undefined,
          aadhaar: c.aadhaar ? c.aadhaar.replace(/\D/g, "") : undefined,
        })),
      };

      const res = await axios.post("/realty/post-sales/bookings", payload);
      const data = res.data?.data || res.data;
      if (data?.bookingId) {
        navigate(`/realty/bookings/${data.bookingId}`);
      } else {
        navigate("/realty/bookings");
      }
    } catch (err: any) {
      console.error("Booking creation failed", err);
      setErrorMsg(err.response?.data?.message || "Failed to create booking. Please check details.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedUnit = units.find((u) => u.id === Number(selectedUnitId));
  const selectedScheme = schemes.find((s) => s.id === Number(selectedSchemeId));
  const maxAllowedDiscount = selectedScheme ? parseFloat(selectedScheme.maxDiscountPct || "0") : 0;
  const isDiscountOverLimit = discountPct > maxAllowedDiscount;

  const stepsList = [
    { num: 1, title: "Unit & Scheme", icon: DocumentCheckIcon },
    { num: 2, title: "Primary Applicant", icon: UserIcon },
    { num: 3, title: "Co-Applicants", icon: UsersIcon },
    { num: 4, title: "Cost & Taxes", icon: CurrencyRupeeIcon },
    { num: 5, title: "Charges & Parking", icon: TruckIcon },
    { num: 6, title: "Booking Amount", icon: CreditCardIcon },
    { num: 7, title: "Review & Submit", icon: CheckCircleIcon },
  ];

  return (
    <Page title="New Booking Wizard">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate("/realty/bookings")}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1"
            >
              <ArrowLeftIcon className="size-3.5" />
              Back to Bookings Register
            </button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
              <DocumentCheckIcon className="size-7 text-primary-600" />
              7-Step Booking Wizard
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Kings Heights Tower A &amp; B • Statutory Compliant • AES-256-GCM Encrypted Aadhaar
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold px-2.5 py-1 bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-full">
              Step {currentStep} of 7
            </span>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <Card className="p-3 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px]">
            {stepsList.map((st, idx) => {
              const isPassed = currentStep > st.num;
              const isCurrent = currentStep === st.num;
              return (
                <div key={st.num} className="flex items-center flex-1">
                  <div
                    onClick={() => isPassed && setCurrentStep(st.num)}
                    className={`flex items-center gap-2 cursor-pointer ${
                      isPassed ? "text-primary-600" : isCurrent ? "text-slate-900 dark:text-dark-100 font-bold" : "text-slate-400"
                    }`}
                  >
                    <div
                      className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPassed
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                          ? "bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-950"
                          : "bg-slate-200 dark:bg-dark-700 text-slate-600 dark:text-dark-400"
                      }`}
                    >
                      {isPassed ? "✓" : st.num}
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] leading-tight">{st.title}</p>
                    </div>
                  </div>
                  {idx < stepsList.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-3 ${
                        isPassed ? "bg-emerald-500" : "bg-slate-200 dark:bg-dark-700"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-3 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <ExclamationTriangleIcon className="size-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Unit & Scheme */}
        {currentStep === 1 && (
          <Card className="p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-dark-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
                <DocumentCheckIcon className="size-5 text-primary-600" />
                Step 1: Select Unit &amp; Payment Scheme
              </h3>
              <p className="text-xs text-slate-500">
                Choose the apartment to book and select the milestone payment scheme.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  Unit (Available / Held) <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value ? Number(e.target.value) : "")}
                  disabled={loadingUnits}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                >
                  <option value="">-- Choose Unit --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unitNo} ({u.unitType?.name || "Apartment"}, {u.carpetArea} sqft, Floor {u.floor?.levelNo || 0}) - Rate ₹{parseFloat(u.baseRate).toLocaleString("en-IN")}/sqft
                    </option>
                  ))}
                </select>
                {selectedUnit && (
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-dark-750 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Configuration:</span>
                      <span className="font-semibold">{selectedUnit.unitType?.name || "Apartment"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Carpet Area:</span>
                      <span className="font-mono font-semibold">{selectedUnit.carpetArea} sqft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Floor Level:</span>
                      <span className="font-semibold">Floor {selectedUnit.floor?.levelNo || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Base Rate:</span>
                      <span className="font-mono font-semibold">₹{parseFloat(selectedUnit.baseRate).toLocaleString("en-IN")}/sqft</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  Payment Scheme <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSchemeId}
                  onChange={(e) => setSelectedSchemeId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                >
                  <option value="">-- Choose Payment Scheme --</option>
                  {schemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Max Disc: {s.maxDiscountPct}%)
                    </option>
                  ))}
                </select>

                {selectedScheme && (
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-dark-750 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Max Allowed Discount:</span>
                      <span className="font-semibold text-amber-600">{selectedScheme.maxDiscountPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Stamp Duty By Builder:</span>
                      <span>{selectedScheme.stampByBuilder ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Registration By Builder:</span>
                      <span>{selectedScheme.registrationByBuilder ? "Yes" : "No"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Financial Snapshot */}
            {previewCalc && (
              <div className="mt-4 p-4 rounded-xl bg-primary-50/50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-900/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-primary-900 dark:text-primary-200 flex items-center gap-1.5">
                    <CurrencyRupeeIcon className="size-4 text-primary-600" />
                    Live Cost Calculation Preview
                  </h4>
                  {calculating && <span className="text-[11px] text-primary-600 animate-pulse">Calculating...</span>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white dark:bg-dark-700 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400">Basic Cost</span>
                    <div className="font-bold text-slate-900 dark:text-dark-100">
                      ₹{previewCalc.basicCost.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-dark-700 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400">Floor Rise + PLC</span>
                    <div className="font-bold text-slate-900 dark:text-dark-100">
                      ₹{(previewCalc.floorRiseAmt + previewCalc.plcAmt).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-dark-700 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400">Net Agreement Value</span>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{previewCalc.netAgreementValue.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-dark-700 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400">Grand Total (All-Incl)</span>
                    <div className="font-bold text-primary-600 dark:text-primary-400">
                      ₹{previewCalc.grandTotalInclGst.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Step 2: Primary Applicant */}
        {currentStep === 2 && (
          <Card className="p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-dark-700 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
                  <UserIcon className="size-5 text-primary-600" />
                  Step 2: Primary Applicant Details
                </h3>
                <p className="text-xs text-slate-500">
                  Enter legal name, contact info, PAN and Aadhaar number for agreement.
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-medium border border-emerald-200 dark:border-emerald-900">
                <ShieldCheckIcon className="size-4" />
                AES-256-GCM Encrypted
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  Title
                </label>
                <select
                  value={applicant.title}
                  onChange={(e) => setApplicant({ ...applicant, title: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh"
                  value={applicant.firstName}
                  onChange={(e) => setApplicant({ ...applicant, firstName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={applicant.middleName}
                  onChange={(e) => setApplicant({ ...applicant, middleName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sharma"
                  value={applicant.lastName}
                  onChange={(e) => setApplicant({ ...applicant, lastName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={applicant.dob}
                  onChange={(e) => setApplicant({ ...applicant, dob: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  Gender
                </label>
                <select
                  value={applicant.gender}
                  onChange={(e) => setApplicant({ ...applicant, gender: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  Occupation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Salaried / Business"
                  value={applicant.occupation}
                  onChange={(e) => setApplicant({ ...applicant, occupation: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  maxLength={10}
                  value={applicant.mobile}
                  onChange={(e) => setApplicant({ ...applicant, mobile: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. rajesh.sharma@example.com"
                  value={applicant.email}
                  onChange={(e) => setApplicant({ ...applicant, email: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  PAN Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  value={applicant.pan}
                  onChange={(e) => setApplicant({ ...applicant, pan: e.target.value.toUpperCase() })}
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1 flex items-center justify-between">
                  <span>Aadhaar Number</span>
                  <LockClosedIcon className="size-3 text-emerald-600" />
                </label>
                <input
                  type="text"
                  placeholder="12 digits (encrypted at rest)"
                  maxLength={14}
                  value={applicant.aadhaar}
                  onChange={(e) => setApplicant({ ...applicant, aadhaar: e.target.value })}
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  Permanent Address
                </label>
                <input
                  type="text"
                  placeholder="House/Flat No, Building, Street, Area"
                  value={applicant.permanentAddress}
                  onChange={(e) => setApplicant({ ...applicant, permanentAddress: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  placeholder="400001"
                  maxLength={6}
                  value={applicant.pincode}
                  onChange={(e) => setApplicant({ ...applicant, pincode: e.target.value })}
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-dark-750 p-3 rounded-lg flex items-center gap-2 text-xs text-slate-600 dark:text-dark-300">
              <InformationCircleIcon className="size-4 text-primary-600 shrink-0" />
              <span>
                <strong>Aadhaar Privacy Notice:</strong> BuildERP encrypts Aadhaar numbers using AES-256-GCM cipher keys. The full 12 digits are never exposed in UI or customer portal; only masked digits <code>XXXX-XXXX-1234</code> will be shown.
              </span>
            </div>
          </Card>
        )}

        {/* Step 3: Co-Applicants */}
        {currentStep === 3 && (
          <Card className="p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-dark-700 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
                  <UsersIcon className="size-5 text-primary-600" />
                  Step 3: Co-Applicants &amp; Joint Owners
                </h3>
                <p className="text-xs text-slate-500">
                  Add up to 3 joint owners or co-borrowers for registration and loan sanction.
                </p>
              </div>
              {coApplicants.length < 3 && (
                <Button
                  variant="outlined"
                  onClick={addCoApplicant}
                  className="text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <PlusIcon className="size-4" />
                  Add Co-Applicant
                </Button>
              )}
            </div>

            {coApplicants.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <UsersIcon className="size-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700 dark:text-dark-200">No Co-Applicants Added</p>
                <p className="text-xs text-slate-400 mt-1">
                  If there are no joint owners or co-borrowers, you can proceed to the next step.
                </p>
                <Button
                  variant="outlined"
                  onClick={addCoApplicant}
                  className="mt-3 text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                >
                  <PlusIcon className="size-4" />
                  Add Joint Owner
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {coApplicants.map((co, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-slate-200 dark:border-dark-700 rounded-xl bg-slate-50/50 dark:bg-dark-750/50 relative space-y-3"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-dark-700 pb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-dark-100">
                        Co-Applicant #{idx + 1}
                      </span>
                      <button
                        onClick={() => removeCoApplicant(idx)}
                        className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <TrashIcon className="size-3.5" />
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-dark-300 mb-1">
                          Relation
                        </label>
                        <select
                          value={co.relation}
                          onChange={(e) => updateCoApplicant(idx, "relation", e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700"
                        >
                          <option value="Spouse">Spouse</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Son">Son</option>
                          <option value="Daughter">Daughter</option>
                          <option value="Brother">Brother</option>
                          <option value="Sister">Sister</option>
                          <option value="Partner">Business Partner</option>
                          <option value="Co-Owner">Co-Owner</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-dark-300 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={co.firstName}
                          onChange={(e) => updateCoApplicant(idx, "firstName", e.target.value)}
                          placeholder="First Name"
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-dark-300 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={co.lastName}
                          onChange={(e) => updateCoApplicant(idx, "lastName", e.target.value)}
                          placeholder="Last Name"
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-dark-300 mb-1">
                          PAN Number
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          value={co.pan}
                          onChange={(e) => updateCoApplicant(idx, "pan", e.target.value.toUpperCase())}
                          placeholder="ABCDE1234F"
                          className="w-full text-xs font-mono uppercase p-2 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-dark-300 mb-1 flex items-center justify-between">
                          <span>Aadhaar Number</span>
                          <LockClosedIcon className="size-3 text-emerald-600" />
                        </label>
                        <input
                          type="text"
                          maxLength={14}
                          value={co.aadhaar}
                          onChange={(e) => updateCoApplicant(idx, "aadhaar", e.target.value)}
                          placeholder="12 digits"
                          className="w-full text-xs font-mono p-2 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-dark-300 mb-1">
                          Mobile
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          value={co.mobile}
                          onChange={(e) => updateCoApplicant(idx, "mobile", e.target.value)}
                          placeholder="10-digit mobile"
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-dark-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={co.email}
                          onChange={(e) => updateCoApplicant(idx, "email", e.target.value)}
                          placeholder="Email address"
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Step 4: Cost & Taxes */}
        {currentStep === 4 && (
          <Card className="p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-dark-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
                <CurrencyRupeeIcon className="size-5 text-primary-600" />
                Step 4: Pricing, Discounts &amp; Statutory Taxes
              </h3>
              <p className="text-xs text-slate-500">
                Review base cost, floor rise, applied discounts and Maharashtra statutory taxes.
              </p>
            </div>

            {/* Discount Form */}
            <div className="bg-slate-50 dark:bg-dark-750 p-4 rounded-xl border border-slate-200 dark:border-dark-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-dark-100">
                    Discount Configuration
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Scheme Max Allowed: <strong>{maxAllowedDiscount}%</strong>
                  </p>
                </div>
                {isDiscountOverLimit && (
                  <Badge color="warning" className="text-[11px]">
                    Requires Sales Head Approval (&gt; {maxAllowedDiscount}%)
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-dark-300 mb-1">
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="15"
                    value={discountPct}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setDiscountPct(v);
                      setFlatDiscountAmt(0);
                    }}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-dark-300 mb-1">
                    Flat Discount Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={flatDiscountAmt}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setFlatDiscountAmt(v);
                      setDiscountPct(0);
                    }}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Comprehensive Pricing & Tax Breakdown Table */}
            {previewCalc ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Cost Sheet Lines */}
                <div className="border border-slate-200 dark:border-dark-700 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 dark:bg-dark-700 px-3 py-2 font-bold text-slate-800 dark:text-dark-100 border-b border-slate-200 dark:border-dark-700">
                    Agreement Value Breakdown
                  </div>
                  <table className="w-full">
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                      <tr>
                        <td className="p-2.5 text-slate-600 dark:text-dark-300">Basic Cost ({selectedUnit?.carpetArea} sqft @ ₹{previewCalc.baseRate}/sqft)</td>
                        <td className="p-2.5 text-right font-mono font-semibold">₹{previewCalc.basicCost.toLocaleString("en-IN")}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-600 dark:text-dark-300">Floor Rise (Floor {selectedUnit?.floor?.levelNo || 0})</td>
                        <td className="p-2.5 text-right font-mono">₹{previewCalc.floorRiseAmt.toLocaleString("en-IN")}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-600 dark:text-dark-300">Prime Location Charges (PLC)</td>
                        <td className="p-2.5 text-right font-mono">₹{previewCalc.plcAmt.toLocaleString("en-IN")}</td>
                      </tr>
                      {previewCalc.discountAmt > 0 && (
                        <tr className="text-amber-600 bg-amber-50/50 dark:bg-amber-950/20">
                          <td className="p-2.5">Discount ({previewCalc.discountPct.toFixed(2)}%)</td>
                          <td className="p-2.5 text-right font-mono font-semibold">-₹{previewCalc.discountAmt.toLocaleString("en-IN")}</td>
                        </tr>
                      )}
                      <tr className="bg-emerald-50 dark:bg-emerald-950/30 font-bold text-emerald-800 dark:text-emerald-300">
                        <td className="p-2.5">Net Agreement Value</td>
                        <td className="p-2.5 text-right font-mono text-sm">₹{previewCalc.netAgreementValue.toLocaleString("en-IN")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Statutory Taxes Lines */}
                <div className="border border-slate-200 dark:border-dark-700 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 dark:bg-dark-700 px-3 py-2 font-bold text-slate-800 dark:text-dark-100 border-b border-slate-200 dark:border-dark-700">
                    Statutory Government Taxes (Maharashtra)
                  </div>
                  <table className="w-full">
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                      <tr>
                        <td className="p-2.5 text-slate-600 dark:text-dark-300">GST ({previewCalc.gstPct}%)</td>
                        <td className="p-2.5 text-right font-mono">₹{previewCalc.gstAmt.toLocaleString("en-IN")}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-600 dark:text-dark-300">Stamp Duty ({previewCalc.stampDutyPct}%)</td>
                        <td className="p-2.5 text-right font-mono">₹{previewCalc.stampDutyAmt.toLocaleString("en-IN")}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-600 dark:text-dark-300">Metro Cess ({previewCalc.metroCessPct}%)</td>
                        <td className="p-2.5 text-right font-mono">₹{previewCalc.metroCessAmt.toLocaleString("en-IN")}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-600 dark:text-dark-300">Registration Fee (Capped ₹30k)</td>
                        <td className="p-2.5 text-right font-mono">₹{previewCalc.registrationAmt.toLocaleString("en-IN")}</td>
                      </tr>
                      <tr className="bg-indigo-50 dark:bg-indigo-950/30 font-bold text-indigo-900 dark:text-indigo-200">
                        <td className="p-2.5">Statutory Taxes Total</td>
                        <td className="p-2.5 text-right font-mono text-sm">₹{previewCalc.statutoryTaxesTotal.toLocaleString("en-IN")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400">Loading pricing calculation...</div>
            )}

            {/* TDS Advisory Banner */}
            {previewCalc && previewCalc.netAgreementValue >= 5000000 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
                <InformationCircleIcon className="size-5 shrink-0 text-blue-600" />
                <div>
                  <strong>Statutory TDS Compliance (Section 194-IA):</strong> Because Agreement Value is ₹50,00,000 or above, buyer is mandated under Indian Income Tax Act to deduct 1% TDS (₹{Math.round(previewCalc.netAgreementValue * 0.01).toLocaleString("en-IN")}) from installment payments and deposit using Form 26QB.
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Step 5: Charges & Parking */}
        {currentStep === 5 && (
          <Card className="p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-dark-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
                <TruckIcon className="size-5 text-primary-600" />
                Step 5: Parking Slot &amp; 16 Extra Charge Heads
              </h3>
              <p className="text-xs text-slate-500">
                Allocate designated stilt parking bay and review society &amp; development charges with 18% GST.
              </p>
            </div>

            {/* Parking Slot Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                Allocate Parking Slot (Stilt / Covered)
              </label>
              <select
                value={selectedParkingSlotId}
                onChange={(e) => setSelectedParkingSlotId(e.target.value ? Number(e.target.value) : "")}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
              >
                <option value="">-- No Dedicated Parking Slot --</option>
                {parkingSlots.map((p) => (
                  <option key={p.id} value={p.id}>
                    Slot {p.slotNo} ({p.type.toUpperCase()}) - ₹{parseFloat(p.price).toLocaleString("en-IN")}
                  </option>
                ))}
              </select>
            </div>

            {/* 16 Charge Heads Breakdown */}
            {previewCalc && previewCalc.otherChargesBreakdown && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-dark-100">
                    16 Extra Charge Heads Breakdown
                  </h4>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-dark-100">
                    Total: ₹{previewCalc.otherChargesGrandTotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-dark-700 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-dark-750 text-slate-600 dark:text-dark-300 border-b border-slate-200 dark:border-dark-700 sticky top-0">
                      <tr>
                        <th className="p-2">Charge Head</th>
                        <th className="p-2 text-right">Base Amount</th>
                        <th className="p-2 text-right">GST (18%)</th>
                        <th className="p-2 text-right font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                      {previewCalc.otherChargesBreakdown.map((ch: any) => (
                        <tr key={ch.code} className="hover:bg-slate-50 dark:hover:bg-dark-750">
                          <td className="p-2 font-medium">{ch.name}</td>
                          <td className="p-2 text-right font-mono">₹{ch.baseAmount.toLocaleString("en-IN")}</td>
                          <td className="p-2 text-right font-mono text-slate-400">₹{ch.gstAmount.toLocaleString("en-IN")}</td>
                          <td className="p-2 text-right font-mono font-semibold">₹{ch.totalAmount.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Step 6: Booking Amount & Payment Mode */}
        {currentStep === 6 && (
          <Card className="p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-dark-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
                <CreditCardIcon className="size-5 text-primary-600" />
                Step 6: Token Booking Amount &amp; Payment Instrument
              </h3>
              <p className="text-xs text-slate-500">
                Record the earnest money deposit / token amount collected at booking time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  Token Booking Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="10000"
                  step="10000"
                  value={bookingAmount}
                  onChange={(e) => setBookingAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono font-bold p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-900 dark:text-dark-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                >
                  <option value="NEFT">NEFT / RTGS</option>
                  <option value="Cheque">Bank Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="Demand Draft">Demand Draft (DD)</option>
                  <option value="Debit Card">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  Transaction / Cheque / UTR Ref No
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR198273645 / CHQ-009182"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  Booking Date
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-dark-200 mb-1">
                  Sales Remarks &amp; Special Conditions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Token paid via NEFT to HDFC Escrow. Balance Stage A due within 15 days."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-slate-800 dark:text-dark-100"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Step 7: Review & Submit */}
        {currentStep === 7 && (
          <Card className="p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-dark-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-dark-100 flex items-center gap-2">
                <CheckCircleIcon className="size-5 text-emerald-600" />
                Step 7: Final Review &amp; Allotment Submission
              </h3>
              <p className="text-xs text-slate-500">
                Confirm all particulars before locking the unit and generating milestone demand schedule.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Unit & Allotment Box */}
              <div className="p-4 bg-slate-50 dark:bg-dark-750 rounded-xl space-y-2 border border-slate-200 dark:border-dark-700">
                <h4 className="font-bold text-slate-800 dark:text-dark-100 border-b pb-1">
                  Unit &amp; Scheme Details
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unit Number:</span>
                  <span className="font-bold">{selectedUnit?.unitNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Carpet Area:</span>
                  <span className="font-mono">{selectedUnit?.carpetArea} sqft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Floor Level:</span>
                  <span>Floor {selectedUnit?.floor?.levelNo || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Scheme:</span>
                  <span className="font-semibold">{selectedScheme?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Parking Slot:</span>
                  <span>
                    {parkingSlots.find((p) => p.id === Number(selectedParkingSlotId))?.slotNo || "None"}
                  </span>
                </div>
              </div>

              {/* Applicant Summary */}
              <div className="p-4 bg-slate-50 dark:bg-dark-750 rounded-xl space-y-2 border border-slate-200 dark:border-dark-700">
                <h4 className="font-bold text-slate-800 dark:text-dark-100 border-b pb-1">
                  Applicant Details
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">Primary Applicant:</span>
                  <span className="font-bold">
                    {applicant.title} {applicant.firstName} {applicant.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile &amp; Email:</span>
                  <span>{applicant.mobile} • {applicant.email || "No email"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PAN:</span>
                  <span className="font-mono font-bold">{applicant.pan || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Aadhaar (Masked):</span>
                  <span className="font-mono text-emerald-600 font-bold">
                    {applicant.aadhaar ? `XXXX-XXXX-${applicant.aadhaar.slice(-4)}` : "None"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Co-Applicants:</span>
                  <span>{coApplicants.length} Joint Owner(s)</span>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="md:col-span-2 p-4 bg-primary-50/50 dark:bg-primary-950/20 rounded-xl space-y-2 border border-primary-200 dark:border-primary-900/50">
                <h4 className="font-bold text-primary-900 dark:text-primary-200 border-b border-primary-200 pb-1">
                  Financial Summary &amp; Token
                </h4>
                {previewCalc && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500">Agreement Value</span>
                      <div className="font-bold text-sm font-mono text-slate-900 dark:text-dark-100">
                        ₹{previewCalc.netAgreementValue.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Statutory Taxes</span>
                      <div className="font-bold text-sm font-mono text-slate-900 dark:text-dark-100">
                        ₹{previewCalc.statutoryTaxesTotal.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Grand Total (All-Incl)</span>
                      <div className="font-bold text-base font-mono text-primary-700 dark:text-primary-300">
                        ₹{previewCalc.grandTotalInclGst.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Token Amount Paid</span>
                      <div className="font-bold text-base font-mono text-emerald-600">
                        ₹{bookingAmount.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Approval Warning if Discount Exceeded */}
            {isDiscountOverLimit && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                <ExclamationTriangleIcon className="size-5 shrink-0 text-amber-600" />
                <div>
                  <strong>Pending Approval Status:</strong> The requested discount of <strong>{discountPct}%</strong> exceeds the payment scheme allowance of <strong>{maxAllowedDiscount}%</strong>. This booking will be created with status <code>pending_approval</code> and routed to the Sales Head for authorization before milestone demand generation.
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-dark-700">
          <Button
            variant="outlined"
            onClick={handlePrev}
            disabled={currentStep === 1 || submitting}
            className="text-xs py-2 px-4 flex items-center gap-1.5"
          >
            <ArrowLeftIcon className="size-4" />
            Previous
          </Button>

          {currentStep < 7 ? (
            <Button
              color="primary"
              onClick={handleNext}
              className="text-xs py-2 px-5 flex items-center gap-1.5 shadow-sm"
            >
              Continue
              <ArrowRightIcon className="size-4" />
            </Button>
          ) : (
            <Button
              color="primary"
              onClick={handleSubmitBooking}
              disabled={submitting}
              className="text-xs py-2.5 px-6 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md font-bold"
            >
              <CheckCircleIcon className="size-5" />
              {submitting ? "Submitting Booking..." : "Confirm & Submit Booking"}
            </Button>
          )}
        </div>
      </div>
    </Page>
  );
}
