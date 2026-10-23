# ReturnRadar

### Never lose track of a return deadline again.

ReturnRadar is a privacy-conscious, AI-powered return deadline tracker designed to help you organize purchases, review receipt details, and keep track of return windows in one place.

Instead of guessing return deadlines, ReturnRadar prioritizes evidence from purchase information and return policies, flags uncertain details for review, and helps you make more informed decisions about your purchases.

---

## Features

- **Receipt Intelligence** — Extract purchase information from receipts and organize it into structured records.
- **Evidence-Based Return Tracking** — Track return deadlines when supported by available policy information.
- **Confidence & Review Indicators** — Identify ambiguous or missing information that needs your attention.
- **Editable Purchase Details** — Review and correct extracted information, with changes preserved.
- **Deadline Dashboard** — View tracked purchases and upcoming return deadlines in an organized interface.
- **Purchase Management** — Add, edit, and delete purchase records.
- **Persistent Notifications** — Review return reminders, items requiring attention, and purchase activity.
- **Calendar Export Safeguards** — Prevent calendar export when a return deadline is unsupported or requires review.
- **Privacy-Conscious Design** — Keep purchase data in browser storage rather than requiring a user account.
- **Responsive Interface** — A clean dashboard designed to make purchase tracking easier to manage.

## Why ReturnRadar?

Receipts are easy to lose, return policies can be confusing, and return windows can pass before you realize it.

ReturnRadar aims to reduce that friction by bringing purchase information, return deadlines, and review reminders together. Its central principle is simple: **uncertainty should be visible, not disguised as a confirmed deadline.**

## Tech Stack

The project uses the following technologies:

- **Framework:** Next.js with App Router
- **Language:** TypeScript
- **UI:** React and CSS
- **Data Persistence:** Browser local storage
- **Interface Components:** Base UI / shadcn-style components

*Receipt-processing and AI integrations depend on the project's configured implementation.*

## Getting Started

### Prerequisites

- Node.js compatible with the installed Next.js version
- npm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/shrutikotgire0129/ReturnRadar.git
cd ReturnRadar
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

To create a production build:

```bash
npm run build
```

To run the production version locally after building:

```bash
npm run start
```

## Privacy & Data Handling

ReturnRadar is designed around a privacy-conscious, single-user experience.

- Purchase records are stored locally in the browser.
- No account or authentication workflow is required for the current experience.
- Extracted information can be reviewed and corrected.
- Uncertain return deadlines are flagged rather than automatically treated as confirmed.
- Calendar export is restricted when the deadline lacks sufficient support.

**Important:** Browser-local data is tied to the browser and device. Clearing site data or changing browsers can make saved purchases unavailable. Browser storage should not be treated as an encrypted backup.

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
├── package.json
└── README.md
```

*The exact contents may vary as development continues.*

## Current Status

ReturnRadar is an actively developed project. Core purchase management, correction persistence, deadline handling, review states, and notification behavior have been tested during development.

Further improvements may include expanded policy verification, additional export options, and broader testing across browsers and devices.

## Contributing

Suggestions, bug reports, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the application and production build.
5. Open a pull request describing your changes.

## Author

**Shruti Kotgire**

---

*Built to make return tracking more organized, transparent, and reliable.*
