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

**Expenses and profit**
- **Add an expense** with who you paid, what for, a category (materials, fuel, tools, rent, phone, software,
  bank fees, marketing or other), the amount and a **receipt photo** taken or chosen on the phone. The photo
  is made small on the device first (at most 1400 pixels, under about 500 KB), so it saves quickly on mobile data.
- For a VAT-registered business, tick that the receipt is a **tax invoice**, and the 15% VAT inside it is
  worked out (R115 includes R15) so it can be claimed back.
- **The money card** for this month, last month, the **2-month VAT period** or the **tax year** (March to
  February): what you invoiced, what you spent, your **profit**, the money received from clients, and
  **VAT owed to SARS** (VAT on your invoices minus the VAT you can claim), or how much SARS owes you.
  Bars show where the money went. It's labelled as a guide, not tax advice.
- **Download CSV** of the period's expenses for an accountant, and a **This month** line on the Overview.

**Stock**
- **Your stock list**: the things you sell from the shelf (paint, taps, cables), with a price, an optional
  product code, how many you have, and when to warn you.
- **Taken off when you invoice**: on a quote or invoice line, pick **From your stock** to fill in the name and
  price. Invoices take their quantity off what's left; quotes don't, until they become an invoice. The line
  shows how many will be left, and warns you if you don't have enough.
- **Low-stock warnings**: items that are running low or out are listed first on the Stock page, and the
  Overview shows a warning that links there.
- **Add stock** for a delivery, **Count** after you've counted the shelf, Edit and Delete. Deleting a stock item
  keeps the invoice lines that used it.

**Seeing where you stand**
- **Overview**: collected, still owed, overdue and open quotes, money received per month for the last
  6 months, the overdue invoices with Remind buttons, the latest documents, and a warning when stock runs low.
- **Documents**: every quote and invoice as a slip, with filters, search and **Download CSV** for Excel.
- **Customers**: everyone you've quoted or invoiced, what they've been billed, paid and still owe, with
  WhatsApp and email links and New quote / New invoice buttons that fill in their details.

**Everywhere**
- **Sign in** with email and password or Google, with **Forgot your password?**. If the browser blocks Google's pop-up window, the whole page goes to Google instead. Sign-in errors say what went wrong in plain words, with Firebase's error code underneath.
- **Fast first load:** a new visitor gets the sign-in screen straight from the server, without waiting for Firebase to load. Someone who has signed in on the device before sees the loading screen instead while Firebase checks (a small hint saved on the device decides which). Google's sign-in helper only loads when someone presses **Continue with Google**, not on every visit.
- **Cloud sync**: documents are saved to your account, so they're on your phone and laptop. It also works
  offline and syncs when you're back online. The header shows if everything is saved.
- **English or Afrikaans** for the app (the EN/AF button), and a separate setting for the language
  printed on documents.
- **Light and dark mode**, remembered per device, with no flash when the page opens.
- **Back, Forward and Refresh** buttons, and a **phone navigation bar** with a big + for new documents.
- **Keyboard shortcuts**: N new invoice, Q new quote, / search, T theme, L language, G then O/D/C/E/K/S to
  change page (K for stock), and ? for the list.
- **Backup and restore** as one file.
- **Try the demo**, with no account: you're signed in as a guest with a made-up plumbing business already set up:
  quotes (one accepted), an invoice with a part payment, a paid one, an overdue one, expenses and stock (one item running
  low), all dated from today. A strip at the top says it's a demo, in English or Afrikaans, and **End the demo** deletes
  everything and the guest account. A link ending in `?demo` puts the demo button at the top of the sign-in screen.

## Design
The look is a bookkeeper's desk with stationery on it: **cream desk paper and navy ink**, headings in a serif like a
printed letterhead, **yellow quote slips** and **pink invoice slips** with a perforated top edge, a red pre-printed
number in a typewriter font, and rubber stamps for the status. Dark mode is the same desk at night, in dark walnut.
The quote or invoice itself is always white paper with one navy line, because that's what the client gets.

