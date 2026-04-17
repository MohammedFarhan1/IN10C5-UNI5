"use client";

import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useActionState,
  useMemo,
  useRef,
  useState
} from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActionState } from "@/types";

type AuthFormProps = {
  mode: "login" | "signup";
  action: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
};

const initialState: ActionState = {};
const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);
const selectionStep = {
  title: "Choose Account Type",
  description: "Select the onboarding path that matches how you want to use the marketplace."
} as const;
const customerSignupSteps = [
  selectionStep,
  {
    title: "Account Info",
    description: "Create your customer account and continue straight to shopping."
  }
] as const;
const sellerSignupSteps = [
  selectionStep,
  {
    title: "Account Info",
    description: "Create your login and start the seller verification process."
  },
  {
    title: "Business Details",
    description: "Tell us who owns the account and who the team should contact."
  },
  {
    title: "Legal Details",
    description: "Add the identifiers needed for seller verification."
  },
  {
    title: "Document Upload",
    description: "Upload the documents the admin team will review."
  },
  {
    title: "Review & Submit",
    description: "Confirm everything before sending the seller application."
  }
] as const;

function CustomerIcon() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
      <path
        d="M7.5 18.25a4.75 4.75 0 0 1 9 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="8.75" r="3.25" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function SellerIcon() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 18.25h10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M8.75 18.25v-7.5h6.5v7.5"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M6.75 10.75 12 5.75l5.25 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function RoleSelectionCard({
  title,
  description,
  icon,
  selected,
  onSelect
}: {
  title: string;
  description: string;
  icon: ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`group rounded-[24px] border p-5 text-left transition ${
        selected
          ? "border-brand-ink bg-white text-brand-ink shadow-soft ring-2 ring-brand-gold/30"
          : "border-slate-200 bg-white/80 text-slate-600 hover:-translate-y-0.5 hover:border-brand-gold/60 hover:bg-white hover:shadow-soft active:translate-y-0"
      }`}
      onClick={onSelect}
      type="button"
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
          selected
            ? "bg-brand-ink text-white"
            : "bg-slate-100 text-slate-500 group-hover:bg-brand-gold/15 group-hover:text-brand-ink"
        }`}
      >
        {icon}
      </div>
      <p className="mt-4 text-lg font-semibold text-brand-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </button>
  );
}

function SignupProgress({
  activeStep,
  steps
}: {
  activeStep: number;
  steps: ReadonlyArray<{ title: string }>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-pine">
            Signup progress
          </p>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Step {activeStep + 1} of {steps.length}
          </p>
        </div>
        <p className="text-sm font-semibold text-brand-ink">
          {Math.round(((activeStep + 1) / steps.length) * 100)}%
        </p>
      </div>

      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isCompleted = index < activeStep;
          const isActive = index === activeStep;

          return (
            <div className="flex min-w-0 flex-1 items-center gap-2" key={`${step.title}-${index}`}>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition sm:h-9 sm:w-9 sm:text-sm ${
                  isActive
                    ? "border-brand-ink bg-brand-ink text-white"
                    : isCompleted
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 ? (
                <div
                  className={`hidden h-1 flex-1 rounded-full sm:block ${
                    isCompleted ? "bg-emerald-300" : "bg-slate-200"
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-brand-ink">{value || "Not provided"}</p>
    </div>
  );
}

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const stepSectionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [selectedRole, setSelectedRole] = useState<"customer" | "seller" | null>(null);
  const [currentSignupStep, setCurrentSignupStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [spocName, setSpocName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [cin, setCin] = useState("");
  const [gst, setGst] = useState("");
  const [trademarkFileName, setTrademarkFileName] = useState("");
  const [additionalDocumentFileName, setAdditionalDocumentFileName] = useState("");
  const [clientError, setClientError] = useState("");
  const isSignup = mode === "signup";
  const isSellerSignup = isSignup && selectedRole === "seller";
  const activeSteps = useMemo(
    () =>
      selectedRole === "seller"
        ? sellerSignupSteps
        : customerSignupSteps,
    [selectedRole]
  );
  const activeStepMeta = activeSteps[Math.min(currentSignupStep, activeSteps.length - 1)];

  function validateStep(step: number) {
    const section = stepSectionRefs.current[step];

    if (!section) {
      return true;
    }

    const controls = Array.from(
      section.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input, select, textarea"
      )
    );

    for (const control of controls) {
      if (!control.checkValidity()) {
        control.reportValidity();
        return false;
      }
    }

    return true;
  }

  function handleRoleSelection(role: "customer" | "seller") {
    setSelectedRole(role);
    setCurrentSignupStep(1);
    setClientError("");
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void,
    label: string
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      setter("");
      setClientError("");
      return;
    }

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      event.target.value = "";
      setter("");
      setClientError(`${label} must be 10 MB or smaller.`);
      return;
    }

    if (file.type && !ALLOWED_DOCUMENT_TYPES.has(file.type)) {
      event.target.value = "";
      setter("");
      setClientError(`${label} must be a PDF, JPG, PNG, or WebP file.`);
      return;
    }

    setter(file.name);
    setClientError("");
  }

  function handleNextStep() {
    if (!validateStep(currentSignupStep)) {
      return;
    }

    setCurrentSignupStep((step) => Math.min(step + 1, activeSteps.length - 1));
  }

  function handleBackStep() {
    setCurrentSignupStep((step) => Math.max(step - 1, 0));
    setClientError("");
  }

  function handleSignupSubmit(event: FormEvent<HTMLFormElement>) {
    if (!isSellerSignup) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const trademarkFile = formData.get("trademark_file");
    const additionalDocumentFile = formData.get("additional_document_file");

    const sellerFiles = [
      {
        file: trademarkFile instanceof File && trademarkFile.size > 0 ? trademarkFile : null,
        label: "Trademark document"
      },
      {
        file:
          additionalDocumentFile instanceof File && additionalDocumentFile.size > 0
            ? additionalDocumentFile
            : null,
        label: "Additional document"
      }
    ];

    for (const entry of sellerFiles) {
      if (!entry.file) {
        event.preventDefault();
        setClientError(`${entry.label} is required.`);
        return;
      }

      if (entry.file.size > MAX_DOCUMENT_SIZE_BYTES) {
        event.preventDefault();
        setClientError(`${entry.label} must be 10 MB or smaller.`);
        return;
      }

      if (entry.file.type && !ALLOWED_DOCUMENT_TYPES.has(entry.file.type)) {
        event.preventDefault();
        setClientError(`${entry.label} must be a PDF, JPG, PNG, or WebP file.`);
        return;
      }
    }

    setClientError("");
  }

  const sellerApplicationSummary = [
    { label: "Email", value: email || "Not provided" },
    {
      label: "Password",
      value: password ? `${"\u2022".repeat(Math.min(password.length, 12))} (${password.length} characters)` : "Not set"
    },
    { label: "Account Type", value: "Seller" },
    { label: "Business Name", value: businessName || "Not provided" },
    { label: "SPOC Name", value: spocName || "Not provided" },
    { label: "Mobile Number", value: mobileNumber || "Not provided" },
    { label: "CIN Number", value: cin || "Not provided" },
    { label: "GST Number", value: gst || "Not provided" },
    { label: "Trademark File", value: trademarkFileName || "Not uploaded" },
    {
      label: "Additional Document",
      value: additionalDocumentFileName || "Not uploaded"
    }
  ];

  if (!isSignup) {
    return (
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <Input id="email" name="email" placeholder="you@example.com" required type="email" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            minLength={6}
            name="password"
            placeholder="Enter your password"
            required
            type="password"
          />
        </div>

        {state.error ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {state.error}
          </p>
        ) : null}

        {state.success ? (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {state.success}
          </p>
        ) : null}

        <Button className="w-full" disabled={pending} type="submit">
          {pending ? "Please wait..." : "Sign in"}
        </Button>

        <p className="text-center text-sm text-slate-600">
          Need an account?{" "}
          <Link className="font-semibold text-brand-pine transition hover:text-brand-ink" href="/signup">
            Sign up
          </Link>
        </p>
      </form>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" onSubmit={handleSignupSubmit}>
      <input name="role" type="hidden" value={selectedRole ?? ""} />
      {currentSignupStep > 0 ? (
        <>
          <SignupProgress activeStep={currentSignupStep - 1} steps={activeSteps.slice(1)} />

          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-brand-ink sm:text-2xl">
              {activeStepMeta?.title ?? "Account Info"}
            </h3>
            <p className="text-sm leading-6 text-slate-600">{activeStepMeta?.description}</p>
          </div>
        </>
      ) : (
        <div className="space-y-1 text-center">
          <h3 className="text-xl font-semibold text-brand-ink sm:text-2xl">
            {selectionStep.title}
          </h3>
          <p className="text-sm leading-6 text-slate-600">{selectionStep.description}</p>
        </div>
      )}

      <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
        <div
          className={currentSignupStep === 0 ? "space-y-4" : "hidden"}
          ref={(node) => {
            stepSectionRefs.current[0] = node;
          }}
        >
          <div className="mx-auto grid max-w-[460px] gap-4 sm:grid-cols-2">
            <RoleSelectionCard
              description="Shop products, place orders, and track your purchases with a lightweight account."
              icon={<CustomerIcon />}
              onSelect={() => handleRoleSelection("customer")}
              selected={selectedRole === "customer"}
              title="Customer"
            />
            <RoleSelectionCard
              description="Create a seller account, upload verification details, and manage your catalog after approval."
              icon={<SellerIcon />}
              onSelect={() => handleRoleSelection("seller")}
              selected={selectedRole === "seller"}
              title="Seller"
            />
          </div>
        </div>

        <div
          className={currentSignupStep === 1 ? "space-y-4" : "hidden"}
          ref={(node) => {
            stepSectionRefs.current[1] = node;
          }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                minLength={6}
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                type="password"
                value={password}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Selected account type
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-ink">
                {selectedRole === "seller" ? "Seller" : "Customer"}
              </p>
            </div>
          </div>
        </div>

        {isSellerSignup ? (
          <>
            <div
              className={currentSignupStep === 2 ? "space-y-4" : "hidden"}
              ref={(node) => {
                stepSectionRefs.current[2] = node;
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="business_name">
                    Business Name
                  </label>
                  <Input
                    id="business_name"
                    name="business_name"
                    onChange={(event) => setBusinessName(event.target.value)}
                    placeholder="Your registered business name"
                    required={isSellerSignup}
                    value={businessName}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="spoc_name">
                    SPOC Name
                  </label>
                  <Input
                    id="spoc_name"
                    name="spoc_name"
                    onChange={(event) => setSpocName(event.target.value)}
                    placeholder="Primary contact person"
                    required={isSellerSignup}
                    value={spocName}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="mobile_number">
                    Mobile Number
                  </label>
                  <Input
                    id="mobile_number"
                    name="mobile_number"
                    onChange={(event) => setMobileNumber(event.target.value)}
                    placeholder="+91 98765 43210"
                    required={isSellerSignup}
                    type="tel"
                    value={mobileNumber}
                  />
                </div>
              </div>
            </div>

            <div
              className={currentSignupStep === 3 ? "space-y-4" : "hidden"}
              ref={(node) => {
                stepSectionRefs.current[3] = node;
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="cin">
                    CIN Number
                  </label>
                  <Input
                    id="cin"
                    name="cin"
                    onChange={(event) => setCin(event.target.value)}
                    placeholder="L12345MH2026PLC000001"
                    required={isSellerSignup}
                    value={cin}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="gst">
                    GST Number
                  </label>
                  <Input
                    id="gst"
                    name="gst"
                    onChange={(event) => setGst(event.target.value)}
                    placeholder="27ABCDE1234F1Z5"
                    required={isSellerSignup}
                    value={gst}
                  />
                </div>
              </div>
            </div>

            <div
              className={currentSignupStep === 4 ? "space-y-4" : "hidden"}
              ref={(node) => {
                stepSectionRefs.current[4] = node;
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="trademark_file">
                    Trademark Upload
                  </label>
                  <label
                    className="block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-600 transition hover:border-brand-gold hover:bg-brand-gold/5"
                    htmlFor="trademark_file"
                  >
                    <span className="font-medium text-brand-ink">
                      {trademarkFileName || "Choose trademark file"}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      PDF, JPG, PNG, or WebP up to 10 MB
                    </span>
                  </label>
                  <Input
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    id="trademark_file"
                    name="trademark_file"
                    onChange={(event) =>
                      handleFileChange(event, setTrademarkFileName, "Trademark document")
                    }
                    required={isSellerSignup}
                    type="file"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="additional_document_file">
                    Additional Document Upload
                  </label>
                  <label
                    className="block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-600 transition hover:border-brand-gold hover:bg-brand-gold/5"
                    htmlFor="additional_document_file"
                  >
                    <span className="font-medium text-brand-ink">
                      {additionalDocumentFileName || "Choose supporting document"}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      PDF, JPG, PNG, or WebP up to 10 MB
                    </span>
                  </label>
                  <Input
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    id="additional_document_file"
                    name="additional_document_file"
                    onChange={(event) =>
                      handleFileChange(event, setAdditionalDocumentFileName, "Additional document")
                    }
                    required={isSellerSignup}
                    type="file"
                  />
                </div>
              </div>
            </div>

            <div
              className={currentSignupStep === 5 ? "space-y-4" : "hidden"}
              ref={(node) => {
                stepSectionRefs.current[5] = node;
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {sellerApplicationSummary.map((item) => (
                  <ReviewRow key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {clientError ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {clientError}
        </p>
      ) : null}

      {state.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      {currentSignupStep > 0 ? (
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <Button
            className="min-w-[96px] sm:min-w-[120px]"
            disabled={pending}
            onClick={handleBackStep}
            type="button"
            variant="secondary"
          >
            Back
          </Button>

          <div className="flex gap-2">
            {isSellerSignup && currentSignupStep < activeSteps.length - 1 ? (
              <Button className="min-w-[120px] sm:min-w-[140px]" disabled={pending} onClick={handleNextStep} type="button">
                Next
              </Button>
            ) : (
              <Button className="min-w-[160px] sm:min-w-[200px]" disabled={pending} type="submit">
                {pending
                  ? "Please wait..."
                  : isSellerSignup
                    ? "Submit seller application"
                    : "Create customer account"}
              </Button>
            )}
          </div>
        </div>
      ) : null}

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          className="font-semibold text-brand-pine transition hover:text-brand-ink"
          href="/login"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
