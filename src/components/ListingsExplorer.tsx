'use client';
import PropertyListings from '@/components/PropertyListings';
import SponsorBanner from '@/components/SponsorBanner';
import useResource from '@/components/useResource';
import { ListingsResponseSchema, SponsorsResponseSchema, toProperty, toSponsor } from '@/contracts/listing';

const button = 'mt-3 rounded bg-blue-700 px-4 py-2 text-white hover:bg-blue-800 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-900';
export default function ListingsExplorer() {
  const listings = useResource('/api/listings', ListingsResponseSchema);
  const sponsors = useResource('/api/sponsors', SponsorsResponseSchema);
  return (
    <>
      <div aria-busy={listings.loading}>
        {listings.loading ? <section className="mt-12 rounded-lg border border-slate-200 bg-white p-6" aria-labelledby="listings-heading"><h2 id="listings-heading" className="text-2xl font-semibold">Available Properties</h2><p className="mt-3" role="status">Loading listings…</p></section>
          : listings.error ? <section className="mt-12 rounded-lg border border-red-200 bg-red-50 p-6" aria-labelledby="listings-heading"><h2 id="listings-heading" className="text-xl font-semibold">Listings are temporarily unavailable</h2><p className="mt-2" role="alert">We could not load listings. Please try again.</p><button className={button} onClick={listings.retry}>Try again</button></section>
          : <PropertyListings properties={(listings.data?.listings ?? []).map(toProperty)} />}
      </div>
      <div className="mt-12" aria-busy={sponsors.loading}>
        {sponsors.loading ? <p role="status" className="text-sm text-slate-600">Loading neighborhood sponsors…</p>
          : sponsors.error ? <aside className="rounded-lg border border-slate-200 bg-white p-5"><p>Neighborhood sponsors could not be loaded.</p><button className={button} onClick={sponsors.retry}>Retry sponsors</button></aside>
          : sponsors.data?.sponsors[0] ? <SponsorBanner sponsor={toSponsor(sponsors.data.sponsors[0])} />
          : <p className="text-sm text-slate-600">No neighborhood sponsors are available yet.</p>}
      </div>
    </>
  );
}
