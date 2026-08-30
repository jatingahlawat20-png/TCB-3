"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface CertificationItem {
  name: string;
  issuer: string;
  credentialId?: string;
  year?: string;
}

interface PackageItem {
  id?: string;
  name: string;
  duration: string;
  price: number;
  description: string;
  benefits: string[];
  active: boolean;
}

interface OnboardingWizardProps {
  initialName: string;
  initialProfile?: any;
}

const COMMON_SPECIALTIES = [
  "Strength & Conditioning",
  "Fat Loss",
  "Muscle Building",
  "General Fitness",
  "Mobility",
  "Sports Performance",
  "Functional Training",
  "Lifestyle Coaching",
];

const TARGET_CLIENT_OPTIONS = [
  "Beginners & First-Time Lifters",
  "Busy Working Professionals",
  "Fat Loss & Body Recomposition",
  "Competitive Powerlifters & Athletes",
  "Hypertrophy & Physique Enthusiasts",
  "Post-Rehab & Joint Mobility",
];

const COACHING_APPROACH_OPTIONS = [
  "Biomechanics & Form-First Technique",
  "Periodized Progressive Overload Split",
  "Sustainable Habits & Macro Guidance",
  "High-Accountability Daily Check-Ins",
  "Holistic Lifestyle & Recovery Protocol",
];

const SESSION_FORMAT_OPTIONS = [
  "1-on-1 Direct Chat & Voice Notes",
  "Weekly Lift Video Technique Analysis",
  "Custom Workout Split via In-App Plans",
  "1-on-1 Live Video Check-In Sessions",
  "Daily Nutrition & Habit Logging",
];

const SAMPLE_AVATARS = [
  "/images/trainers/aryan-singh.jpg",
  "/images/trainers/neha-sharma.jpg",
  "/images/trainers/rahul-mehta.jpg",
  "/images/trainers/ananya-desai.jpg",
  "/images/trainers/vikram-malhotra.jpg",
  "/images/trainers/karan-patel.jpg",
];

