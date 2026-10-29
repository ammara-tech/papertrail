# PaperTrail

**Quotes and invoices for South African small businesses.**

**Live site:** https://papertrail-ten-sable.vercel.app

PaperTrail lets a plumber, electrician, freelancer or any small business make a professional quote or invoice
in a couple of minutes. Add the work: it works out the 15% VAT, numbers the document, tracks deposits and part
payments, writes the WhatsApp or email reminder, and gives you a clean PDF to send. In English or Afrikaans,
with your documents on every device you sign in on.

## What it does
**Quotes and invoices**
- Your business details, logo, VAT number and banking details on every document.
- Line items with quantities (like 1.5 hours) and prices typed any way: `1250`, `1250,50` or `R 1 250.50`.
- 15% VAT, switchable off for businesses that aren't VAT-registered. A VAT-registered business charging VAT
  gets the title **Tax invoice**, as SARS requires. Discounts are taken off before VAT.
- Automatic numbering (`QUO-0001`, `INV-0001`) that never repeats.
- **Accepted quote → invoice** in one click, and **Duplicate** for monthly invoices.
- **Download PDF**: only the white A4 document is printed, named after the invoice number and client.
- Typing a client you've used before fills in their details.

**Getting paid**
- **Part payments**: record deposits and part payments (EFT, cash, card), and the invoice shows Paid and
  **Balance due**. Stamps show Part paid, Paid, Overdue, Accepted or Declined.
- **Send or remind by WhatsApp or email**: opens your own WhatsApp or email app with the message written,
  including the amount still owed, the due date and your banking details. Nothing is sent until you press Send.

**Seeing where you stand**
- **Overview**: collected, still owed, overdue and open quotes, money received per month for the last
  6 months, the overdue invoices with Remind buttons, and the latest documents.
- **Documents**: every quote and invoice as a slip, with filters, search and **Download CSV** for Excel.
- **Customers**: everyone you've quoted or invoiced, what they've been billed, paid and still owe, with
  WhatsApp and email links and New quote / New invoice buttons that fill in their details.

**Everywhere**
- **Sign in** with email and password or Google, with **Forgot your password?**.
- **Cloud sync**: documents are saved to your account, so they're on your phone and laptop. It also works
  offline and syncs when you're back online. The header shows if everything is saved.
- **English or Afrikaans** for the app (the EN/AF button), and a separate setting for the language
  printed on documents.
- **Light and dark mode**, remembered per device, with no flash when the page opens.
- **Back, Forward and Refresh** buttons, and a **phone navigation bar** with a big + for new documents.
- **Keyboard shortcuts**: N new invoice, Q new quote, / search, T theme, L language, G then O/D/C/S to
  change page, and ? for the list.
- **Backup and restore** as one file.

## Design
The look comes from the carbon-copy duplicate books used at shop counters: a pale carbon-paper blue page,
**yellow quote slips** and **pink invoice slips** with a perforated top edge, a red pre-printed number in a
typewriter font, and rubber stamps for the status. Dark mode is the same book under a desk lamp at night.
The quote or invoice itself is always white paper with one carbon-blue line, because that's what the client gets.