**The sign-in page is a tax invoice on the desk** (`components/LoginScreen.tsx`): what you get is listed as the
invoice's lines, all R 0,00, with a green FREE stamp, and the sign-in form is filled in like a printed form, on lines.
**Try the demo** is a yellow quote slip numbered "DEMO".

**On a laptop the pages are in a sidebar**, like accounting software: the pages with icons, New quote and New invoice
at the top, and the saving status, language, theme and your account at the bottom (`components/Header.tsx`). On a
phone there's a slim bar at the top and the navigation bar at the bottom, with a big + for new documents.

The first screen after signing up shows three real PaperTrail documents with made-up details, overlapping like
pages on a desk (`components/SampleDocuments.tsx`). Each shows something the app does: a quote the client
accepted, the tax invoice made from it with a part payment, and an invoice in Afrikaans that's been paid.
They use the same `DocumentSheet` as the app, so new users see exactly what they're about to make. Phones skip
them so the buttons stay near the top.

Fonts: [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans) for everything, [Fraunces](https://fonts.google.com/specimen/Fraunces)
for the big headings, and [Courier Prime](https://fonts.google.com/specimen/Courier+Prime) only for the slip numbers.

## Tech stack
Next.js (App Router), React, TypeScript, Tailwind CSS v4, Firebase Authentication and Cloud Firestore,
Vitest, deployed on Vercel.

## Project structure
```
app/              Pages: Overview (/), Documents, one document (/documents/[id]), Customers, Expenses and profit (/expenses), Stock (/stock), Business details (/settings)
components/       The slips, stamps, editor, printable document, payments, sign-in screen, header, phone bar, shortcuts
lib/              The logic: money, VAT and totals, dates, documents and payments, customers, expenses and profit, stock, receipt photos, messages, CSV,
                  checking data, saving only what changed, Firebase, sign-in, and every label in English and Afrikaans
tests/            Vitest tests (npm test)
firestore.rules   The database rules: each person can only read and write their own data
```

## How the important parts work

**Try the demo** (`lib/demo.ts`, `lib/demo-data.ts`). The guest is signed in with Firebase's anonymous sign-in, so
they get their own private account and the same security rules protect them as anyone else. The first time a guest has
no documents, the made-up business is added through the normal save (once: a note on the device remembers). Its dates
are worked out from today, so the demo always has something due, overdue and paid. Ending the demo deletes the guest's
documents, expenses, stock, receipt photos and profile, then the guest account itself.

- **Money is stored in cents** (whole numbers), so adding up never gives answers like `R 0,30000000004`.
  `lib/totals.ts` adds the lines, takes off the discount, then adds VAT on what's left, rounding once per step.
- **An invoice's state comes from its payments** (`lib/documents.ts`): nothing paid is Unpaid, some is
  Part paid, all of it is Paid. "Overdue" means money is still owed after the due date.
- **Rand and dates are formatted by hand** (`lib/money.ts`, `lib/dates.ts`), because browsers disagree about
  South African formatting, and an invoice must look the same on every device: `R 1 250,50`, `1 Sep 2026`.
- **Each person's data lives under their own user ID** in Firestore (`lib/cloud.ts`): one record for the
  business details and numbering, one per quote or invoice, one per expense, and one per receipt photo.
- **Profit and VAT** (`lib/expenses.ts`): sales are the invoices sent in the period (quotes don't count);
  the VAT you can claim on an expense is amount × 15/115, only if the receipt is a tax invoice and the
  business is VAT-registered (it has a VAT number); VAT owed = VAT on invoices − VAT on expenses; profit =
  sales without VAT − expenses without the VAT you can claim. The VAT period follows the 2-month periods most
  small VAT vendors file (Jan–Feb … Nov–Dec), and the tax year runs from 1 March.
- **Receipt photos are kept apart** from the expense list (`users/{id}/receipts/{expense id}`), and only
  loaded when you press Receipt, so a long list of expenses stays quick. Firebase file storage needs a paid
  plan, so each photo is shrunk on the phone (`lib/receipt-image.ts`) and saved as text in its own database
  record, well under Firestore's 1 MB limit. Deleting an expense deletes its photo too.
- **Stock left is worked out, not stored** (`lib/stock.ts`): each item keeps the number you counted and when.
  What's left = that number − the quantities on invoices made since then. So stock can never be taken off twice:
  editing or deleting an invoice, or two devices saving at the same time, just changes the sum. Add stock adds to
  the count; Count starts a new count from now. Stock items are saved one each, in `users/{id}/stock/{id}`.
- **Only what changed is saved** (`lib/diff.ts` compares the old and new copies), and the screen updates
  straight away. Firestore keeps a copy on the device, so saving works offline and syncs later.
- **Data is checked when it's read** (`lib/storage.ts`): broken, old or hand-edited data (from a backup
  file, or from PaperTrail 1) never crashes the app, and a lost counter is rebuilt from the highest number used.
- **The real security is in `firestore.rules`**: a signed-in person can read and write only
  `users/{their own user ID}`. Even a changed copy of the app can't reach anyone else's documents. Expenses
  must have a real date, a known category and a whole-number amount, and a receipt must be one JPEG under 750 KB. A stock item must have a name, a whole-number price and
  counts that aren't below 0.
- **Every label is in `lib/i18n.ts`**, in English and Afrikaans. TypeScript checks that Afrikaans has every
  key, and `tests/i18n.test.ts` checks every label the code uses exists, with the same `{placeholders}`.
- **Security headers** (`next.config.ts`): no framing by other sites, no type guessing, https only, and
  camera, microphone and location switched off.

## Setup (run it yourself)
You need Node.js 22 or newer and a free Google account.

### 1. Firebase (about 10 minutes)
1. Go to [console.firebase.google.com](https://console.firebase.google.com) and **Create a project**
   (Google Analytics isn't needed).
2. **Authentication → Get started → Sign-in method**: turn on **Email/Password**, **Google** and **Anonymous** (for Try the demo).
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
- **Demos that are never ended stay in the database.** If a guest just closes the tab, their made-up business and
  guest account stay in Firebase. It's small, and the free plan has plenty of room, but nothing cleans it up automatically yet.
- **Two devices offline at the same time** could each give out the same next number. It's very unlikely
  (both offline, both creating a document) and noticeable, so it's left as a known limit.
- **PDFs come from the browser's "Save as PDF"**, so the exact look can differ slightly between browsers.
- **Messages open your WhatsApp or email app**, with the PDF attached by hand. PaperTrail doesn't send
  anything itself.
- **No email verification** at sign-up: anyone can create an account, but each account only ever sees its own data.
- **The database rules are tested by hand** in the Firebase console, not in the automatic tests.
- English, Afrikaans and rand only.
- **Receipt photos aren't in the backup file**, only the expenses themselves, so a backup stays small enough
  to email. The photos stay safe in your account.
- **VAT is worked out on the invoice basis** (by the date an invoice was sent). Small businesses on SARS's
  payments basis count VAT when they're paid instead; the money card shows the money received too, but the
  VAT figures follow the invoice dates.
- **Expenses are typed in by hand**: PaperTrail doesn't read the amount from the receipt photo.
- **Stock is simple on purpose**: one price per item (no buying price or profit per item), no variants like sizes
  or colours, and no barcode scanning. A stock purchase is added as an expense separately.
- **An invoice made before a recount** no longer counts against that item, because the count already includes it.
  Count after you've invoiced the day's sales, not in the middle.

## Use of AI
I built PaperTrail with Claude (by Anthropic) as my AI pair programmer:

1. **I decided what to build**: the idea, who it's for, the features and how it should look and behave.
2. **Claude wrote the code** for it and explained how it works.
3. **I set up Firebase and Vercel, added each change to my project**, ran it, tested it on my laptop and
   phone, committed it and deployed it, and reported anything that broke or looked wrong so we could fix it.
