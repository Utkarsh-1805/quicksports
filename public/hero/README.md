# Hero images

Drop the following JPG/WEBP files in this directory. The app references them by these exact filenames:

| Filename | Used on | Recommended size | Tone |
|---|---|---|---|
| `landing-hero.jpg` | `/` (home) | 1920×1080, JPG/WEBP, ≤300KB | Dark stadium / athlete-in-motion. Will be tinted with `bg-gradient-to-t from-on-surface/90`. |
| `login-hero.jpg` | `/auth/login` | 1400×1600 (portrait), ≤200KB | Action sports moment, will be cropped/positioned center. |
| `register-hero.jpg` | `/auth/register` | 1400×1600 (portrait), ≤200KB | Athlete or team / community feel. |

## Where to get free, license-friendly photos
- [Unsplash](https://unsplash.com/s/photos/badminton) — search "badminton stadium", "tennis serve", "basketball arena"
- [Pexels](https://www.pexels.com/search/sports/)

## How the app loads them
The page files read these constants at the top:
- `src/app/page.js` → `const HERO_IMAGE = '/hero/landing-hero.jpg'`
- `src/app/auth/login/page.js` → `const HERO_IMAGE = '/hero/login-hero.jpg'`
- `src/app/auth/register/page.js` → `const HERO_IMAGE = '/hero/register-hero.jpg'`

If a file is missing, the page will render with no background image (gradient overlay still applies). Drop in any JPG with those names to instantly apply.
