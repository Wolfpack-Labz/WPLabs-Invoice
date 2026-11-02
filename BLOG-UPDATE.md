# October 30, 2026 article update

Five new everyday IT guides have been added to the existing Wolfpack Labs site. The site contains 46 published articles after this update.

## New articles

| File | Article |
| --- | --- |
| `blog/wifi-connected-but-no-internet.html` | Wi-Fi connected but no internet? What to check first |
| `blog/printer-offline-windows-mac.html` | Printer offline? How to fix it on Windows and Mac |
| `blog/second-monitor-not-detected.html` | Second monitor not detected? Windows and Mac fixes |
| `blog/password-reset-email-not-arriving.html` | Password reset email not arriving? What to check first |
| `blog/microphone-not-working-zoom-teams.html` | Microphone not working in Zoom or Teams? Start here |

## Updated files

The following established articles each gained a contextual link to the matching new guide, plus accurate modification metadata:

- `blog/why-is-my-wifi-so-slow.html`
- `blog/scan-document-to-pdf-on-phone.html`
- `blog/why-usb-c-cables-are-different.html`
- `blog/secure-business-email-before-sending-invoices.html`
- `blog/bluetooth-vs-wifi-explained.html`

Other changed files:

- `sitemap.xml` — uses an article's last_modified_at value when present and its publication date otherwise. Article URLs remain generated automatically.
- `_drafts/blog-post-template.html` — next field note is 47.
- `README.md` — documents the five additions and current article count.
- `BLOG-UPDATE.md` — this exact file list and deployment notes.

## Included in every new guide

- A quick answer and linked table of contents.
- Concrete troubleshooting steps and common questions.
- Contextual links to related Wolfpack Labs guides, two related-reading cards, and the existing question-suggestion contact page.
- Links to relevant official support documentation.
- Unique title and description, canonical URL, Open Graph and Twitter metadata, BlogPosting and BreadcrumbList structured data.
- Original site navigation, footer, colors, fonts, and responsive article layout.

## Deployment

Copy the contents of the Wolfpack Labs folder to the existing site's publishing root and run its normal GitHub Pages/Jekyll deployment. Upload all new and updated files together. Keep the existing CNAME and other configuration.

The homepage, Blog page, category filters, and sitemap already read article front matter. Their source templates do not need manual article cards or URL entries. On the next normal Jekyll build, the five new articles appear in the newest-five homepage carousel, in Blog search and pagination, and in the sitemap.

The local package has been updated; this task does not publish changes to the live domain. Plain static file serving does not process the Liquid-generated lists. Validation details follow below.


## Validation completed

- Parsed all 46 published article metadata blocks and confirmed unique field-note numbers.
- Confirmed the five new guides sort into the newest-five homepage selection.
- Checked 449 local link and asset references across the five new guides and five updated articles, including linked section IDs.
- Parsed and checked the new BlogPosting and BreadcrumbList data, unique descriptions, canonical URLs, and social metadata.
- Opened all five new article pages in the browser and checked their headings, related cards, images, and desktop width.
- Checked the printer guide at a 390-pixel viewport: the contents link reaches its section and its table scrolls within the article without widening the page.
- Compared the package with the supplied archive: 184 original files are byte-for-byte unchanged, 8 original files are updated, 6 files are new, and none are removed.

A full Jekyll build was not run because Ruby and Bundler are unavailable in this environment. The article-page preview strips YAML front matter for inspection; it does not render the homepage/Blog Liquid loops. Run the normal GitHub Pages build when publishing.
