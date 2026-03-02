# QRCraft — Free Permanent QR Code Generator

Generate free, permanent QR codes for Google Drive links and any URL. No sign-up, no expiration, no data stored.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Permanent QR Codes** — URLs are encoded directly into the QR pattern. No redirect servers, no expiry.
- **Google Drive Optimized** — Auto-detects Drive links, normalizes them, and shows sharing tips.
- **Customizable** — Color presets, custom foreground/background colors, size (150–1000px), margin, and error correction levels (L/M/Q/H).
- **Multiple Formats** — Download as PNG, SVG, or JPEG.
- **Copy to Clipboard** — One-click copy as image.
- **100% Client-Side** — No data is stored or sent to any server. Everything runs in your browser.
- **Responsive & Accessible** — Works beautifully on desktop, tablet, and mobile.
- **Dark Mode** — Automatic dark mode support.

## Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org/) | React framework |
| [React 19](https://react.dev/) | UI library |
| [Tailwind CSS 4](https://tailwindcss.com/) | Styling |
| [qrcode](https://www.npmjs.com/package/qrcode) | QR code generation |
| [react-icons](https://react-icons.github.io/react-icons/) | Icons |
| TypeScript | Type safety |

## Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/webKing021/QRCraft-Generator.git
cd QRCraft-Generator

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Build for Production

```bash
npm run build
npm start
```

## How It Works

1. **Paste Your Link** — Enter any URL (Google Drive, websites, YouTube, etc.)
2. **Customize (Optional)** — Pick colors, size, margin, and error correction level
3. **Generate & Download** — Get your QR code as PNG, SVG, or JPEG, or copy it to clipboard

### Why Are These QR Codes Permanent?

Unlike services that route scans through their own servers (which can expire or shut down), QRCraft encodes your URL **directly** into the QR pattern. The QR code itself contains your link — no middleman, no expiry. It works as long as the destination URL is active.

## Project Structure

```
src/
  app/
    page.tsx        # Main QR code generator page (client component)
    layout.tsx      # Root layout with metadata
    globals.css     # Global styles & Tailwind imports
    icon.png        # Website favicon
public/
    icon.png        # QR code maker icon
```

## Developed By

**Krutarth Raychura** — [GitHub](https://github.com/webKing021/)

## License

This project is open source and available under the [MIT License](LICENSE).
