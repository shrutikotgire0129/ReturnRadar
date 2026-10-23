# ReturnRadar

### Never lose track of a return deadline again.

An AI-powered, privacy-conscious return tracker that helps you organize purchases, review receipt information, and stay ahead of return deadlines.

<p align="center">
  <a href="https://return-radar-ruby.vercel.app/"><strong>Live Demo — Vercel</strong></a>
  &nbsp; | &nbsp;
  <a href="https://returnradar-0ftg.onrender.com/"><strong>Alternative Demo — Render</strong></a>
  &nbsp; | &nbsp;
  <a href="https://github.com/shrutikotgire0129/ReturnRadar"><strong>GitHub Repository</strong></a>
</p>

---

## Overview

Receipts get misplaced, return policies can be confusing, and deadlines are easy to forget. ReturnRadar brings purchase information, return tracking, and review reminders together in one dashboard.

Its core principle is simple: **uncertainty should be visible, not disguised as a confirmed deadline.** When information is missing or ambiguous, ReturnRadar flags it for review rather than treating an unsupported return date as fact.

## Screenshots

### 1. ReturnRadar Overview

View your purchases, upcoming return deadlines, and items that need attention from one dashboard.

![ReturnRadar Overview](public/screenshots/ReturnRadar%20Overview.png)

### 2. Add a Receipt

Add a receipt and review the extracted purchase information.

![Add a Receipt](public/screenshots/Add%20a%20Receipt.png)

### 3. Purchase Details

Review purchase information and manage the details of a tracked item.

![Purchase Details](public/screenshots/Purchase%20Details.png)

---

## Features

- **Receipt Information Extraction** — Organize receipt details into structured purchase records.
- **Return Deadline Tracking** — Track supported return dates and organize upcoming deadlines.
- **Evidence-Based Handling** — Flag ambiguous or missing policy information instead of inventing confirmed deadlines.
- **Review and Correction** — Inspect extracted information, correct fields, and preserve edits.
- **Purchase Management** — Edit and delete saved purchase records.
- **Dashboard and Timeline** — Review purchases and sort upcoming return deadlines.
- **Persistent Notifications** — Track return reminders, review items, and purchase activity across page refreshes.
- **Calendar Export Safeguards** — Restrict export when a return deadline is unsupported or requires review.
- **Privacy-Conscious Design** — Use the current single-user experience without account registration.
- **Clean Interface** — Manage purchase information through a focused dashboard.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | Application framework and App Router |
| React | User interface |
| TypeScript | Type-safe application development |
| CSS | Styling and layout |
| Base UI / shadcn-style components | Interface components |
| Browser local storage | Local purchase and notification persistence |
| Vercel and Render | Deployment |

## Getting Started

### Prerequisites

- Node.js compatible with the installed Next.js version
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/shrutikotgire0129/ReturnRadar.git
cd ReturnRadar
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Create a production build

```bash
npm run build
```

To run the production build locally:

```bash
npm run start
```

## Privacy and Data Handling

ReturnRadar is designed around a privacy-conscious, single-user experience.

- Purchase records and notification state are persisted in browser local storage in the current implementation.
- Authentication is not required.
- Users can review and correct extracted purchase information.
- Uncertain return deadlines can be flagged for review.
- Calendar export is restricted when a deadline lacks sufficient support.

**Important:** Browser-local data is associated with the browser and device. Clearing site data or switching browsers may make saved purchases unavailable. Browser local storage is not an encrypted backup.

## Project Structure

```text
return_radar/
├── app/
│   ├── api/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── icon.png
├── components/
├── lib/
├── public/
│   └── screenshots/
│       ├── Add a Receipt.png
│       ├── Purchase Details.png
│       └── ReturnRadar Overview.png
├── package.json
└── README.md
```

## Testing and Validation

The production build has completed successfully. Development testing has covered:

- Purchase editing and persistence after refresh
- Missing or ambiguous return information
- Deadline ordering and dashboard consistency
- Receipt edge cases, including blurry or incomplete information
- Purchase deletion and confirmation behavior
- Notification persistence and clearing behavior
- Restrictions on unsupported calendar exports

## Future Improvements

Potential areas for further development include expanded receipt-format testing, stronger return-policy verification, additional export options, and broader automated test coverage.

## Author

**Shruti Kotgire**

- GitHub: [@shrutikotgire0129](https://github.com/shrutikotgire0129)

---

*Built to make return tracking more organized, transparent, and reliable.*