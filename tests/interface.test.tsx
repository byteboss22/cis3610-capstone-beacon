import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { ListingResponseSchema, SponsorResponseSchema, toProperty } from '../src/contracts/listing';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
Object.assign(globalThis, {
  window: dom.window, document: dom.window.document,
  HTMLElement: dom.window.HTMLElement, HTMLInputElement: dom.window.HTMLInputElement,
  getComputedStyle: dom.window.getComputedStyle, FormData: dom.window.FormData, IS_REACT_ACT_ENVIRONMENT: true,
});
const { render, fireEvent, waitFor, cleanup } = await import('@testing-library/react');
const { default: ListingsExplorer } = await import('../src/components/ListingsExplorer');
const { default: PropertyDetail } = await import('../src/components/PropertyDetail');
const originalFetch = globalThis.fetch;
const row = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Demo Garden Apartment',
  description: 'Fictional listing for coursework.', city: 'Sample City', rent_cents: 180000,
  property_type: 'apartment', bedrooms: 2, bathrooms: 1.5, square_feet: 920,
  image_url: '/properties/brookhaven-apartment.svg', image_alt: 'Fictional apartment illustration',
};
const second = { ...row, id: '10000000-0000-4000-8000-000000000002', title: 'Demo House', image_alt: 'Fictional house illustration', property_type: 'house', bedrooms: 4, rent_cents: 420000 };
const sponsor = { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', name: 'Fictional Cafe', website: 'https://example.invalid/cafe', message: 'Your neighborhood coffee stop.' };
const response = (data: unknown, ok = true) => ({ ok, json: async () => data }) as Response;
beforeEach(() => {
  globalThis.fetch = async input => String(input).includes('sponsors') ? response({ sponsors: [sponsor] }) : response({ listings: [row, second] });
});
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });

test('restored UI shows loading, Supabase cards, rent and active sponsor content', async () => {
  const view = render(<ListingsExplorer />);
  assert.ok(view.getByText('Loading listings…'));
  assert.ok(await view.findByRole('heading', { name: row.title }));
  assert.ok(view.getByText('$1,800 / month'));
  assert.equal(view.getByAltText(row.image_alt).getAttribute('src'), row.image_url);
  assert.equal(view.getByRole('link', { name: `View details for ${row.title}` }).getAttribute('href'), `/properties/${row.id}`);
  assert.ok(await view.findByRole('link', { name: 'Visit Fictional Cafe' }));
});
test('search combines property type, bedroom count and monthly rent; reports no matches', async () => {
  const view = render(<ListingsExplorer />);
  await view.findByRole('heading', { name: row.title });
  fireEvent.change(view.getByLabelText('Property type'), { target: { value: 'apartment' } });
  fireEvent.change(view.getByLabelText('Minimum bedrooms'), { target: { value: '2' } });
  fireEvent.change(view.getByLabelText('Maximum monthly rent'), { target: { value: '2000' } });
  fireEvent.click(view.getByRole('button', { name: 'Search properties' }));
  assert.equal(view.queryByRole('heading', { name: 'Demo House' }), null);
  assert.ok(view.getByRole('heading', { name: row.title }));
  fireEvent.change(view.getByLabelText('Minimum bedrooms'), { target: { value: '4' } });
  fireEvent.click(view.getByRole('button', { name: 'Search properties' }));
  assert.ok(view.getByText(/No properties match these filters/));
});
test('empty database states and missing presentation fields do not fabricate attributes', async () => {
  globalThis.fetch = async input => response(String(input).includes('sponsors') ? { sponsors: [] } : { listings: [] });
  const view = render(<ListingsExplorer />);
  assert.ok(await view.findByText(/No approved listings yet/));
  assert.ok(await view.findByText(/No neighborhood sponsors are available/));
  const basic = ListingResponseSchema.parse({ id: row.id, title: row.title, description: row.description, city: row.city, rent_cents: row.rent_cents });
  assert.equal(toProperty(basic).bedrooms, undefined);
  assert.equal(toProperty(basic).price, 1800);
});
test('error and retry states recover, and listing text is never interpreted as HTML', async () => {
  let fail = true;
  globalThis.fetch = async input => String(input).includes('sponsors') ? response({ sponsors: [] }) : fail ? response({}, false) : response({ listings: [{ ...row, title: '<img src=x onerror=alert(1)>' }] });
  const view = render(<ListingsExplorer />);
  assert.ok(await view.findByRole('alert'));
  fail = false;
  fireEvent.click(view.getByRole('button', { name: 'Try again' }));
  assert.ok(await view.findByRole('heading', { name: '<img src=x onerror=alert(1)>' }));
  assert.equal(view.container.querySelector('h3 img'), null);
});
test('unavailable sponsors do not hide properties and can be retried independently', async () => {
  let fail = true;
  globalThis.fetch = async input => String(input).includes('sponsors') ? fail ? response({}, false) : response({ sponsors: [sponsor] }) : response({ listings: [row] });
  const view = render(<ListingsExplorer />);
  assert.ok(await view.findByRole('heading', { name: row.title }));
  await view.findByRole('button', { name: 'Retry sponsors' });
  fail = false;
  fireEvent.click(view.getByRole('button', { name: 'Retry sponsors' }));
  assert.ok(await view.findByRole('link', { name: 'Visit Fictional Cafe' }));
});
test('detail page renders description and amenities and handles unpublished records safely', async () => {
  globalThis.fetch = async () => response({ listing: { ...row, amenities: ['public_transit'] } });
  const view = render(<PropertyDetail id={row.id} />);
  assert.ok(await view.findByRole('heading', { level: 1, name: row.title }));
  assert.ok(view.getByText(row.description));
  assert.ok(view.getByText('public transit'));
  assert.equal(view.queryByRole('link', { name: /View details/ }), null);
  cleanup();
  globalThis.fetch = async () => response({}, false);
  const hidden = render(<PropertyDetail id={row.id} />);
  assert.ok(await hidden.findByRole('heading', { name: 'This listing is unavailable.' }));
  await waitFor(() => assert.equal(hidden.queryByText(row.description), null));
});
test('response validation rejects unsafe image and sponsor URL protocols', () => {
  assert.equal(ListingResponseSchema.safeParse({ ...row, image_url: 'javascript:alert(1)' }).success, false);
  assert.equal(SponsorResponseSchema.safeParse({ ...sponsor, website: 'javascript:alert(1)' }).success, false);
});
