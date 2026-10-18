import { z } from 'zod';
export const presentationFields = {
  property_type: z.enum(['apartment', 'condo', 'duplex', 'house', 'loft']).nullable().optional(),
  address_line_1: z.string().trim().min(1).max(100).nullable().optional(),
  address_line_2: z.string().trim().min(1).max(60).nullable().optional(),
  state: z.string().regex(/^[A-Z]{2}$/).nullable().optional(),
  zip_code: z.string().regex(/^[0-9]{5}$/).nullable().optional(),
  bedrooms: z.number().int().min(0).max(20).nullable().optional(),
  bathrooms: z.number().min(0).max(20).multipleOf(0.5).nullable().optional(),
  square_feet: z.number().int().min(1).max(100000).nullable().optional(),
  image_url: z.string().regex(/^\/properties\/[a-z0-9-]+\.svg$/).nullable().optional(),
  image_alt: z.string().trim().min(1).max(180).nullable().optional(),
  amenities: z.array(z.enum(['accessible_entry', 'balcony', 'laundry', 'parking', 'pet_friendly', 'public_transit', 'yard'])).max(12).optional(),
  voice_summary: z.string().trim().min(1).max(240).nullable().optional(),
};
