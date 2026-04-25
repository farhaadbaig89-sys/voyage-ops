# Suggestions

- **Migrate Gifts Hub to socials**: Same Meta app already covers the Gifts Hub Australia FB page (id 111527618129227) + IG (id 17841466209335238). Cloning the socials pipeline for Gifts Hub is mostly a config change — no new approvals needed.

- **Search Console API for accurate ranks**: Public Google `site:` scraping is unreliable (bot detection). Hooking up GSC API gives true indexed-page count, top queries, average position, click-through rate. ~30 min setup once you grant the OAuth.

- **TikTok Content Posting API**: Requires a TikTok for Developers app + content-review approval (multi-day). Once unlocked, reuses the same product-of-the-day pipeline with short video.

- **Real Reels via ffmpeg pipeline**: I can build a slideshow generator (Ken Burns pan, text overlays, royalty-free background music) on the local machine. Output is decent "Etsy-ish" quality — good for early growth, swap for paid video API later.

- **Comment alert → Telegram**: Stream new FB Page + IG comments to your Telegram so you can reply personally. Higher engagement than auto-replies.

- **SEO auto-fix mode**: The audit currently reports issues only. Once we've watched a few cycles, flip on auto-fix for guardrail-passing products: write meta descriptions, fix title length, add image alt-text. Reversible if anything misfires.

- **Price-drop history tracker**: Daily snapshot of top-200 product prices. Detect drops, surface to the deals roundup with "was X, now Y" + true delta.

- **UGC reposting workflow**: When a customer tags @voyagecollectionaustralia, alert me — I draft a repost for your approval.

- **Email digest**: Daily summary email at 18:00 AEST: orders today, posts published, audit findings, blog status. Less Telegram noise.

- **Cross-store sales attribution**: If a Voyage blog/social post drives a Gifts Hub sale (or vice versa), surface the link. Useful for budget allocation between brands.
