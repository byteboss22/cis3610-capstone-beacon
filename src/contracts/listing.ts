import { z } from 'zod';

export const propertyTypes = ['apartment', 'condo', 'duplex', 'house', 'loft'] as const;
export const propertyImages = [
  '/properties/brookhaven-apartment.svg', '/properties/brookhaven-condo.svg',
  '/properties/brookhaven-duplex.svg', '/properties/brookhaven-house.svg',
  '/properties/brookhaven-loft.svg', '/properties/river-loft.svg',
  '/properties/oak-terrace-condo.svg', '/properties/cedar-bungalow.svg',
  '/properties/willow-apartment.svg', '/properties/pine-duplex.svg',
] as const;
const optionalText = z.string().nullable().optional();
export const ListingResponseSchema = z.object({
  id: z.uuid(), title: z.string(), description: z.string(), city: z.string(),
  rent_cents: z.number().int().nonnegative(),
  property_type: z.enum(propertyTypes).nullable().optional(),
  address_line_1: optionalText, address_line_2: optionalText,
  state: optionalText, zip_code: optionalText,
  bedrooms: z.number().int().nonnegative().nullable().optional(),
  bathrooms: z.number().nonnegative().nullable().optional(),
  square_feet: z.number().int().positive().nullable().optional(),
  image_url: z.string().regex(/^\/properties\/[a-z0-9-]+\.svg$/).nullable().optional(), image_alt: optionalText,
  amenities: z.array(z.string()).optional(), voice_summary: optionalText,
});
export const ListingsResponseSchema = z.object({ listings: z.array(ListingResponseSchema) });
export const SponsorResponseSchema = z.object({
  id: z.uuid(), name: z.string(),
  website: z.url().refine(value => value.startsWith('https://')),
  message: z.string().optional(),
});
export const SponsorsResponseSchema = z.object({ sponsors: z.array(SponsorResponseSchema) });

export function toProperty(row: z.infer<typeof ListingResponseSchema>) {
  return {
    ...row, property_id: row.id,
    price: row.rent_cents / 100,
    address: { line_1: row.address_line_1, line_2: row.address_line_2, city: row.city, state: row.state, zip_code: row.zip_code },
    image_url: propertyImages.find(image => image === row.image_url) ?? '/properties/brookhaven-apartment.svg',
    image_alt: row.image_alt ?? 'Illustration of a fictional residential building',
    property_url: `/properties/${row.id}`,
  };
}
export function toSponsor(row: z.infer<typeof SponsorResponseSchema>) {
  return { business_name: row.name, website_url: row.website, message: row.message || `Discover ${row.name}, a neighborhood sponsor.` };
}
export type Property = ReturnType<typeof toProperty>;
export type Sponsor = ReturnType<typeof toSponsor>;
