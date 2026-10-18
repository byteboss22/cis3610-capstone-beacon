import type { Sponsor } from "@/types";

interface SponsorBannerProps {
  sponsor: Sponsor;
}

export default function SponsorBanner({ sponsor }: SponsorBannerProps) {
  return (
    <aside
      aria-label={`Sponsored content from ${sponsor.business_name}`}
      className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-slate-900"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        Sponsored
      </p>
      <p className="mt-2 text-base">{sponsor.message}</p>
      <a
        href={sponsor.website_url}
        className="mt-3 inline-block rounded text-blue-700 underline underline-offset-2 hover:text-blue-900 focus-visible:outline-4 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-blue-900"
      >
        Visit {sponsor.business_name}
      </a>
    </aside>
  );
}
