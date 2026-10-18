# cis3610-capstone-beacon
Team B Beacon — CIS 3610 Web Design and Development Capstone, California State University, Los Angeles.

## Lab 4: Discovery and planning
Start with [the Lab 4 index](docs/lab-04/README.md). Discovery documents remain provisional; no verified interviews have been provided.

The provisional concept connects property professionals with local sponsors through property listings and promotional content. Business needs, personas, requirements, and Week 8 scope require instructor and stakeholder confirmation. No verified interviews have been provided.

**DO NOT CONTACT STAKEHOLDERS WITHOUT INSTRUCTOR APPROVAL.**

Repository: https://github.com/byteboss22/cis3610-capstone-beacon (private; confirmed through GitHub).

## Database lab
See [the database lab guide](docs/lab-database/README.md) for the Supabase/PostgreSQL migration, fictional seed, default-deny RLS, server routes, Next.js listings interface, executable tests, and redacted evidence.

The interface reuses the earlier [Neighborhood Listing Platform](https://github.com/byteboss22/neighborhood-listing-platform), including its cards, filters, SVG illustrations, and sponsor banner. See [interface integration](docs/lab-database/interface-integration.md) for source attribution and the additive database upgrade.

Use Node 24, run `npm ci` and `npm test`. To start the application, configure the ignored `.env.local` using `.env.example`, apply the migration to a development Supabase project, then run `npm start`. A Supabase development project has been connected locally and anonymous read/denial checks have passed; credentials remain local. Hosted migration `0002`, authenticated owner/admin verification, separate ChatGPT/Gemini reviews, and deployment remain pending.
