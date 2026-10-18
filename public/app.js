const status = document.querySelector('#status');
const container = document.querySelector('#listings');
const retry = document.querySelector('#retry');
async function load() {
  retry.hidden = true;
  container.replaceChildren();
  container.setAttribute('aria-busy', 'true');
  status.textContent = 'Loading listings…';
  try {
    const response = await fetch('/api/listings', { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Request failed');
    const { listings } = await response.json();
    if (!Array.isArray(listings)) throw new Error('Invalid response');
    for (const listing of listings) {
      const card = document.createElement('article');
      for (const [tag, text] of [
        ['p', listing.city], ['h2', listing.title], ['p', listing.description],
        ['strong', `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(listing.rent_cents / 100)} / month`],
      ]) {
        const element = document.createElement(tag);
        element.textContent = text; // Never interpret listing content as HTML.
        card.append(element);
      }
      container.append(card);
    }
    status.textContent = listings.length ? `${listings.length} approved listing${listings.length === 1 ? '' : 's'}` : 'No approved listings yet. Check back soon.';
  } catch {
    status.textContent = 'Listings could not be loaded. Please try again.';
    retry.hidden = false;
  } finally { container.setAttribute('aria-busy', 'false'); }
}
retry.addEventListener('click', load);
load();
