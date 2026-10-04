# Wolfpack Labs — warm redesign

Static site for the existing wolfpack-labs.com GitHub Pages setup. No build step required.

## Included
- Apps, Tools, Resources and Blog navigation.
- Warm cream, terracotta and teal styling across new pages and existing support/product/legal/customer pages.
- Eight starter articles; all article content is static HTML and crawlable without JavaScript.
- Homepage carousel: six-second autoplay, previous/next, article selectors and persistent pause. Stops while hovered, focused, hidden, or off screen. Reduced-motion users get manual navigation by default.
- Blog search matches title, summary and category. Category filters combine with the search; query is reflected in the URL. Empty state and reset are included.
- Three calculators: contractor pricing, margin/markup, and late fees with explicit calculation methods.
- Editable printable invoice/estimate worksheets plus two text downloads. Worksheets do not automatically calculate totals or persist edits after reload.

## Preview
Run `python3 -m http.server 8000` from this folder, then visit http://localhost:8000.

## Deploy to existing GitHub Pages
Back up the existing site. Copy the contents of this folder to the publishing root, including the existing CNAME. The domain remains wolfpack-labs.com. No hosting change is needed.

## Preserved integrations
Original contact, deletion request, estimate acceptance, payment redirects and proof-pack scripts remain intact. Their live backends were not invoked or modified.
The supplied ZIP predated the earlier traffic rebuild. The blog/tool/resource structure was recreated from the conversation rather than editing that unavailable ZIP.
No newsletter backend or newsletter form was present in the supplied site; the keep-in-touch area links to the existing contact form. No fake subscription confirmation, ads, checkout or analytics were added.

## Adding articles
Add an HTML article under blog/, then add a story-card to blog.html and the homepage carousel. `data-search` contains the title, summary and category, and `data-category` must match its filter. The carousel reads its slides from the HTML, so controls adapt to the number of cards. Update sitemap.xml.
