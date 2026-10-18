import { connection } from 'next/server';
import ListingsExplorer from '@/components/ListingsExplorer';

export default async function HomePage() {
  await connection(); // Request-time rendering permits the per-request CSP nonce.
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <a href="#listings-heading" className="sr-only focus:not-sr-only focus:rounded focus:bg-white focus:p-3">Skip to listings</a>
      <header className="mb-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Beacon</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Neighborhood Listing Platform</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">A community-driven hub connecting residents with local listings and neighborhood sponsors.</p>
        <p className="mt-3 text-sm text-slate-500">Student demonstration · Property listings and sponsors are fictional.</p>
      </header>
      <main>
        <section aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only">Platform features</h2>
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              ['Listings', 'Explore available properties, local homes, and community rental listings.'],
              ['Neighborhood Sponsors', 'Discover local businesses and community sponsors supporting the neighborhood.'],
              ['Accessible Browsing', 'Use clear search filters and detailed property information to find your next home.'],
            ].map(([title, description]) => <li key={title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs"><h3 className="text-xl font-semibold text-slate-800">{title}</h3><p className="mt-2 text-sm leading-normal text-slate-600">{description}</p></li>)}
          </ul>
        </section>
        <ListingsExplorer />
      </main>
      <footer className="mt-16 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">Beacon · CIS 3610 capstone</footer>
    </div>
  );
}