export function TrainerOnboardingWizard({
  initialName,
  initialProfile,
}: OnboardingWizardProps) {
  const router = useRouter();

  // Wizard Step (1 to 6)
  const [step, setStep] = useState(1);

  // STEP 1 — About You
  const [name, setName] = useState(initialName || "");
  const [headline, setHeadline] = useState(
    initialProfile?.specialty || "Certified Fitness & Strength Coach"
  );
  const [location, setLocation] = useState("Mumbai, India");
  const [bio, setBio] = useState(
    initialProfile?.bio ||
      "Certified fitness coach dedicated to human-led training, custom periodization splits, and weekly accountability checks."
  );
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatarUrl || SAMPLE_AVATARS[0]);

  // STEP 2 — Coaching Expertise
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([
    "Strength & Conditioning",
    "Muscle Building",
  ]);
  const [experience, setExperience] = useState<number>(
    initialProfile?.experience && initialProfile.experience >= 2 ? initialProfile.experience : 3
  );
  const [targetClients, setTargetClients] = useState<string[]>([
    "Busy Working Professionals",
    "Fat Loss & Body Recomposition",
  ]);
  const [coachingApproach, setCoachingApproach] = useState<string[]>([
    "Biomechanics & Form-First Technique",
    "Periodized Progressive Overload Split",
  ]);
  const [languages, setLanguages] = useState<string[]>(["English", "Hindi"]);
  const [availability, setAvailability] = useState("Full-time Online Coaching (Accepting New Clients)");

  // STEP 3 — Credentials
  const [certifications, setCertifications] = useState<CertificationItem[]>([
    {
      name: "Certified Strength and Conditioning Specialist (CSCS)",
      issuer: "NSCA",
      credentialId: "CSCS-2022-8819",
      year: "2022",
    },
  ]);
  const [newCertName, setNewCertName] = useState("");
  const [newCertIssuer, setNewCertIssuer] = useState("");
  const [newCertId, setNewCertId] = useState("");
  const [newCertYear, setNewCertYear] = useState("2023");

  // STEP 4 — Coaching Details
  const [philosophy, setPhilosophy] = useState(
    "Focus on injury-free compound movements, progressive overload, and flexible macronutrient adherence."
  );
  const [sessionFormats, setSessionFormats] = useState<string[]>([
    "1-on-1 Direct Chat & Voice Notes",
    "Weekly Lift Video Technique Analysis",
    "Custom Workout Split via In-App Plans",
  ]);
  const [idealClient, setIdealClient] = useState(
    "Anyone committed to consistent training 3-4 days per week who values coach feedback."
  );
  const [responseTime, setResponseTime] = useState("< 2 Hours");

  // STEP 5 — Packages
  const defaultMonthlyPrice = initialProfile?.price || 1999;
  const [packages, setPackages] = useState<PackageItem[]>(() => {
    if (initialProfile?.packages && initialProfile.packages.length > 0) {
      return initialProfile.packages.map((p: any) => ({
        id: p.id,
        name: p.name,
        duration: p.duration,
        price: p.price,
        description: p.description || "",
        benefits: p.benefits || ["Personalized split", "Nutrition targets", "Direct chat"],
        active: p.active ?? true,
      }));
    }
    return [
      {
        name: "1-on-1 Monthly Coaching",
        duration: "1 Month",
        price: defaultMonthlyPrice,
        description: `Personalized 1-on-1 training and nutrition coaching split with Coach ${initialName || "Coach"}.`,
        benefits: [
          "Custom workout split & periodization",
          "Nutrition macro targets",
          "Weekly form check reviews",
          "Direct in-app messaging",
          "3-day complimentary chat trial",
        ],
        active: true,
      },
      {
        name: "3-Month Body Transformation",
        duration: "3 Months",
        price: Math.round(defaultMonthlyPrice * 2.5),
        description: "Comprehensive 12-week body recomposition and progressive overload protocol.",
        benefits: [
          "Complete 12-week periodization split",
          "Weekly technique video analysis",
          "Bi-weekly nutritional adjustments",
          "Priority message response",
          "Full progress milestone tracking",
        ],
        active: true,
      },
    ];
  });

  // Submission & Processing States
  const [loading, setLoading] = useState(false);
  const [publishPhase, setPublishPhase] = useState<"idle" | "reviewing" | "verified" | "live">("idle");
  const [error, setError] = useState<string | null>(null);
  const [missingRequirements, setMissingRequirements] = useState<string[]>([]);

  // Safe localStorage Persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tcb3_coach_onboarding_draft");
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.name) setName(draft.name);
        if (draft.headline) setHeadline(draft.headline);
        if (draft.location) setLocation(draft.location);
        if (draft.bio) setBio(draft.bio);
        if (draft.avatarUrl) setAvatarUrl(draft.avatarUrl);
        if (draft.selectedSpecialties?.length) setSelectedSpecialties(draft.selectedSpecialties);
        if (draft.experience) setExperience(draft.experience);
        if (draft.targetClients?.length) setTargetClients(draft.targetClients);
        if (draft.coachingApproach?.length) setCoachingApproach(draft.coachingApproach);
        if (draft.languages?.length) setLanguages(draft.languages);
        if (draft.availability) setAvailability(draft.availability);
        if (draft.certifications?.length) setCertifications(draft.certifications);
        if (draft.philosophy) setPhilosophy(draft.philosophy);
        if (draft.sessionFormats?.length) setSessionFormats(draft.sessionFormats);
        if (draft.packages?.length) setPackages(draft.packages);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveDraft = () => {
    try {
      localStorage.setItem(
        "tcb3_coach_onboarding_draft",
        JSON.stringify({
          name,
          headline,
          location,
          bio,
          avatarUrl,
          selectedSpecialties,
          experience,
          targetClients,
          coachingApproach,
          languages,
          availability,
          certifications,
          philosophy,
          sessionFormats,
          packages,
        })
      );
    } catch {
      // ignore
    }
  };

  const toggleArrayItem = (item: string, list: string[], setList: (val: string[]) => void) => {
    if (list.includes(item)) {
      if (list.length > 1) {
        setList(list.filter((x) => x !== item));
      }
    } else {
      setList([...list, item]);
    }
  };

  const handleAddCert = () => {
    if (newCertName.trim() && newCertIssuer.trim()) {
      setCertifications([
        ...certifications,
        {
          name: newCertName.trim(),
          issuer: newCertIssuer.trim(),
          credentialId: newCertId.trim() || undefined,
          year: newCertYear.trim() || undefined,
        },
      ]);
      setNewCertName("");
      setNewCertIssuer("");
      setNewCertId("");
    }
  };

  const handleRemoveCert = (index: number) => {
    if (certifications.length > 1) {
      setCertifications(certifications.filter((_, i) => i !== index));
    }
  };

  // Compile combined tags for backend
  const compiledTags = [
    ...selectedSpecialties,
    ...certifications.map((c) => c.name),
    ...targetClients.slice(0, 2),
    ...coachingApproach.slice(0, 2),
    `loc:${location}`,
    `exp:${experience} Yrs`,
  ];

  // Calculate completeness
  const hasBasicInfo = name.trim().length >= 2 && headline.trim().length >= 3 && bio.trim().length >= 20;
  const hasSpecialty = selectedSpecialties.length >= 1;
  const hasExp = experience >= 2;
  const hasCredentials = certifications.length >= 1;
  const hasActivePackage = packages.some((p) => p.active && p.price > 0 && p.name.trim().length > 0);

  let completeness = 0;
  if (hasBasicInfo) completeness += 25;
  if (hasSpecialty) completeness += 20;
  if (hasExp) completeness += 15;
  if (hasCredentials) completeness += 20;
  if (hasActivePackage) completeness += 20;

  const isEligible = hasBasicInfo && hasSpecialty && hasExp && hasCredentials && hasActivePackage;

  const nextStep = () => {
    saveDraft();
    setError(null);
    setStep((s) => Math.min(6, s + 1));
    window.scrollTo({ top: 180, behavior: "smooth" });
  };

  const prevStep = () => {
    saveDraft();
    setError(null);
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 180, behavior: "smooth" });
  };

  const handlePublish = async () => {
    setError(null);
    setMissingRequirements([]);
    setLoading(true);
    setPublishPhase("reviewing");

    try {
      // Phase 1: Reviewing state
      await new Promise((r) => setTimeout(r, 600));
      setPublishPhase("verified");

      const monthlyPrice = packages.find((p) => p.active)?.price || 1999;

      const res = await fetch("/api/trainer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          specialty: headline.trim(),
          experience,
          price: monthlyPrice,
          bio: bio.trim(),
          tags: compiledTags,
          avatarUrl: avatarUrl.trim() || null,
          packages: packages.map((p) => ({
            id: p.id,
            name: p.name,
            duration: p.duration,
            price: p.price,
            description: p.description,
            benefits: p.benefits,
            active: p.active,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish profile.");
      }

      if (!data.eligible && !data.isEligible && data.missingRequirements?.length > 0) {
        setMissingRequirements(data.missingRequirements);
        setPublishPhase("idle");
        setLoading(false);
        setError("Please satisfy all mandatory requirements before publishing.");
        return;
      }

      // Phase 2: Live
      setPublishPhase("live");
      localStorage.removeItem("tcb3_coach_onboarding_draft");

      setTimeout(() => {
        router.push("/trainer/dashboard?onboarding=published");
        router.refresh();
      }, 1200);
    } catch (err: any) {
      console.error("Onboarding submission error:", err);
      setError(err.message || "Failed to submit coaching profile. Please try again.");
      setPublishPhase("idle");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[36px] border border-white/10 bg-[#11161D] p-6 md:p-12 shadow-2xl">
      {/* Wizard Progress Bar & Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between gap-1 border-b border-white/10 pb-6 overflow-x-auto">
          {[
            { num: 1, title: "About You" },
            { num: 2, title: "Expertise" },
            { num: 3, title: "Credentials" },
            { num: 4, title: "Coaching" },
            { num: 5, title: "Packages" },
            { num: 6, title: "Review & Publish" },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                saveDraft();
                setStep(s.num);
              }}
              className={`flex items-center gap-2 whitespace-nowrap px-2 py-1 transition ${
                step === s.num
                  ? "text-[#7CFF3B] font-bold"
                  : step > s.num
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-600"
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  step === s.num
                    ? "bg-[#7CFF3B] text-black shadow-[0_0_15px_rgba(124,255,59,0.4)]"
                    : step > s.num
                    ? "bg-white/15 text-white"
                    : "bg-white/5 text-gray-600"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </div>
              <span className="text-xs md:text-sm">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Completeness Bar */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
          <span>Profile Completeness: <strong className="text-[#7CFF3B]">{completeness}%</strong></span>
          <div className="w-48 bg-white/10 rounded-full h-2 overflow-hidden ml-4 flex-1 max-w-xs">
            <div
              className="bg-[#7CFF3B] h-full transition-all duration-500 rounded-full"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Error & Missing Requirements Feedback */}
      {error && (
        <div className="mb-8 rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-300">
          <div className="font-bold flex items-center gap-2 text-red-200">
            <span>⚠️</span> {error}
          </div>
          {missingRequirements.length > 0 && (
            <ul className="mt-3 list-disc list-inside space-y-1 text-xs text-red-300">
              {missingRequirements.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: ABOUT YOU */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <div>
              <h2 className="text-2xl font-bold text-white">Step 1 — Tell Clients About Yourself</h2>
              <p className="mt-1 text-sm text-gray-400">
                Your name, location, and professional headline form your public coach identity.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Full Display Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Coach Arjun Kapoor"
                className="w-full rounded-2xl border border-white/10 bg-[#0B0F14] px-5 py-3.5 text-white outline-none focus:border-[#7CFF3B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Primary Coaching Headline *
              </label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Certified Fitness & Strength Coach"
                className="w-full rounded-2xl border border-white/10 bg-[#0B0F14] px-5 py-3.5 text-white outline-none focus:border-[#7CFF3B]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  City / Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mumbai, India / Online"
                  className="w-full rounded-2xl border border-white/10 bg-[#0B0F14] px-5 py-3.5 text-white outline-none focus:border-[#7CFF3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center gap-2">
                  {SAMPLE_AVATARS.slice(0, 4).map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(av)}
                      className={`relative h-10 w-10 overflow-hidden rounded-full border-2 transition ${
                        avatarUrl === av ? "border-[#7CFF3B] scale-110" : "border-white/10 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image src={av} alt="Avatar" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Professional Bio & Coaching Background *
                </label>
                <span className={`text-xs ${bio.trim().length >= 20 ? "text-[#7CFF3B]" : "text-gray-500"}`}>
                  {bio.trim().length} / 20 min chars
                </span>
              </div>
              <textarea
                rows={4}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your coaching philosophy, athlete experience, biomechanics approach, and what clients can expect..."
                className="w-full rounded-2xl border border-white/10 bg-[#0B0F14] p-4 text-sm text-white outline-none focus:border-[#7CFF3B]"
              />
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-3xl border border-[#7CFF3B]/20 bg-gradient-to-b from-[#142316] to-[#0D1217] p-6 shadow-xl">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#7CFF3B] mb-4">
                <span>Live Marketplace Preview</span>
                <span className="rounded-full bg-[#7CFF3B]/10 px-2.5 py-0.5 border border-[#7CFF3B]/20">
                  Verified Ready
                </span>
              </div>

              <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-4 border border-white/10">
                <Image src={avatarUrl || SAMPLE_AVATARS[0]} alt="Coach" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <h3 className="text-lg font-black text-white">{name || "Your Name"}</h3>
                  <p className="text-xs text-[#7CFF3B] font-semibold">{headline}</p>
                </div>
              </div>

              <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed mb-4">
                {bio || "Your coaching biography will appear here in the public marketplace."}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                <span className="text-gray-400">📍 {location}</span>
                <span className="font-bold text-[#7CFF3B]">₹{packages[0]?.price || 1999}/mo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: COACHING EXPERTISE */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Step 2 — Coaching Expertise & Experience</h2>
            <p className="mt-1 text-sm text-gray-400">
              Select your primary disciplines. An objective minimum of 2 years professional experience qualifies.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
              Specialties (Select all that apply) *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {COMMON_SPECIALTIES.map((spec) => {
                const isSelected = selectedSpecialties.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleArrayItem(spec, selectedSpecialties, setSelectedSpecialties)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[#7CFF3B] bg-[#7CFF3B]/10 text-[#7CFF3B] shadow-[0_0_15px_rgba(124,255,59,0.15)]"
                        : "border-white/10 bg-[#0B0F14] text-gray-300 hover:border-white/20"
                    }`}
                  >
                    <div className="text-sm font-bold">{spec}</div>
                    <div className="mt-1 text-[11px] text-gray-400">
                      {isSelected ? "✓ Selected" : "+ Add focus"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Years of Professional Coaching Experience * (Minimum 2 years)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min={2}
                  max={40}
                  value={experience}
                  onChange={(e) => setExperience(Math.max(1, parseInt(e.target.value) || 2))}
                  className="w-32 rounded-2xl border border-white/10 bg-[#0B0F14] px-5 py-3.5 text-lg font-bold text-white outline-none focus:border-[#7CFF3B]"
                />
                <span className="text-sm text-gray-400 font-medium">
                  {experience >= 2 ? "✓ Meets platform experience standard" : "⚠️ Minimum 2 years required"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Weekly Availability & Load
              </label>
              <input
                type="text"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="e.g. Full-time Online Coaching (15 Client Capacity)"
                className="w-full rounded-2xl border border-white/10 bg-[#0B0F14] px-5 py-3.5 text-white outline-none focus:border-[#7CFF3B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
              Target Clients
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TARGET_CLIENT_OPTIONS.map((opt) => {
                const isSelected = targetClients.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleArrayItem(opt, targetClients, setTargetClients)}
                    className={`rounded-xl border px-4 py-3 text-left text-xs font-semibold transition ${
                      isSelected
                        ? "border-[#7CFF3B]/50 bg-[#7CFF3B]/10 text-[#7CFF3B]"
                        : "border-white/10 bg-[#0B0F14] text-gray-400 hover:text-white"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "} {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: CREDENTIALS & CERTIFICATIONS */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Step 3 — Professional Credentials & Certifications</h2>
            <p className="mt-1 text-sm text-gray-400">
              Provide your accredited qualifications. At least one certification is required for automatic marketplace verification.
            </p>
          </div>

          {/* Current Certifications List */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
              Added Qualifications ({certifications.length})
            </label>
            {certifications.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-2xl border border-[#7CFF3B]/20 bg-[#162018] p-4 text-sm"
              >
                <div>
                  <div className="flex items-center gap-2 font-bold text-white">
                    <span>📜 {c.name}</span>
                    <span className="rounded-full bg-[#7CFF3B]/20 px-2.5 py-0.5 text-[10px] font-black text-[#7CFF3B]">
                      Credential information provided
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    Issued by: <strong className="text-gray-200">{c.issuer}</strong>
                    {c.year && ` • Year: ${c.year}`}
                    {c.credentialId && ` • ID: ${c.credentialId}`}
                  </div>
                </div>
                {certifications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCert(i)}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold px-3 py-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add New Certification Form */}
          <div className="rounded-2xl border border-white/10 bg-[#0B0F14] p-6 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-300">
              + Add Another Certification
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Certification Name</label>
                <input
                  type="text"
                  value={newCertName}
                  onChange={(e) => setNewCertName(e.target.value)}
                  placeholder="e.g. Certified Personal Trainer (ACE-CPT)"
                  className="w-full rounded-xl border border-white/10 bg-[#11161D] px-4 py-2.5 text-sm text-white outline-none focus:border-[#7CFF3B]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Issuing Body / Organization</label>
                <input
                  type="text"
                  value={newCertIssuer}
                  onChange={(e) => setNewCertIssuer(e.target.value)}
                  placeholder="e.g. American Council on Exercise (ACE)"
                  className="w-full rounded-xl border border-white/10 bg-[#11161D] px-4 py-2.5 text-sm text-white outline-none focus:border-[#7CFF3B]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Credential ID (Optional)</label>
                <input
                  type="text"
                  value={newCertId}
                  onChange={(e) => setNewCertId(e.target.value)}
                  placeholder="e.g. ACE-994821"
                  className="w-full rounded-xl border border-white/10 bg-[#11161D] px-4 py-2.5 text-sm text-white outline-none focus:border-[#7CFF3B]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Year Obtained</label>
                <input
                  type="text"
                  value={newCertYear}
                  onChange={(e) => setNewCertYear(e.target.value)}
                  placeholder="e.g. 2022"
                  className="w-full rounded-xl border border-white/10 bg-[#11161D] px-4 py-2.5 text-sm text-white outline-none focus:border-[#7CFF3B]"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddCert}
              className="rounded-xl border border-[#7CFF3B]/30 bg-[#7CFF3B]/10 px-5 py-2 text-xs font-bold text-[#7CFF3B] transition hover:bg-[#7CFF3B]/20"
            >
              + Save Certification
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: COACHING DETAILS */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Step 4 — Coaching Approach & Delivery Formats</h2>
            <p className="mt-1 text-sm text-gray-400">
              Explain how you work with clients and your communication standards.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
              Session & Coaching Delivery Formats
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SESSION_FORMAT_OPTIONS.map((fmt) => {
                const isSelected = sessionFormats.includes(fmt);
                return (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => toggleArrayItem(fmt, sessionFormats, setSessionFormats)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[#7CFF3B] bg-[#7CFF3B]/10 text-[#7CFF3B]"
                        : "border-white/10 bg-[#0B0F14] text-gray-300 hover:border-white/20"
                    }`}
                  >
                    <span className="text-sm font-bold">{isSelected ? "✓ " : "+ "} {fmt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
              Coaching Philosophy & Methodology
            </label>
            <textarea
              rows={3}
              value={philosophy}
              onChange={(e) => setPhilosophy(e.target.value)}
              placeholder="e.g. Focus on injury-free compound movements, progressive overload, and sustainable nutrition..."
              className="w-full rounded-2xl border border-white/10 bg-[#0B0F14] p-4 text-sm text-white outline-none focus:border-[#7CFF3B]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Ideal Client Profile
              </label>
              <input
                type="text"
                value={idealClient}
                onChange={(e) => setIdealClient(e.target.value)}
                placeholder="e.g. Motivated lifters wanting consistent weekly feedback"
                className="w-full rounded-2xl border border-white/10 bg-[#0B0F14] px-5 py-3.5 text-white outline-none focus:border-[#7CFF3B]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Response Time SLA
              </label>
              <select
                value={responseTime}
                onChange={(e) => setResponseTime(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0B0F14] px-5 py-3.5 text-white outline-none focus:border-[#7CFF3B]"
              >
                <option value="< 2 Hours">&lt; 2 Hours (Priority)</option>
                <option value="< 4 Hours">&lt; 4 Hours (Standard)</option>
                <option value="Same-Day Response">Same-Day Response (&lt; 12 Hours)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: PACKAGES */}
      {/* ========================================================================= */}
      {step === 5 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Step 5 — Coaching Packages & Rates</h2>
            <p className="mt-1 text-sm text-gray-400">
              Set your monthly and multi-month packages. At least one active package is required for marketplace publication.
            </p>
          </div>

          <div className="space-y-4">
            {packages.map((pkg, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border p-6 transition ${
                  pkg.active ? "border-white/15 bg-[#0B0F14]" : "border-white/5 bg-white/[0.01] opacity-60"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={pkg.name}
                      onChange={(e) => {
                        const updated = [...packages];
                        updated[idx].name = e.target.value;
                        setPackages(updated);
                      }}
                      className="bg-transparent text-lg font-bold text-white outline-none focus:text-[#7CFF3B]"
                      placeholder="Package Name"
                    />
                    <div className="text-xs text-gray-400 mt-1">Duration: {pkg.duration}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-[#7CFF3B]">₹</span>
                      <input
                        type="number"
                        min={499}
                        max={100000}
                        value={pkg.price}
                        onChange={(e) => {
                          const updated = [...packages];
                          updated[idx].price = Math.max(0, parseFloat(e.target.value) || 0);
                          setPackages(updated);
                        }}
                        className="w-28 rounded-xl border border-white/10 bg-[#11161D] px-3 py-2 text-base font-bold text-white outline-none focus:border-[#7CFF3B]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...packages];
                        updated[idx].active = !updated[idx].active;
                        setPackages(updated);
                      }}
                      className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                        pkg.active ? "bg-[#7CFF3B]/10 text-[#7CFF3B]" : "bg-white/5 text-gray-400"
                      }`}
                    >
                      {pkg.active ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={pkg.description}
                  onChange={(e) => {
                    const updated = [...packages];
                    updated[idx].description = e.target.value;
                    setPackages(updated);
                  }}
                  placeholder="Short description of this coaching package..."
                  className="w-full rounded-xl border border-white/10 bg-[#11161D] px-4 py-2 text-xs text-gray-300 outline-none focus:border-[#7CFF3B] mb-3"
                />

                <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                  {pkg.benefits.map((b, bi) => (
                    <span key={bi} className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-gray-300">
                      ✓ {b}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: REVIEW & PUBLISH */}
      {/* ========================================================================= */}
      {step === 6 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Step 6 — Final Review & Instant Verification</h2>
            <p className="mt-1 text-sm text-gray-400">
              Review your complete coaching profile. If all objective standards are met, your profile is immediately verified and published.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Summary Card */}
            <div className="rounded-2xl border border-white/10 bg-[#0B0F14] p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7CFF3B]">
                Profile Summary
              </h4>
              <div>
                <h3 className="text-xl font-black text-white">{name}</h3>
                <p className="text-xs text-[#7CFF3B] font-semibold">{headline}</p>
                <p className="text-xs text-gray-400 mt-1">📍 {location} • {experience} Years Experience</p>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed border-t border-white/10 pt-3">
                {bio}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {selectedSpecialties.map((s) => (
                  <span key={s} className="rounded-full bg-[#7CFF3B]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#7CFF3B]">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Credentials & Coaching Card */}
            <div className="rounded-2xl border border-white/10 bg-[#0B0F14] p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7CFF3B]">
                Credentials & Delivery
              </h4>
              <div className="space-y-2">
                {certifications.map((c, i) => (
                  <div key={i} className="text-xs text-gray-200">
                    <strong>📜 {c.name}</strong> ({c.issuer})
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3 space-y-1.5 text-xs text-gray-300">
                <div>⚡ <strong>Response SLA:</strong> {responseTime}</div>
                <div>💬 <strong>Availability:</strong> {availability}</div>
                <div>🎯 <strong>Active Packages:</strong> {packages.filter((p) => p.active).length} packages listed</div>
              </div>
            </div>
          </div>

          {/* Eligibility Checklist */}
          <div className="rounded-2xl border border-[#7CFF3B]/30 bg-[#162018] p-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7CFF3B]">
              Automated Platform Eligibility Checklist
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-200">
                <span className={hasBasicInfo ? "text-[#7CFF3B] font-bold" : "text-rose-400"}>
                  {hasBasicInfo ? "✓" : "✗"}
                </span>
                <span>Professional profile details complete</span>
              </div>
              <div className="flex items-center gap-2 text-gray-200">
                <span className={hasSpecialty ? "text-[#7CFF3B] font-bold" : "text-rose-400"}>
                  {hasSpecialty ? "✓" : "✗"}
                </span>
                <span>Coaching specialty selected</span>
              </div>
              <div className="flex items-center gap-2 text-gray-200">
                <span className={hasExp ? "text-[#7CFF3B] font-bold" : "text-rose-400"}>
                  {hasExp ? "✓" : "✗"}
                </span>
                <span>Experience requirement satisfied ({experience} yrs &ge; 2 yrs)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-200">
                <span className={hasCredentials ? "text-[#7CFF3B] font-bold" : "text-rose-400"}>
                  {hasCredentials ? "✓" : "✗"}
                </span>
                <span>Credential information provided ({certifications.length} certs)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-200">
                <span className={hasActivePackage ? "text-[#7CFF3B] font-bold" : "text-rose-400"}>
                  {hasActivePackage ? "✓" : "✗"}
                </span>
                <span>Active coaching package available (₹{packages.find((p) => p.active)?.price || 0})</span>
              </div>
              <div className="flex items-center gap-2 text-gray-200">
                <span className="text-[#7CFF3B] font-bold">✓</span>
                <span>Ready for instant automated marketplace publication</span>
              </div>
            </div>
          </div>

          {/* Animated Publishing Processing State */}
          {publishPhase !== "idle" && (
            <div className="rounded-2xl border border-[#7CFF3B]/50 bg-black/60 p-6 text-center space-y-3 animate-pulse">
              <div className="text-3xl">
                {publishPhase === "reviewing" && "⏳"}
                {publishPhase === "verified" && "✓"}
                {publishPhase === "live" && "🚀"}
              </div>
              <h4 className="text-lg font-black text-white">
                {publishPhase === "reviewing" && "Reviewing your profile..."}
                {publishPhase === "verified" && "Profile requirements complete — Automatically Verified!"}
                {publishPhase === "live" && "You're live! Redirecting to your Coach Dashboard..."}
              </h4>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons (Prev / Next / Publish) */}
      <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
        {step > 1 ? (
          <button
            type="button"
            disabled={loading}
            onClick={prevStep}
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:border-white/20"
          >
            ← Back
          </button>
        ) : (
          <div />
        )}

        {step < 6 ? (
          <button
            type="button"
            onClick={nextStep}
            className="rounded-2xl bg-[#7CFF3B] px-8 py-3.5 text-sm font-bold text-black transition hover:scale-105 hover:bg-[#68e326] shadow-[0_0_20px_rgba(124,255,59,0.3)]"
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            disabled={loading || !isEligible}
            onClick={handlePublish}
            className="rounded-2xl bg-[#7CFF3B] px-10 py-4 text-base font-black text-black transition hover:scale-105 hover:bg-[#68e326] shadow-[0_0_30px_rgba(124,255,59,0.4)] disabled:opacity-50"
          >
            {loading ? "Verifying & Publishing..." : "Verify & Publish Profile →"}
          </button>
        )}
      </div>
    </div>
  );
}
