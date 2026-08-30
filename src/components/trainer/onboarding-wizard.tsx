"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface OnboardingWizardProps {
  initialName: string;
  initialProfile?: any;
}

const COMMON_SPECIALTIES = [
  "Strength & Powerlifting Coach",
  "Bodybuilding & Hypertrophy Coach",
  "Fat Loss & Nutrition Specialist",
  "Yoga & Functional Mobility Specialist",
  "CrossFit & High Intensity Coach",
  "Calisthenics & Bodyweight Master",
  "Endurance & Running Specialist",
  "Athletic Performance & Conditioning",
];

const POPULAR_CERTIFICATIONS = [
  "CSCS (Certified Strength & Conditioning)",
  "NSCA-CPT",
  "ACE Certified Personal Trainer",
  "ISSA Personal Trainer",
  "NASM-CPT",
  "Precision Nutrition L1",
  "CrossFit Level 2",
  "RYT 200 Yoga Instructor",
];

export function TrainerOnboardingWizard({
  initialName,
  initialProfile,
}: OnboardingWizardProps) {
  const router = useRouter();

  // Wizard Step
  const [step, setStep] = useState(1);

  // Form State
  const [name, setName] = useState(initialName || "");
  const [specialty, setSpecialty] = useState(initialProfile?.specialty || COMMON_SPECIALTIES[0]);
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [experience, setExperience] = useState<number>(initialProfile?.experience || 3);
  const [price, setPrice] = useState<number>(initialProfile?.price || 999);
  const [bio, setBio] = useState(
    initialProfile?.bio ||
      "Certified fitness coach dedicated to human-led training, custom periodization splits, and weekly accountability checks."
  );
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatarUrl || "");
  const [certifications, setCertifications] = useState<string[]>(
    initialProfile?.tags
      ? initialProfile.tags.filter((t: string) => !t.startsWith("rejection_reason:"))
      : ["CSCS", "Hypertrophy", "Personalized Plan", "Form Checks"]
  );
  const [newCert, setNewCert] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingRequirements, setMissingRequirements] = useState<string[]>([]);

  const effectiveSpecialty = customSpecialty.trim() || specialty;

  const handleAddCert = (certToAdd: string) => {
    const trimmed = certToAdd.trim();
    if (trimmed && !certifications.includes(trimmed)) {
      setCertifications([...certifications, trimmed]);
      setNewCert("");
    }
  };

  const handleRemoveCert = (certToRemove: string) => {
    setCertifications(certifications.filter((c) => c !== certToRemove));
  };

  const handleSubmit = async () => {
    setError(null);
    setMissingRequirements([]);
    setLoading(true);

    try {
      const res = await fetch("/api/trainer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          specialty: effectiveSpecialty,
          experience,
          price,
          bio: bio.trim(),
          tags: certifications,
          avatarUrl: avatarUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish profile.");
      }

      if (!data.isEligible && data.missingRequirements && data.missingRequirements.length > 0) {
        setMissingRequirements(data.missingRequirements);
        setError("Complete your trainer profile to appear in the marketplace.");
        setLoading(false);
        return;
      }

      window.location.href = "/trainer/dashboard?onboarding=published";
    } catch (err: any) {
      console.error("Onboarding submission error:", err);
      setError(err.message || "Failed to submit coaching profile. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[36px] border border-white/10 bg-[#11161D] p-6 md:p-12 shadow-2xl">
      {/* Stepper Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-6">
          {[
            { num: 1, title: "Basic Info" },
            { num: 2, title: "Expertise" },
            { num: 3, title: "Pricing" },
            { num: 4, title: "Preview & Publish" },
          ].map((s) => (
            <div
              key={s.num}
              onClick={() => step > s.num && setStep(s.num)}
              className={`flex items-center gap-2 cursor-pointer transition ${
                step === s.num
                  ? "text-[#7CFF3B] font-bold"
                  : step > s.num
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-600"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  step === s.num
                    ? "bg-[#7CFF3B] text-black shadow-[0_0_15px_rgba(124,255,59,0.4)]"
                    : step > s.num
                    ? "bg-white/10 text-white"
                    : "bg-white/5 text-gray-600"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </div>
              <span className="hidden sm:inline text-xs uppercase tracking-wider">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-xs font-semibold text-rose-300 space-y-2">
          <div className="flex items-center gap-2 text-rose-200 font-bold text-sm">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          {missingRequirements.length > 0 && (
            <ul className="list-disc list-inside space-y-1 text-rose-300 text-xs pl-2 pt-1">
              {missingRequirements.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* STEP 1: Basic Information */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">Step 1 — Basic Coach Information</h3>
            <p className="text-xs text-gray-400 mt-1">
              Tell prospective clients your professional name and coaching headline.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Display Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aryan Singh"
                className="w-full rounded-2xl border border-white/10 bg-[#080B0F] px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#7CFF3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Years of Professional Experience *
              </label>
              <input
                type="number"
                min="1"
                max="40"
                value={experience}
                onChange={(e) => setExperience(parseInt(e.target.value) || 1)}
                className="w-full rounded-2xl border border-white/10 bg-[#080B0F] px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#7CFF3B] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Primary Coaching Specialty *
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#080B0F] px-4 py-3 text-sm text-white focus:border-[#7CFF3B] focus:outline-none"
            >
              {COMMON_SPECIALTIES.map((spec) => (
                <option key={spec} value={spec} className="bg-[#11161D] text-white">
                  {spec}
                </option>
              ))}
              <option value="Custom" className="bg-[#11161D] text-white">
                Other / Custom Specialty
              </option>
            </select>
          </div>

          {specialty === "Custom" && (
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Custom Specialty / Headline
              </label>
              <input
                type="text"
                value={customSpecialty}
                onChange={(e) => setCustomSpecialty(e.target.value)}
                placeholder="e.g. Kettlebell Performance & Rehab"
                className="w-full rounded-2xl border border-white/10 bg-[#080B0F] px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#7CFF3B] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Profile Photo URL (Optional)
            </label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/your-photo.jpg (or leave empty for generated avatar)"
              className="w-full rounded-2xl border border-white/10 bg-[#080B0F] px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#7CFF3B] focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                if (!name.trim()) {
                  setError("Please enter your display name.");
                  return;
                }
                setError(null);
                setStep(2);
              }}
              className="rounded-2xl bg-[#7CFF3B] px-8 py-3.5 text-sm font-bold text-black shadow-[0_0_20px_rgba(124,255,59,0.3)] transition hover:bg-[#68e326]"
            >
              Continue to Expertise →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Expertise & Bio */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">Step 2 — Expertise & Coaching Philosophy</h3>
            <p className="text-xs text-gray-400 mt-1">
              Highlight your credentials, focus tags, and coaching methodology.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Certifications & Focus Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {POPULAR_CERTIFICATIONS.map((cert) => (
                <button
                  key={cert}
                  type="button"
                  onClick={() => handleAddCert(cert.split(" ")[0])}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    certifications.includes(cert.split(" ")[0])
                      ? "border-[#7CFF3B] bg-[#7CFF3B]/10 text-[#7CFF3B]"
                      : "border-white/10 bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  + {cert}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newCert}
                onChange={(e) => setNewCert(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCert(newCert);
                  }
                }}
                placeholder="Type a custom tag (e.g. Powerlifting, Kettlebell, Mobility) and press Enter"
                className="flex-1 rounded-2xl border border-white/10 bg-[#080B0F] px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#7CFF3B] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddCert(newCert)}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold text-white hover:border-[#7CFF3B]"
              >
                Add Tag
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {certifications.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#7CFF3B]/30 bg-[#7CFF3B]/10 px-3.5 py-1 text-xs font-bold text-[#7CFF3B]"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveCert(tag)}
                    className="hover:text-white ml-1 text-sm font-black"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Professional Biography & Coaching Approach *
            </label>
            <textarea
              rows={5}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your training methodology, client transformation approach, and what clients should expect (minimum 20 characters)."
              className="w-full rounded-2xl border border-white/10 bg-[#080B0F] p-4 text-sm text-white placeholder-gray-600 focus:border-[#7CFF3B] focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-gray-300 hover:text-white"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                if (!bio.trim() || bio.trim().length < 20) {
                  setError("Please enter a meaningful biography (minimum 20 characters).");
                  return;
                }
                setError(null);
                setStep(3);
              }}
              className="rounded-2xl bg-[#7CFF3B] px-8 py-3.5 text-sm font-bold text-black shadow-[0_0_20px_rgba(124,255,59,0.3)] transition hover:bg-[#68e326]"
            >
              Continue to Pricing →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Pricing & Coaching Formats */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">Step 3 — Coaching Packages & Base Pricing</h3>
            <p className="text-xs text-gray-400 mt-1">
              Set your monthly starting price. Standard 1-Month, 3-Month, and 6-Month plans will be generated automatically.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Starting Monthly Coaching Rate (₹ INR) *
            </label>
            <div className="flex items-center gap-3">
              {[999, 1499, 1999, 2499, 2999].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrice(p)}
                  className={`rounded-2xl border px-5 py-3 text-sm font-bold transition ${
                    price === p
                      ? "border-[#7CFF3B] bg-[#7CFF3B] text-black shadow-[0_0_15px_rgba(124,255,59,0.3)]"
                      : "border-white/10 bg-[#080B0F] text-gray-300 hover:border-white/30"
                  }`}
                >
                  ₹{p}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <input
                type="number"
                min="499"
                max="50000"
                step="100"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 999)}
                placeholder="Or enter custom rate"
                className="w-full max-w-xs rounded-2xl border border-white/10 bg-[#080B0F] px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#7CFF3B] focus:outline-none"
              />
            </div>
          </div>

          {/* Generated Package Tiers Summary */}
          <div className="rounded-3xl border border-white/10 bg-[#080B0F] p-6 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Automatic Package Tiers for Marketplace
            </h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#11161D] p-4">
                <p className="text-xs text-[#7CFF3B] font-bold">1 Month</p>
                <p className="text-lg font-black text-white mt-1">₹{price}</p>
                <p className="text-[11px] text-gray-400 mt-1">1-on-1 Monthly Coaching</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#11161D] p-4">
                <p className="text-xs text-yellow-400 font-bold">3 Months</p>
                <p className="text-lg font-black text-white mt-1">₹{Math.round(price * 2.5)}</p>
                <p className="text-[11px] text-gray-400 mt-1">Transformation Split</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#11161D] p-4">
                <p className="text-xs text-blue-400 font-bold">6 Months</p>
                <p className="text-lg font-black text-white mt-1">₹{Math.round(price * 4.5)}</p>
                <p className="text-[11px] text-gray-400 mt-1">Elite Performance</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-gray-300 hover:text-white"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                setError(null);
                setStep(4);
              }}
              className="rounded-2xl bg-[#7CFF3B] px-8 py-3.5 text-sm font-bold text-black shadow-[0_0_20px_rgba(124,255,59,0.3)] transition hover:bg-[#68e326]"
            >
              Review & Preview →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Live Marketplace Preview & Publish */}
      {step === 4 && (
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold text-white">Step 4 — Review & Marketplace Live Preview</h3>
            <p className="text-xs text-gray-400 mt-1">
              Here is how your profile card will appear to athletes in the public TCB-3 marketplace.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Live Card Preview */}
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#080B0F] shadow-2xl flex flex-col justify-between">
              <div className="relative h-64 w-full bg-[#0d1217] overflow-hidden">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={name}
                    fill
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7CFF3B] to-[#1e3b10] text-5xl font-black text-black">
                    {name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#080B0F] via-transparent to-transparent opacity-80" />
                <div className="absolute top-4 right-4 rounded-full bg-black/80 backdrop-blur-md px-3 py-1 text-xs font-bold text-yellow-400 border border-yellow-400/40 shadow-lg">
                  ⏳ Verification Pending
                </div>
              </div>

              <div className="p-6 space-y-3">
                <h4 className="text-2xl font-bold text-white">{name}</h4>
                <p className="text-xs text-gray-300 font-medium">{effectiveSpecialty}</p>

                <div className="flex items-center justify-between text-xs text-gray-400 border-y border-white/10 py-2.5">
                  <span className="text-yellow-400 font-bold">★ 4.9 Rating</span>
                  <span>New Coach</span>
                  <span>{experience} Years Exp</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {certifications.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#7CFF3B]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-gray-400 line-clamp-3 pt-2 italic">
                  "{bio}"
                </p>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-gray-500">Starting from</span>
                    <p className="text-xl font-black text-white">₹{price}<span className="text-xs text-gray-400 font-normal">/mo</span></p>
                  </div>
                  <span className="rounded-xl bg-[#7CFF3B]/20 border border-[#7CFF3B]/40 px-4 py-2 text-xs font-bold text-[#7CFF3B]">
                    Marketplace Ready
                  </span>
                </div>
              </div>
            </div>

            {/* Submission Checklist & Policy */}
            <div className="space-y-4 rounded-3xl border border-white/10 bg-[#080B0F] p-6 text-sm">
              <h4 className="font-bold text-white text-base">Automatic Activation Policy</h4>
              <ul className="space-y-3 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#7CFF3B] font-bold">✓</span>
                  <span>When mandatory requirements are met, your profile is <strong>automatically activated and published</strong> to the marketplace.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#7CFF3B] font-bold">✓</span>
                  <span>Athletes can view your profile, start direct chats, and enroll in your packages immediately.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#7CFF3B] font-bold">✓</span>
                  <span>TCB-3 administrators will review your qualifications and issue the official <strong>"✓ Verified Coach"</strong> badge.</span>
                </li>
              </ul>

              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#7CFF3B] py-4 text-sm font-black text-black shadow-[0_0_25px_rgba(124,255,59,0.4)] transition hover:scale-[1.02] hover:bg-[#68e326] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      <span>Validating & Publishing to Marketplace...</span>
                    </>
                  ) : (
                    <span>🚀 Publish & Activate Profile</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-start pt-4">
            <button
              onClick={() => setStep(3)}
              disabled={loading}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-gray-300 hover:text-white"
            >
              ← Back to Pricing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
