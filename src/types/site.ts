export type ButtonVariant = "primary" | "secondary" | "ghost";

export type ActionLink = {
  href: string;
  label: string;
  variant: ButtonVariant;
};

export type NavItem = {
  href: string;
  label: string;
};

export type Stat = {
  label: string;
  value: string;
};

export type Step = {
  description: string;
  title: string;
};

export type Feature = {
  description: string;
  title: string;
};

export type AudienceCard = {
  cta: ActionLink;
  description: string;
  features: Feature[];
  id: string;
  label: string;
  title: string;
};
