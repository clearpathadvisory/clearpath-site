CLEARPATH ADVISORY — STUDIO SITE
================================

Plain HTML, CSS and JS. No build step, no npm install.
Same deploy pattern as your other sites: extract over the clone,
commit in GitHub Desktop, push, Vercel picks it up.


FILES
-----
index.html            the whole site (all content lives here)
privacy.html          short GDPR notice
assets/styles.css     all styling
assets/main.js        all motion
assets/vendor/        GSAP, ScrollTrigger and Lenis, self-hosted
assets/favicon.svg    tab icon
robots.txt / sitemap.xml


TO SEE IT NOW
-------------
Double-click index.html. Everything works offline except the form.
The animation libraries are bundled locally, so nothing is fetched
from a CDN.


STEP 1 — FORM: DONE
-------------------
The form posts to https://formspree.io/f/maewbzze

It uses the Basic HTML integration (endpoint on the form's action) with
the AJAX handler already in assets/main.js, so the page never navigates
away: the button shows "Sending...", then the form clears and a
confirmation appears in place. No Formspree library is loaded, nothing
is fetched from a CDN.

Tested end to end against a stubbed endpoint. The POST carries:
  name, email, needs (one value per chip ticked), budget, message
plus two hidden helpers:
  _subject   titles the notification email Formspree sends you
  _gotcha    honeypot, kept empty by display:none

If a submission ever lands in Formspree's Spam tab instead of the
Inbox, open it, tick it and mark it Not spam. That trains the filter.
A spam-flagged submission is stored but does not send you an email,
which looks exactly like the form being broken when it is not.

To test for real: open the site, send one submission with your own
details, and check it lands in the Formspree dashboard. Formspree will
email you to confirm the very first one.


STEP 2 — THE LAST FIND AND REPLACE
----------------------------------
hello@clearpathadvisory.com is still a placeholder I invented. It
appears in index.html (contact section and footer) and privacy.html.
Swap in your real inbox, or delete those lines if you would rather
people only used the form.

Same for clearpathadvisory.com if the live domain differs -- it is in
index.html, privacy.html, robots.txt and sitemap.xml.

Note the form does not depend on either: Formspree sends submissions
to whichever address you set in its dashboard.


STEP 3 — CONFIRM THREE URLS BEFORE YOU PUSH
-------------------------------------------
Each product links to its own website. BRICK is the exception, it has
no site, so it links to the App Store.

  CasePilot   https://casepilot.app                  known good
  Relay       https://relayme.bio                    known good
  Nightink    https://nightink.app                   GUESSED
  Duskloom    https://duskloom.app                   GUESSED
  BRICK       App Store, Apple ID 6794833513         CHECK ONCE

The two marked GUESSED are my assumption from your casepilot.app
pattern. Neither site is indexed by search yet, so I could not verify
them. Open both, and if either is wrong, search index.html for
"CHECK: domain guessed" -- there are two, plus the same two URLs in
the footer product list. Four edits at most.

IRONWAKE is not on the shelf. To add it back, copy any
<article class="pan"> block and bump the first stat from 5 to 6.


STEP 4 — SCREENSHOTS (done, but read this)
------------------------------------------
All five phones carry real captures. Two were edited: the Nightink
diary text was rewritten, and the Relay page had its cut-off bottom
card rebuilt. Details in assets/shots/README.txt. Overwrite either
file with a fresh capture whenever you want.


STEP 5 — SOCIAL SHARE IMAGE (optional)
--------------------------------------
Save a 1200x630 PNG as assets/og.png. The tags already point at it.


WHAT MOVES, AND WHERE IT LIVES
------------------------------
All in assets/main.js, numbered in order:

 5  Preloader      counter to 100 while product names cycle, then six
                   columns in each product's brand colour wipe upward
 6  Line reveals   headlines rise out of a mask, staggered
 7  Hero parallax  headline drifts and fades as you leave
 8  Marquees       run continuously, skew and speed up with scroll velocity
 9  Stats          count up when they enter view
10  THE SHELF      the pinned horizontal gallery. The page scroll is
                   converted to sideways movement, each panel's body and
                   art drift at different rates, the counter and progress
                   bar track position, and the viewport repaints to the
                   active product's colour
12  Services       sticky index number swaps as each row passes the read line
13  Process        the vertical rail draws itself as you scroll
14  Footer         LET'S BUILD animates in per character. It is a solid
                   extrusion: a grey face with twenty 1px offset layers
                   stepping down into near-black, plus one tight contact
                   shadow. To change the depth or angle, edit the
                   .start__big .ch text-shadow stack in styles.css --
                   more layers is deeper, and the two offsets set the
                   light direction. Avoid adding blur to the layers,
                   which is what made an earlier version look mushy.
 3  Cursor         custom ring with a lagging follow, grows over links and
                   shows a label, inverts on dark sections. The grown
                   state is frosted glass, not a solid disc, and it
                   hides itself entirely while a form field has focus so
                   it can never sit over what is being typed. To switch
                   the cursor off altogether, delete section 3 in
                   assets/main.js and the .cur rules in styles.css.
 4  Magnetic       buttons pull toward the pointer and spring back. On
                   hover the fill drops away to leave just the outline,
                   the button breathes between 1.04 and 1.11, and a ring
                   pulses outward from its edge

Ambient graphics: a colour orb behind the hero that rotates on scroll, one
floating chip per product in its accent colour, small charts beside each
statistic, an icon per service that also enlarges in the sticky column,
nodes on the process rail, rotating rings in the studio section, and a dot
grid with a colour aura behind the contact form.

Turn any single one off by deleting its block. Nothing else depends on it.


THE PRODUCT MOCKUPS
-------------------
Each product panel carries a phone showing that product's interface,
drawn entirely in CSS from its own palette. No screenshots, so nothing
goes stale when you ship an update.

  CasePilot   case cards, a red status tag, a progress bar that fills
  Relay       avatar, link rows, the accent row lifting, email capture
  Nightink    cream page, pink date pill, a sticker that rocks
  BRICK       a 4x5 tile grid with amber tiles that pulse
  Duskloom    mint arc and an equaliser wave

They are built from small pieces in styles.css under DEVICE MOCKUPS:
ui-ln (a text line, with width classes w20 to w95), ui-case, ui-link,
ui-grid, ui-sticker and so on. Rearranging those inside a dev__screen
is how you change what a phone shows.


HOW TO ADD A PRODUCT TO THE SHELF
---------------------------------
Copy an <article class="pan"> block in index.html and change:

  data-hue      the dark brand colour   (panel background, phone screen)
  data-ink      the light text colour
  data-accent   the accent              (link, dot, mockup highlight)
  data-name     shown in the preloader

Then the name, paragraph, the three meta rows and the link. The preloader
column, the hero chip and the 01/05 counter all update on their own.

For the phone, copy the dev block from whichever product is closest and
swap the pieces around.


MOBILE
------
Checked on iPhone SE, iPhone 12, iPhone 15 Pro Max, Pixel 7 and iPad
mini. No sideways scroll, every touch target at least 44px, nothing
smaller than 11px type, and the cursor effect is off on touch devices.

The one thing to be careful about if you add decoration later: the
colour washes and hero chips sit deliberately past the right edge.
body{overflow-x:hidden} hides the scrollbar but the document stays
wider than the screen, and a phone responds by zooming the whole page
out to fit, which knocks everything off position. html and the
sections carry overflow-x:clip to contain that. Keep it.


IF SOMETHING BREAKS
-------------------
The site degrades in three stages. With JavaScript off, a <noscript> block
shows everything and stacks the gallery vertically. If the scripts fail to
load, a six second failsafe unlocks the page. If someone has "reduce
motion" switched on in their operating system, all animation is skipped
and the gallery stacks. Content is always readable.


DESIGN NOTES
------------
The page itself is grey on purpose. Every colour comes from a product's own
palette, which is why the horizontal gallery is the loudest thing here.

Fonts: Bricolage Grotesque (headlines), Schibsted Grotesk (body),
Azeret Mono (labels). Schibsted and Azeret are already your CasePilot
faces, so the studio and the products share a voice. To change the
headline face, edit --display in styles.css.
