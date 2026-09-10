# CLAUDE.md Template

Write the student's real answers into this structure. Delete any section they
have no answer for rather than filling it with a placeholder. An honest short
CLAUDE.md beats a padded one.

```markdown
# Project: [Site name]

## What this is
[One or two sentences. What the site is and who runs it.]

## Who it is for
[The primary user, described as a person with a goal, not a demographic bracket.]

## What success looks like
[The one action a visitor should take.]

## Pages
- [page]: [what it is for]
- [page]: [what it is for]

## Design direction
- Feel: [their three words]
- Colors: [hex values, with a note on where each is used]
- Typography: [heading font, body font, and why]
- Layout: [any structural decision already made]

## Technical constraints
- Plain HTML and CSS. No frameworks, no build step, no CDN links.
- Must work on mobile at 375px wide and on desktop.
- Accessible: real semantic HTML, alt text on every image, contrast that passes
  WCAG AA.

## How I want to work with Claude
- Show me a plan before editing more than one file.
- Explain design tradeoffs, do not just pick for me.
- When I make a decision, add it to this file.
- No em dashes in any copy.

## Decisions log
[Add a dated line every time a design decision is made. This is what makes the
file get more useful over the semester instead of going stale.]
- [date]: [decision and the reason]
```

## Coaching notes

- The **Decisions log** is the section students skip and the section that matters
  most. Point at it explicitly.
- The **How I want to work with Claude** section is where the student asserts
  creative control. If a student leaves it empty, they will end up accepting
  whatever Claude generates. Push them to fill it in.
- CLAUDE.md is not a prompt they write once. Tell them to expect to edit it three
  or four times during the build.
