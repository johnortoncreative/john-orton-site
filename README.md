# John Orton — website

Static site (plain HTML/CSS/JS, no build step). Hosted on Netlify; every push to `main` deploys automatically.

```
index.html          page markup
css/styles.css      all styles (design tokens at the top)
js/main.js          typing, reveals, cursor, reel player, enquiry form
assets/images/      photos, posters (JPG/WebP, ~200–400 KB each)
assets/videos/      short MP4 clips (H.264, aim for under 10 MB each)
netlify.toml        Netlify config
```

## Preview locally

```
python3 -m http.server 8000
```
then open http://localhost:8000

## Browser caching

`index.html` loads `css/styles.css?v=YYYYMMDD` and `js/main.js?v=YYYYMMDD`. Bump the date whenever either file changes, so visitors' browsers fetch the new version instead of a saved copy.

## Adding media

- **Images:** replace a `<div class="ph" ...></div>` placeholder with `<img src="assets/images/NAME.jpg" alt="...">`.
- **Showreel:** `assets/videos/showreel-2026.mp4` (with sound, plays on click), poster `assets/images/showreel-2026-poster.jpg`. Use a new file name for a new cut so browsers don't serve the cached one (assets are cached for 7 days).
- **Film card clips:** replace the card's placeholder with
  `<video src="assets/videos/NAME.mp4" poster="assets/images/NAME.jpg" muted playsinline loop preload="none" data-autoplay></video>`

### Video compression (ffmpeg)

```
ffmpeg -i in.mov -vf "scale=-2:1080" -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart -an out.mp4
ffmpeg -ss 1 -i out.mp4 -frames:v 1 -q:v 3 poster.jpg
```
Use `scale=-2:720` and `-crf 28` for small background loops. Drop `-an` if the clip needs sound.
GitHub rejects files over 100 MB and warns over 50 MB.

## Contact form

Uses Netlify Forms (form name `enquiry`). Submissions appear in Netlify → Site → Forms; set up email notifications there.
