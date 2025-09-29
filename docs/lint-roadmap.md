# Lint Fix Roadmap

## Stage 7.1 — Fix react/no-unescaped-entities
- Replace unescaped apostrophes and quotes in JSX
- Example: you're → you&apos;re

## Stage 7.2 — Fix @next/next/no-html-link-for-pages
- Replace <a> tags with <Link> for internal navigation
- Example: <a href='/about'> → <Link href='/about'>

## Stage 7.3 — Fix react-hooks/exhaustive-deps
- Add missing dependencies to useEffect arrays
- Inline functions when they are only used once
- Use // eslint-disable-next-line when intentionally skipping

## Stage 7.4 — Final lint clean
- Run npm run lint with zero errors
- Confirm build succeeds without ignoreDuringBuilds
