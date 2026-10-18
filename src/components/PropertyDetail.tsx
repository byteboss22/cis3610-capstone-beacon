'use client';
import { z } from 'zod';
import PropertyCard from '@/components/PropertyCard';
import useResource from '@/components/useResource';
import { ListingResponseSchema, toProperty } from '@/contracts/listing';

const schema = z.object({ listing: ListingResponseSchema });
export default function PropertyDetail({ id }: { id: string }) {
  const resource = useResource(`/api/listings/${id}`, schema);
  if (resource.loading) return <p className="mt-8" role="status">Loading property…</p>;
  if (resource.error || !resource.data) return <section className="mt-8"><h1 className="text-2xl font-semibold">This listing is unavailable.</h1><p className="mt-3">It may no longer be published, or we could not load it.</p><button className="mt-4 rounded bg-blue-700 px-4 py-2 text-white" onClick={resource.retry}>Try again</button></section>;
  const property = toProperty(resource.data.listing);
  return <section className="mt-8 space-y-6"><h1 className="text-3xl font-bold">{property.title}</h1><PropertyCard property={property} showDetailsLink={false} /><p className="leading-relaxed">{property.description}</p>{property.amenities && property.amenities.length > 0 && <div><h2 className="text-xl font-semibold">Amenities</h2><ul className="mt-3 flex flex-wrap gap-3">{property.amenities.map(amenity => <li className="rounded bg-blue-50 px-3 py-1" key={amenity}>{amenity.replaceAll('_', ' ')}</li>)}</ul></div>}</section>;
}
