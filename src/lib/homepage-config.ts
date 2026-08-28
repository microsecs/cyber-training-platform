export type HomepageStat = {
  id: string;
  value: string;
  label: string;
  detail?: string;
  source: string;
  sourceDate?: string;
  sourceUrl?: string;
  enabled: boolean;
};

export type HomepageSettings = {
  heroBadge: string;
  heroTitle: string;
  heroBody: string;
  videoKey: string | null;
  videoUrl: string | null;
  videoTitle: string;
  statsEyebrow: string;
  statsHeading: string;
  statsBody: string;
  stats: HomepageStat[];
  experienceValue: string;
  experienceLabel: string;
  subscriptionValue: string;
  subscriptionLabel: string;
  pricingEyebrow: string;
  pricingHeading: string;
  pricingBody: string;
  subscriptionPrice: string;
  subscriptionPeriod: string;
  subscriptionFinePrint: string;
  ctaLabel: string;
  ctaUrl: string;
};

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  heroBadge: "Cybersecurity training backed by 40 years of experience",
  heroTitle: "Train your employees before an attacker does.",
  heroBody:
    "Practical cybersecurity training that helps employees recognize phishing, protect passwords, work safely from anywhere, and keep company data secure.",
  videoKey: null,
  videoUrl: null,
  videoTitle: "See why security awareness matters",
  statsEyebrow: "The threat is real",
  statsHeading: "Cyber attacks start with people more often than most businesses realize.",
  statsBody:
    "Current industry and government reporting shows why security awareness training belongs in every organization.",
  stats: [
    {
      id: "ms-phishing-q1-2026",
      value: "8.3 BILLION",
      label: "email-based phishing threats detected in Q1 2026",
      detail: "Microsoft Threat Intelligence detections from January through March 2026.",
      source: "Microsoft Security",
      sourceDate: "Q1 2026",
      sourceUrl:
        "https://www.microsoft.com/en-us/security/blog/2026/04/30/email-threat-landscape-q1-2026-trends-and-insights/",
      enabled: true,
    },
    {
      id: "ms-link-based-q1-2026",
      value: "78%",
      label: "of email threats were link-based",
      detail: "Attackers increasingly used hosted phishing pages and credential-stealing links.",
      source: "Microsoft Security",
      sourceDate: "Q1 2026",
      sourceUrl:
        "https://www.microsoft.com/en-us/security/blog/2026/04/30/email-threat-landscape-q1-2026-trends-and-insights/",
      enabled: true,
    },
    {
      id: "fbi-phishing-2025",
      value: "191,561",
      label: "phishing and spoofing complaints reported to the FBI",
      detail: "Phishing/spoofing remained one of the most frequently reported internet crime categories.",
      source: "FBI IC3",
      sourceDate: "2025",
      sourceUrl: "https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf",
      enabled: true,
    },
    {
      id: "fbi-bec-losses-2025",
      value: "$3 BILLION",
      label: "in reported Business Email Compromise losses",
      detail: "BEC continued to produce substantial losses for businesses and individuals.",
      source: "FBI IC3",
      sourceDate: "2025",
      sourceUrl: "https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf",
      enabled: true,
    },
  ],
  experienceValue: "40+ YEARS",
  experienceLabel: "of technology and security experience",
  subscriptionValue: "ONE SUBSCRIPTION",
  subscriptionLabel: "train unlimited employees",
  pricingEyebrow: "Simple, predictable pricing",
  pricingHeading: "One subscription. Unlimited employees.",
  pricingBody:
    "Train your entire team without paying more every time you add another employee. Invite employees, assign courses, add quizzes, and track completion from one place.",
  subscriptionPrice: "$149.00",
  subscriptionPeriod: "per month · unlimited employees included",
  subscriptionFinePrint: "No per-employee training fee.",
  ctaLabel: "Subscribe & Start Training",
  ctaUrl: "/login",
};
