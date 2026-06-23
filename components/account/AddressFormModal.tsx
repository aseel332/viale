"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import { addAddress, updateAddress } from "@/app/actions/addresses";
import type { AddressActionState } from "@/app/actions/addresses";
import type { AddressRow } from "@/types/database";
import AddressAutocomplete, { type GeocodeSuggestion } from "./AddressAutocomplete";

type Draft = {
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
};

const INDIA_STATES: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang"],
  Assam: ["Guwahati", "Dibrugarh", "Silchar", "Jorhat"],
  Bihar: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
  Chandigarh: ["Chandigarh"],
  Chhattisgarh: ["Raipur", "Bhilai", "Bilaspur", "Korba"],
  Delhi: ["New Delhi", "Delhi"],
  Goa: ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  Haryana: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Hisar"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Manali", "Solan"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
  Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"],
  Ladakh: ["Leh", "Kargil"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Navi Mumbai"],
  Manipur: ["Imphal", "Thoubal", "Bishnupur"],
  Meghalaya: ["Shillong", "Tura", "Jowai"],
  Mizoram: ["Aizawl", "Lunglei", "Champhai"],
  Nagaland: ["Kohima", "Dimapur", "Mokokchung"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela", "Puri"],
  Puducherry: ["Puducherry", "Karaikal"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
  Sikkim: ["Gangtok", "Namchi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  Tripura: ["Agartala", "Udaipur", "Dharmanagar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Varanasi", "Agra"],
  Uttarakhand: ["Dehradun", "Haridwar", "Rishikesh", "Haldwani"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol"],
};

const emptyDraft: Draft = {
  label: "Home",
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  postal_code: "",
  is_default: false,
};

interface Props {
  open: boolean;
  address?: AddressRow | null;
  onClose: () => void;
  onSaved?: () => void;
}

function toDraft(address?: AddressRow | null): Draft {
  if (!address) return emptyDraft;
  return {
    label: address.label,
    full_name: address.full_name,
    phone: address.phone ?? "",
    line1: address.line1,
    line2: address.line2 ?? "",
    landmark: address.landmark ?? "",
    city: address.city,
    state: address.state,
    postal_code: address.postal_code,
    is_default: address.is_default,
  };
}

export default function AddressFormModal({ open, address, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(address));
  const [state, setState] = useState<AddressActionState>({});
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined" || !document.body) return null;

  const title = address ? "Edit Address" : "Add Address";

  function fillFromSuggestion(suggestion: GeocodeSuggestion) {
    setDraft((current) => ({
      ...current,
      line1: suggestion.line1 || current.line1,
      line2: suggestion.line2 || current.line2,
      city: suggestion.city || current.city,
      state: suggestion.state || current.state,
      postal_code: suggestion.postal_code || current.postal_code,
    }));
  }

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(formData: FormData) {
    if (address) formData.set("id", address.id);
    formData.set("country", "IN");
    startTransition(async () => {
      const result = address
        ? await updateAddress({}, formData)
        : await addAddress({}, formData);

      setState(result);
      if (!result.error) {
        onSaved?.();
        onClose();
      }
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 animate-fade-in" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90svh] overflow-y-auto bg-white shadow-2xl animate-slide-up"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8E4DE] bg-white px-6 py-5">
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C]">Address Book</p>
            <h2 className="text-2xl font-[family-name:var(--font-cormorant)] italic text-[#111]">{title}</h2>
          </div>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#111] transition-colors" aria-label="Close">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <form action={submit} className="space-y-5 p-6">
          <AddressAutocomplete onSelect={fillFromSuggestion} />

          {state.error && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
          )}

          {address && <input type="hidden" name="id" value={address.id} />}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Label" name="label" value={draft.label} onChange={(v) => setField("label", v)} placeholder="Home" />
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">Country</label>
              <div className="px-4 py-3 bg-[#FAFAF8] border border-[#E8E4DE] text-sm text-[#111]">India</div>
              <input type="hidden" name="country" value="IN" />
            </div>
            <Field label="Recipient Name" name="full_name" value={draft.full_name} onChange={(v) => setField("full_name", v)} className="col-span-2" />
            <Field label="Phone" name="phone" value={draft.phone} onChange={(v) => setField("phone", v)} type="tel" className="col-span-2" />
            <Field label="Address Line 1" name="line1" value={draft.line1} onChange={(v) => setField("line1", v)} placeholder="House no., street, area" className="col-span-2" />
            <Field label="Address Line 2 (optional)" name="line2" value={draft.line2} onChange={(v) => setField("line2", v)} placeholder="House/apartment name, tower, floor" className="col-span-2" />
            <Field label="Landmark" name="landmark" value={draft.landmark} onChange={(v) => setField("landmark", v)} placeholder="e.g. Near Phoenix Mall" className="col-span-2" />
            <ComboboxField
              label="State"
              name="state"
              value={draft.state}
              onChange={(value) => {
                const cities = INDIA_STATES[value] ?? [];
                setDraft((current) => ({
                  ...current,
                  state: value,
                  city: cities.includes(current.city) ? current.city : "",
                }));
              }}
              options={[
                ...new Set([
                  ...Object.keys(INDIA_STATES),
                  ...(draft.state ? [draft.state] : []),
                ]),
              ]}
              placeholder="Type or choose state"
            />
            <ComboboxField
              label="City"
              name="city"
              value={draft.city}
              onChange={(value) => setField("city", value)}
              options={[
                ...new Set([
                  ...(INDIA_STATES[draft.state] ?? []),
                  ...(draft.city ? [draft.city] : []),
                ]),
              ]}
              placeholder={draft.state ? "Type or choose city" : "Type city name"}
            />
            <Field label="Postal Code" name="postal_code" value={draft.postal_code} onChange={(v) => setField("postal_code", v)} />
          </div>

          <label className="flex items-center gap-2 text-[12px] text-[#4A4A4A]">
            <input
              type="checkbox"
              name="is_default"
              checked={draft.is_default}
              onChange={(event) => setField("is_default", event.target.checked)}
              className="accent-[#111]"
            />
            Use as default shipping address
          </label>

          <div className="flex justify-end gap-3 border-t border-[#E8E4DE] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] hover:text-[#111] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 bg-[#111] px-7 py-3 text-[11px] tracking-[0.2em] uppercase text-white hover:bg-[#333] transition-colors disabled:opacity-60"
            >
              {pending && <Loader2 size={14} className="animate-spin" />}
              Save Address
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function ComboboxField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const query = value.trim().toLowerCase();
  const filtered = options
    .filter((option) => option.toLowerCase().includes(query))
    .slice(0, 8);

  return (
    <div className="relative">
      <label className="block text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">{label}</label>
      <input
        name={name}
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-4 py-3 bg-white border border-[#E8E4DE] text-sm text-[#111] placeholder:text-[#B0ADA8] focus:outline-none focus:border-[#111] transition-colors"
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-[95] mt-1 max-h-52 overflow-y-auto border border-[#E8E4DE] bg-white shadow-lg">
          {filtered.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className="block w-full border-b border-[#F0EDE8] px-4 py-2.5 text-left text-[12px] text-[#4A4A4A] last:border-0 hover:bg-[#FAFAF8] hover:text-[#111] transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  className = "",
  type = "text",
  placeholder,
  maxLength,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  type?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className={className}>
      <label className="block text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-4 py-3 bg-white border border-[#E8E4DE] text-sm text-[#111] placeholder:text-[#B0ADA8] focus:outline-none focus:border-[#111] transition-colors"
      />
    </div>
  );
}