Fonts: [Familjen Grotesk](https://fonts.google.com/specimen/Familjen+Grotesk) for everything, and
[Courier Prime](https://fonts.google.com/specimen/Courier+Prime) only for the slip numbers.

## Tech stack
Next.js (App Router), React, TypeScript, Tailwind CSS v4, Firebase Authentication and Cloud Firestore,
Vitest, deployed on Vercel.

## Project structure
```
app/              Pages: Overview (/), Documents, one document (/documents/[id]), Customers, Business details (/settings)
components/       The slips, stamps, editor, printable document, payments, sign-in screen, header, phone bar, shortcuts
lib/              The logic: money, VAT and totals, dates, documents and payments, customers, messages, CSV,
                  checking data, saving only what changed, Firebase, sign-in, and every label in English and Afrikaans
tests/            Vitest tests (npm test)
firestore.rules   The database rules: each person can only read and write their own data
```

## How the important parts work
- **Money is stored in cents** (whole numbers), so adding up never gives answers like `R 0,30000000004`.
  `lib/totals.ts` adds the lines, takes off the discount, then adds VAT on what's left, rounding once per step.
- **An invoice's state comes from its payments** (`lib/documents.ts`): nothing paid is Unpaid, some is
  Part paid, all of it is Paid. "Overdue" means money is still owed after the due date.
- **Rand and dates are formatted by hand** (`lib/money.ts`, `lib/dates.ts`), because browsers disagree about
  South African formatting, and an invoice must look the same on every device: `R 1 250,50`, `1 Sep 2026`.
- **Each person's data lives under their own user ID** in Firestore (`lib/cloud.ts`): one record for the
  business details and numbering, and one per quote or invoice.
- **Only what changed is saved** (`lib/diff.ts` compares the old and new copies), and the screen updates
  straight away. Firestore keeps a copy on the device, so saving works offline and syncs later.
- **Data is checked when it's read** (`lib/storage.ts`): broken, old or hand-edited data (from a backup
  file, or from PaperTrail 1) never crashes the app, and a lost counter is rebuilt from the highest number used.
- **The real security is in `firestore.rules`**: a signed-in person can read and write only
  `users/{their own user ID}`. Even a changed copy of the app can't reach anyone else's documents.
- **Every label is in `lib/i18n.ts`**, in English and Afrikaans. TypeScript checks that Afrikaans has every
  key, and `tests/i18n.test.ts` checks every label the code uses exists, with the same `{placeholders}`.
- **Security headers** (`next.config.ts`): no framing by other sites, no type guessing, https only, and
  camera, microphone and location switched off.

## Setup (run it yourself)
You need Node.js 22 or newer and a free Google account.

### 1. Firebase (about 10 minutes)
1. Go to [console.firebase.google.com](https://console.firebase.google.com) and **Create a project**
   (Google Analytics isn't needed).
2. **Authentication → Get started → Sign-in method**: turn on **Email/Password** and **Google**.
3. **Firestore Database → Create database**: choose the location closest to your users
   (for South Africa, `africa-south1` (Johannesburg)), and start in **production mode**.
4. **Firestore Database → Rules**: replace everything with the contents of [`firestore.rules`](firestore.rules),
   then **Publish**.
5. **Project settings (the cog) → General → Your apps → Web (`</>`)**: register an app called PaperTrail
   (no hosting needed). Copy the four values from the config it shows: `apiKey`, `authDomain`, `projectId`, `appId`.

### 2. Run locally
```bash
cp .env.example .env.local    # then paste the four values into .env.local
npm install
npm run dev
```
Open http://localhost:3000, create an account and try it. Run the tests with `npm test`, and check the
production build with `npm run build`.

### 3. Deploy to Vercel
1. Import the GitHub repo into Vercel.
2. Add the four environment variables (same names as in `.env.example`) under
   Settings → Environment Variables.
3. Deploy. If you add or change a variable later, **redeploy** (Deployments → ⋯ → Redeploy): Next.js
   builds these settings into the site, so the old build won't see them. Then in Firebase, **Authentication → Settings → Authorized domains → Add domain** and add your
   `….vercel.app` address, so Google sign-in works there too.

## Environment variables
| Name | What it is |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase web app's API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | e.g. `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | e.g. `your-project` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Your Firebase web app's ID |

These are Firebase's public web settings: they identify the project in the browser, they don't unlock
anything. What protects the data is `firestore.rules`. They're still kept out of the repo, in `.env.local`
and in Vercel. No secret or server-only keys are needed.

## Known gaps
- **Two devices offline at the same time** could each give out the same next number. It's very unlikely
  (both offline, both creating a document) and noticeable, so it's left as a known limit.
- **PDFs come from the browser's "Save as PDF"**, so the exact look can differ slightly between browsers.
- **Messages open your WhatsApp or email app**, with the PDF attached by hand. PaperTrail doesn't send
  anything itself.
- **No email verification** at sign-up: anyone can create an account, but each account only ever sees its own data.
- **The database rules are tested by hand** in the Firebase console, not in the automatic tests.
- English, Afrikaans and rand only.

## Use of AI
I built PaperTrail with Claude (by Anthropic) as my AI pair programmer:

1. **I decided what to build**: the idea, who it's for, the features and how it should look and behave.
2. **Claude wrote the code** for it and explained how it works.
3. **I set up Firebase and Vercel, added each change to my project**, ran it, tested it on my laptop and
   phone, committed it and deployed it, and reported anything that broke or looked wrong so we could fix it.
