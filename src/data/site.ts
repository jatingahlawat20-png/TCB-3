import type {
  ActionLink,
  AudienceCard,
  Feature,
  NavItem,
  Stat,
  Step,
} from "@/types/site";

export const siteConfig = {
  description:
    "Human-led coaching relationships for clients and professional trainers.",
  name: "TCB-3",
  tagline: "Real trainers. Structured coaching relationships.",
} as const;

export const publicNavigation: NavItem[] = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#for-clients", label: "Clients" },
  { href: "#for-trainers", label: "Trainers" },
  { href: "#trust", label: "Trust" },
];

export const heroActions: ActionLink[] = [
  { href: "/trainers", label: "Browse trainers", variant: "primary" },
  {
    href: "/trainers/apply",
    label: "Become a trainer",
    variant: "secondary",
  },
];

export const platformStats: Stat[] = [
  {
    label: "complimentary chat window with each trainer",
    value: "3 days",
  },
  {
    label: "clients can work with one trainer or several specialists",
    value: "1+ trainers",
  },
  {
    label: "launch upload limits for images, videos, and documents",
    value: "10 MB / 200 MB / 25 MB",
  },
];

export const heroSignals: Feature[] = [
  {
    description:
      "TCB-3 supports communication and operations while trainers remain responsible for programming and coaching calls.",
    title: "Human-led coaching",
  },
  {
    description:
      "Each trainer publishes their own coaching packages, pricing, and positioning on the platform.",
    title: "Trainer-owned offers",
  },
  {
    description:
      "Clients and trainers can share text, progress images, videos, and documents inside the coaching relationship.",
    title: "Media-ready communication",
  },
];

export const howItWorksSteps: Step[] = [
  {
    description:
      "Compare trainer profiles, specialties, package structures, and positioning before choosing who to contact.",
    title: "Browse and shortlist professionals",
  },
  {
    description:
      "Every client-trainer connection starts with a 3-day free chat window so both sides can assess fit before coaching begins.",
    title: "Start with a complimentary conversation",
  },
  {
    description:
      "When a client purchases that trainer's package, chat stays available through the active coaching relationship.",
    title: "Continue through the trainer's package",
  },
];

export const audienceCards: AudienceCard[] = [
  {
    cta: {
      href: "/trainers",
      label: "Explore trainer profiles",
      variant: "primary",
    },
    description:
      "Build a coaching setup that matches your goals, pace, and budget without being forced into a single coach or a generic program.",
    features: [
      {
        description:
          "Review trainer profiles before choosing who to message first.",
        title: "Find the right fit",
      },
      {
        description:
          "Work with more than one trainer if you want different specialties in the same journey.",
        title: "Keep flexibility",
      },
      {
        description:
          "Share progress through text, images, video, and documents inside the relationship.",
        title: "Check in clearly",
      },
      {
        description:
          "Purchase coaching at any point, including before the 3-day chat window ends.",
        title: "Commit when ready",
      },
    ],
    id: "for-clients",
    label: "For clients",
    title: "Choose real coaches, not automated advice.",
  },
  {
    cta: {
      href: "/trainers/apply",
      label: "Create a trainer presence",
      variant: "secondary",
    },
    description:
      "Operate as a professional coach with your own pricing, packages, and decision-making authority while the platform handles discovery and communication structure.",
    features: [
      {
        description:
          "Publish coaching packages that reflect your service model and business.",
        title: "Set your own offers",
      },
      {
        description:
          "Keep control over exercises, sets, reps, progressions, and all coaching decisions.",
        title: "Own the coaching",
      },
      {
        description:
          "Use verification to reinforce credibility through identity review and claimed credentials checks.",
        title: "Build trust faster",
      },
      {
        description:
          "Manage ongoing client communication without a separate trainer-side chat fee.",
        title: "Stay connected",
      },
    ],
    id: "for-trainers",
    label: "For trainers",
    title: "Run coaching as your business.",
  },
];

export const trustPillars: Feature[] = [
  {
    description:
      "Trainer verification supports identity confirmation and review of professional credentials where they are claimed.",
    title: "Verification that means something",
  },
  {
    description:
      "Admins oversee approvals, reports, and platform operations to keep the marketplace accountable.",
    title: "Operational oversight",
  },
  {
    description:
      "Workout plans, exercises, sets, reps, and training instructions come from the trainer, not AI automation.",
    title: "Human coaching governance",
  },
  {
    description:
      "Chat architecture is designed for text, images, videos, and files so coaching context does not stay trapped in one format.",
    title: "Communication built for coaching",
  },
];

export const footerGroups = [
  {
    links: publicNavigation,
    title: "Platform",
  },
  {
    links: [
      { href: "/trainers", label: "Trainer directory" },
      { href: "/trainers/apply", label: "Trainer applications" },
      { href: "#trust", label: "Trust and safety" },
    ],
    title: "Next routes",
  },
] as const;
