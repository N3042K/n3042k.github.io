# Airport Code Search

A simple, beautiful web application to search for airports by their codes (IATA, ICAO, or local codes).

## Quick Deploy

### Option 1: Netlify (Easiest - Drag & Drop)

1. Go to [netlify.com](https://netlify.com) and sign up (free)
2. Drag and drop the entire `airportcode` folder onto their homepage
3. Your site will be live in seconds!

### Option 2: GitHub Pages

1. Create a new GitHub repository
2. Upload all files to the repository
3. Go to Settings → Pages
4. Select `main` branch as source
5. Your site will be at `https://yourusername.github.io/repository-name`

### Option 3: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. In the project directory, run: `vercel`
3. Follow the prompts

### Option 4: Any Static Hosting Service

Upload these files:
- `index.html`
- `style.css`
- `script.js`
- `airport-codes.csv`

That's it! All static hosting services will work (Surge.sh, Firebase Hosting, AWS S3, etc.)

## Local Testing

If you want to test locally first:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`

## Features

- Search by airport code (e.g., OAK, JFK, LAX)
- Beautiful, modern UI
- Responsive design
- Works offline after first load
- Over 82,000 airports in the database

