# TechLegion Switzerland — Website

The community website for [TechLegion Switzerland](https://techlegion.ch/) — a non-profit Swiss association (Verein) based in Zug, building Switzerland's next generation of innovators through technology, education, startups, and space innovation.

This is a fully static website (HTML, CSS, vanilla JS) deployable to GitHub Pages.

## What's here

| Page              | File              | Notes                                                |
| ----------------- | ----------------- | ---------------------------------------------------- |
| Home              | `index.html`      | Hero, programs, stats, live Google Calendar, social   |
| About             | `about.html`      | Mission, vision, values, NASA Space Apps, Verein info |
| Programs          | `programs.html`   | All 8 pillars (workshops, coaching, hackathons, ...)  |
| Events            | `events.html`     | Live Google Calendar embed + categories               |
| Membership        | `membership.html` | Full application form with CHF 100 / year disclosure  |
| Team              | `team.html`       | Team cards (Andreas Punter seeded as example)         |
| Partners          | `partners.html`   | Tiered partner grid + become-a-partner CTA            |
| Newsletter        | `newsletter.html` | Signup form with double opt-in note                   |
| Contact           | `contact.html`    | Contact form + email + address                        |
| Privacy Policy    | `privacy.html`    | GDPR / revFADP baseline                               |
| Terms             | `terms.html`      | Swiss-law baseline                                    |
| Blog              | `blog.html`       | Placeholder posts                                     |
| 404               | `404.html`        | Friendly not-found page                               |

Shared assets:

- `assets/css/main.css` — full design system (tokens, components, responsive)
- `assets/js/main.js` — language switcher, mobile nav, scroll animations, animated counters
- `assets/js/i18n.js` — translations for **English, German, French, Italian, Ukrainian**
- `assets/img/` — `logo.png`, `banner.png`, `spaceapps-zurich.png` (real NASA Space Apps Zurich brand asset), `spaceapps-motif.png`
- `assets/img/team/` — drop real team member photos here (`tamara.jpg`, `alper.jpg`, `julia.jpg`) and replace the `<div class="team-avatar">XX</div>` line in `team.html` with `<img class="team-photo" src="assets/img/team/tamara.jpg" alt="Tamara Koliada" />`. There's an HTML comment above each card showing the exact swap. Photos look best at 240×240 or larger, square.

Old Tilda-exported pages were moved to `archive/` (still in git history if needed).

## Languages (i18n)

Every page is translated via `data-i18n` keys. The default is English. Users can switch via the language picker in the header; their choice is saved to `localStorage` and the `<html lang>` attribute is updated. Each page also declares `<link rel="alternate" hreflang="...">` for SEO. Translations live in a single file: `assets/js/i18n.js`.

> ⚠️ Translations were prepared as a strong starting point but should be reviewed by a native speaker before going live — especially Ukrainian (`ua`) and Italian (`it`).

To edit a translation, open `assets/js/i18n.js`, find the key (e.g. `"hero.title"`), and update the value for each language.

## Deploying to GitHub Pages

1. Push this folder to your GitHub repo (the `CNAME` file already contains `techlegion.ch`).
2. In **Settings → Pages**, set the source to `main` branch / root (or `gh-pages` if you use a deploy workflow).
3. Confirm the custom domain `techlegion.ch` and enable **Enforce HTTPS**.
4. Make sure your DNS has either an `A` record pointing to GitHub Pages IPs or a `CNAME` record pointing to `<your-user>.github.io`.

The `.nojekyll` file is already present so GitHub Pages serves the files as-is.

## Wiring up the "backend" features

GitHub Pages is static-only, so the spec's backend features are integrated via third-party services. Each form has an `INTEGRATION NOTE` comment pointing to the right place to add your endpoint.

### Contact form (`contact.html`)
Use [Formspree](https://formspree.io), [Getform](https://getform.io) or [Web3Forms](https://web3forms.com). All are GDPR-friendly and include built-in CAPTCHA / spam protection.

1. Create an account and a new form.
2. Open `contact.html` and replace `action=""` on the form with your endpoint, e.g.
   ```html
   <form class="form" method="POST" action="https://formspree.io/f/YOUR_ID">
   ```
3. Remove `data-form-demo` from the form to disable the demo handler.
4. Add reCAPTCHA v3 or hCaptcha if your service doesn't include CAPTCHA by default.

### Membership form (`membership.html`)
Same pattern as contact — point `action` to a Formspree/Getform endpoint that emails the board. Add Stripe / TWINT / Payrexx payment links to the "Payment" section once approved.

- **Stripe Payment Link**: create a CHF 100 recurring product, then link the button to the Payment Link URL.
- **TWINT Business** and **Payrexx**: add their hosted checkout URLs in the same way.

### Newsletter form (`newsletter.html`)
Use [Zoho Campaigns](https://www.zoho.com/campaigns/) (matches your spec), [Buttondown](https://buttondown.email), or [Mailchimp](https://mailchimp.com). All support double opt-in and GDPR consent.

Replace the form's `action` with the hosted form endpoint and remove `data-form-demo`.

### Google Calendar (`events.html`, `index.html`)
The calendar is already embedded as an iframe sourced from `techlegion.ch@gmail.com`. Replace the calendar ID if you switch accounts. To allow visitors to add the calendar to their own apps, the "Add to calendar" link uses Google's standard `cid` parameter.

### Admin panel
The spec lists an admin panel (manage events, members, blog, newsletter). On a static stack the practical approach is:

- **Events** — manage in Google Calendar; changes show up live on the site.
- **Members** — Formspree/Getform exports to CSV, or pipe to Airtable / Google Sheets / Notion.
- **Newsletter** — manage from Zoho Campaigns.
- **Blog** — edit Markdown files or move to a static-site generator (Next.js / Astro / Hugo) if blog volume grows.

If you ever outgrow the static stack, the cleanest upgrade path is to move the same HTML/CSS into a [Next.js](https://nextjs.org) app and add a headless CMS (Sanity, Strapi, or Directus) — the design system is already CSS-variable-based and will port directly.

## Local preview

Open `index.html` directly in your browser, **or** run a tiny local server (recommended so language-switcher `localStorage` works correctly):

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

Then open <http://localhost:8080>.

## Accessibility & SEO checklist

- ✅ Semantic HTML, alt text on all images, ARIA labels on icon-only buttons
- ✅ Keyboard-navigable nav and forms
- ✅ Reduced-motion media query respected
- ✅ Color contrast meets WCAG AA on the dark theme
- ✅ OpenGraph, hreflang, sitemap.xml, robots.txt
- ✅ Mobile-first responsive (tested at 360px, 720px, 1200px)

## Brand

| Token | Value | Purpose |
|-------|-------|---------|
| `--bg-deep` | `#050816` | Page background |
| `--accent` | `#4d8bff` | Primary brand color |
| `--accent-glow` | `#7dd3ff` | Highlights, links |
| `--accent-violet` | `#8b5cf6` | Secondary gradient |
| `--text` | `#e8edff` | Body text |
| Font (display) | Space Grotesk | Headings, buttons, nav |
| Font (body) | Inter | Paragraphs, forms |

## License

© 2026 TechLegion Switzerland. All rights reserved.
