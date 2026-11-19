# Akka Birthday Surprise Website

A React + Vite static birthday website, designed for Netlify. No backend or server is required.

## Run locally
1. Install Node.js (LTS) if you don't already have it.
2. Open this folder in VS Code.
3. In the terminal, run:
   ```bash
   npm install
   npm run dev
   ```
4. Open the local URL printed by Vite.

## Add your photos
The website currently has illustrated photo placeholders. To use your photos:
- Put photos into `public/photos/`.
- Open `src/main.jsx` and find the `PhotoSlot` component and the `PhotoSlot` entries.
- Replace each placeholder with an `<img src="/photos/your-photo.jpg" alt="..." />` using the photo you want.
- Use `object-fit: cover` in CSS for a neat crop. (A photo helper is intentionally not wired up yet, so this is a simple manual swap.)

Suggested photos: a portrait of Akka, a photo together, cooking together, a funny candid, and a favourite memory.

## Deploy to Netlify
- Push this folder to a GitHub repository.
- In Netlify, choose **Add new site → Import an existing project** and connect the repository.
- Build command: `npm run build`
- Publish directory: `dist`
- `netlify.toml` already includes these settings.

You can also deploy manually after running `npm run build`, by uploading the `dist` folder to Netlify Drop.
# Birthday
