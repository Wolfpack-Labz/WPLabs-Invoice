# Wolfpack Labs — warm redesign

GitHub Pages site for wolfpack-labs.com. The site now uses GitHub Pages’ built-in Jekyll processing for automatic blog lists; no separate CI build is required on GitHub Pages.

## Included
- Apps, Tools, Resources and Blog navigation.
- Warm cream, terracotta and teal styling across new pages and existing support/product/legal/customer pages.
- Article content remains static HTML and crawlable; article listing cards are generated at build time from each article’s front matter.
- Homepage carousel: six-second autoplay, previous/next, article selectors and persistent pause. Stops while hovered, focused, hidden, or off screen. Reduced-motion users get manual navigation by default.
- Blog search matches title, summary and category. Category filters combine with the search; query is reflected in the URL. Empty state and reset are included.
- Three calculators: contractor pricing, margin/markup, and late fees with explicit calculation methods.
- Editable printable invoice/estimate worksheets plus two text downloads. Worksheets do not automatically calculate totals or persist edits after reload.

## Preview
Because the homepage/blog lists now use Jekyll/Liquid, use Jekyll for a full local preview:

1. Install Bundler if needed: `gem install bundler`
2. Run `bundle install`
3. Run `bundle exec jekyll serve`
4. Visit `http://localhost:4000`

A plain `python3 -m http.server` preview will still serve static files, but it will not render the automatic Liquid-generated blog cards.

## Deploy to existing GitHub Pages
Back up the existing site. Copy the contents of this folder to the publishing root, including the existing CNAME. The domain remains wolfpack-labs.com. No hosting change is needed.

## Preserved integrations
Original contact, deletion request, estimate acceptance, payment redirects and proof-pack scripts remain intact. Their live backends were not invoked or modified.
The supplied ZIP predated the earlier traffic rebuild. The blog/tool/resource structure was recreated from the conversation rather than editing that unavailable ZIP.
No newsletter backend or newsletter form was present in the supplied site; the keep-in-touch area links to the existing contact form. No fake subscription confirmation, ads, checkout or analytics were added.

## Adding articles
The homepage and Blog page now read article metadata directly from the HTML files in `blog/` during the GitHub Pages build.

1. Copy `_drafts/blog-post-template.html` or an existing article into `blog/`.
2. Fill in the YAML front matter at the very top of the article. Keep `blog_post: true` and set `date` to the publication date/time.
3. Give each article its next `field_note` number and choose an existing `art_color` (`teal`, `peach`, `gold`, or `lilac`).
4. Add the article body as usual and commit/push it.

On the next GitHub Pages deployment:
- `index.html` automatically shows only the five newest posts by `date`.
- `blog.html` automatically shows every post, newest first, and creates category filter buttons from the article metadata.
- `sitemap.xml` automatically includes every `blog_post: true` article.
- The existing carousel controls adapt automatically to the five generated slides.

You no longer add story cards manually to `index.html` or `blog.html`, and you no longer add blog article URLs manually to `sitemap.xml`.

## October 4 footer and page-width update
Every rendered page now uses one centered site shell and the homepage footer. The maximum width is 1160px, with 32px side margins on tablet and 18px on phones. Legal pages, product pages, customer actions and ProofPack share those boundaries. Individual reading columns and printable worksheets retain their internal layouts. Two legacy URL aliases still redirect directly to the product page. The warm stylesheet uses a new version query to refresh browser caches.

## Mobile menu fix
Navigation uses an explicit button with aria-expanded and a hidden/visible panel rather than the browser-native details toggle. It closes on repeated taps, link selection, outside interaction, Escape, rotation, or returning to the page. Desktop links stay visible. The script ignores duplicate initialization, and a new script/style version forces browsers to load the update. Upload the full updated site folder so its HTML, script and stylesheet versions stay together.

## Added publication story
“How I Got My App Published on the Apple App Store” is available under blog/how-i-got-my-app-published-on-the-apple-app-store.html. It is featured first in the blog grid and homepage carousel, included in search and the Building Wolfpack Labs category, linked from the earlier app-building story, and listed in sitemap.xml. BlogPosting metadata includes its publication date. The blog list is now generated automatically from article metadata.


## October 5 article, tool and download update
The blog now contains 19 articles. Six new Field Notes cover customer intake, accepted estimates, change orders, expense tracking, Net 30 and business email security. Their date metadata drives the Blog page and the newest-five homepage carousel automatically. Field Notes 19 through 15 appear on the homepage initially; Field Note 14 remains in the Blog listing. The draft template starts at Field Note 20.

Tools now includes six calculators. Resources provides eight downloadable products, including a 200-entry expense workbook. Calculator methods are documented in CALCULATOR-NOTES.md, and download instructions are in resources/downloads/READ-ME.md. The sitemap includes the three new calculator URLs and automatically generates every blog URL.
