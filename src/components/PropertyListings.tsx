"use client";

import { useState } from "react";
import type { Property } from "@/types";
import PropertyCard from "@/components/PropertyCard";
import SearchFilters, { type SearchCriteria } from "@/components/SearchFilters";

interface PropertyListingsProps {
  properties: Property[];
}

export default function PropertyListings({ properties }: PropertyListingsProps) {
  const [criteria, setCriteria] = useState<SearchCriteria>({
    propertyType: "",
    minimumBedrooms: 0,
    maximumPrice: null,
  });

  const matchingProperties = properties.filter(
    (property) =>
      (!criteria.propertyType || property.property_type === criteria.propertyType) &&
      (criteria.minimumBedrooms === 0 || (property.bedrooms != null && property.bedrooms >= criteria.minimumBedrooms)) &&
      (criteria.maximumPrice === null || property.price <= criteria.maximumPrice),
  );

  const criteriaDescription = [
    criteria.propertyType
      ? `${criteria.propertyType} properties`
      : "all property types",
    criteria.minimumBedrooms > 0
      ? `at least ${criteria.minimumBedrooms} bedrooms`
      : "any bedroom count",
    criteria.maximumPrice === null
      ? "no maximum monthly rent"
      : `a maximum monthly rent of $${criteria.maximumPrice.toLocaleString("en-US")}`,
  ].join(", ");

  return (
    <>
      <div className="mt-12">
        <SearchFilters onSearch={setCriteria} />
      </div>

      <section aria-labelledby="listings-heading" className="mt-12">
        <h2 id="listings-heading" className="mb-6 text-2xl font-semibold">
          Available Properties
        </h2>
        <p aria-live="polite" className="mb-4 text-sm text-slate-600">
          {matchingProperties.length === 1
            ? `1 property matches: ${criteriaDescription}.`
            : `${matchingProperties.length} properties match: ${criteriaDescription}.`}
        </p>
        {matchingProperties.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matchingProperties.map((property) => (
              <PropertyCard key={property.property_id} property={property} />
            ))}
          </div>
        ) : (
          <p role="status" className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700">
            {properties.length === 0 ? 'No approved listings yet. Check back soon.' : 'No properties match these filters. Try a different selection.'}
          </p>
        )}
      </section>
    </>
  );
}
