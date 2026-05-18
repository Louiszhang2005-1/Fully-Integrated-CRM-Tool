# La Centrale Agricole — Fully-Integrated CRM Tool

A comprehensive, AI-powered CRM platform designed for urban agriculture organizations to manage sales outreach, contact enrichment, email campaigns, and booking confirmations.

## Project Overview

This is a **Next.js-based CRM application** built with **TypeScript** (94.8%), CSS (5%), and JavaScript (0.2%). It integrates multiple third-party APIs to streamline contact management and automated outreach workflows.

### Key Features

- **Contact Management**: Store and organize prospects across multiple audience segments (Corporate, Schools, Institutions & Media)
- **AI-Powered Email Generation**: Automatically generate personalized outreach messages using Google Gemini
- **Contact Enrichment**: Enrich LinkedIn profiles with company details and email addresses via Apollo.io
- **Email Campaign Management**: Send professional outreach emails via Resend
- **Google Sheets Integration**: Sync contacts and track campaign status across multiple pipeline tabs
- **Booking Management**: Handle visit booking confirmations and automated responses
- **Demo Mode**: Test email functionality without sending to real recipients

## Technology Stack

- **Frontend**: React 19, Next.js 16, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI/ML**: Google Gemini API
- **Integrations**:
  - Apollo.io (Contact discovery & enrichment)
  - Resend (Email delivery)
  - Google Sheets API (Data storage & pipeline management)
  - Google GenAI (Message generation)

## Project Structure

```
src/
├── app/
│   ├── api/              # API endpoints
│   │   ├── generate/     # AI email generation
│   │   ├── send/         # Email delivery
│   │   ├── lookup/       # Contact enrichment
│   │   ├── discover/     # Contact discovery
│   │   ├── sheets/       # Google Sheets operations
│   │   ├── bookings/     # Booking management
│   │   └── ...
│   ├── settings/         # Configuration UI
│   └── ...
└── styles/               # CSS styles
```

## Configuration

### Required Environment Variables

Create a `.env.local` file with the following API keys:

```env
# Google Gemini (AI Message Generation)
GEMINI_API_KEY=your_gemini_api_key_here

# Resend (Email Delivery)
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=your-email@yourdomain.com  # Optional (requires domain verification)

# Apollo.io (Contact Enrichment & Discovery)
APOLLO_API_KEY=your_apollo_api_key_here

# Google Sheets Integration
GOOGLE_SHEET_ID=your_google_sheet_id
BOOKING_SHEET_ID=your_booking_sheet_id
BOOKING_FORM_TAB=Réponses au formulaire 1
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=your_private_key_with_newlines_escaped
```

**Note**: Do NOT commit `.env.local` to version control. Use `.env.example` as a template.

## Getting Started

### Installation

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Development

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Security & Best Practices

✅ **API Keys**: All sensitive credentials stored in `.env.local` (never committed)
✅ **Environment Variables**: Server-side only; never exposed to frontend
✅ **Demo Mode**: Built-in demo email testing without sending to real addresses
✅ **Google Service Account**: Uses service account authentication for secure Sheet access

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Google Gemini API](https://ai.google.dev/)
- [Resend Documentation](https://resend.com/docs)
- [Apollo.io API](https://apolloio.github.io/apollo-api-docs/)
- [Google Sheets API](https://developers.google.com/sheets/api)

## Deploy on Vercel

The easiest way to deploy is on the [Vercel Platform](https://vercel.com):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

[Vercel Deployment Guide](https://nextjs.org/docs/app/building-your-application/deploying)

## License

This project is private and proprietary.

---

**Maintainer**: Louiszhang2005-1
**Created**: January 2026
