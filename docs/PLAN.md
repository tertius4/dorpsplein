# Dorpsplein — Plan

## 1. Visie

**Dorpsplein** bring enige twee mense in Orania bymekaar wat met mekaar handel wil dryf: 'n aanstelling, 'n diens, 'n produk, enigiets.

Ons begin met **werk** (werkgewer ↔ werknemer), maar die datamodel en kode word van die begin af **algemeen** ontwerp. 'n Nuwe soort handel (dienste, produkte, verhuring …) moet later bygevoeg kan word sonder om die bestaande struktuur te herbou.

Dorpsplein moet ook **vanlyn werk**. As dit as 'n app op die foon geïnstalleer is, moet mense steeds kan sien wat hulle laas gesien het, en aksies kan uitvoer wat outomaties gestuur word sodra daar weer sein is. Sien **afdeling 9**.

### Die kernpatroon (geld vir álle soorte)

1. Mense stel hul **belangstellings** in: kategorieë waaroor hulle kennisgewings wil kry.
2. Iemand skep 'n **plasing** (`Listing`) van 'n sekere **soort** (`kind`).
3. Almal wie se belangstellings pas, kry 'n **kennisgewing**.
4. Hulle **reageer** (`Response`): "Ek stel belang / is beskikbaar".
5. Die plaser **aanvaar** een of meer reaksies. Kontakbesonderhede word gedeel en die plasing sluit wanneer dit vol is.

### Eerste soort: `JOB`

Dek: permanente poste, deeltyds, los takies ("middagwerkie") en seisoenwerk.
_Dienste en vakmanne word later 'n eie soort (`SERVICE`)._

---

## 2. Argitektuur-beginsels

- **Een SvelteKit-projek** bevat die frontend én die backend, sonder 'n aparte API of BaaS.
- **Die bediener doen die werk**: SSR en SvelteKit **remote functions** (`query`, `form`, `command` in `*.remote.ts`).
- **Geen besigheidslogika in die frontend nie.** Komponente roep net remote functions en vertoon die resultaat. Alle validasie, magtiging, passing en kennisgewings gebeur in `src/lib/server/**`. SvelteKit 3 verbied dat kliëntkode enige `/server/`-gids invoer, en dit dwing die reël af.
  - Die enigste blaaierkode buite vertoning is **infrastruktuur**: die service worker (kas en push), `PushManager.subscribe()` en die vanlyn-laag (kas en uitkassie). Dit stoor en stuur data, maar **besluit nooit** iets nie.
- **Vanlyn: die kliënt kas en staan in die tou; die bediener besluit.** Die kliënt mag data kas en aksies in 'n uitkassie (outbox) bêre. Elke aksie word eers deur die bediener gevalideer wanneer dit gesinchroniseer word, en die bediener kan dit verwerp (bv. "plasing is reeds gesluit"). Vanlyn-vertoning is altyd gemerk as "laas bygewerk om …".
- **Alle mutasies is idempotent.** Elke `form`/`command` aanvaar 'n `requestId` (UUID, deur die kliënt gegenereer). Die bediener verwerk dieselfde `requestId` nooit twee keer nie, sodat 'n herhaalde sinchronisering veilig is.
- **Lae:** `komponent → *.remote.ts (Zod + guard) → services → DB → Prisma → Neon`.
- **Soort-modules:** alles wat van 'n soort afhang (detailvelde, validasie, passing, vertoonteks) leef in een lêer per soort (`services/kinds/job.ts`). Die res van die kode is soort-agnosties.
- **Kode in Engels; UI-teks en URL's in Afrikaans.**

---

## 3. Tegnologie

| Laag          | Keuse                                                                             | Notas                                                                                                          |
| ------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Raamwerk      | **SvelteKit 3** + Svelte 5, TypeScript                                            | Remote functions en `async` is nog eksperimenteel en word in `vite.config.ts` aangeskakel                      |
| Validasie     | **Zod 4**                                                                         | Standard Schema, dus werk dit direk met remote functions en `src/env.ts`                                       |
| Huisvesting   | **Cloudflare Workers** + statiese lêers                                           | `@sveltejs/adapter-cloudflare`, `nodejs_compat`. Worker `dorpsplein` (master → Neon `main`) en `dorpsplein-preview` (ander takke → Neon `dev`) |
| Databasis     | **Neon Postgres**                                                                 | Gratis; skaal na nul en word self wakker. Takke `main` (produksie) en `dev`                                    |
| ORM           | **Prisma 7.10** (vasgepen)                                                        | Generator `prisma-client`, runtime `workerd`, `@prisma/adapter-neon`. (`prisma@latest` is tans 'n 8.0-RC)      |
| DB-koppelvlak | Eie **`DB`-objek** bo-op Prisma                                                   | `DB.listing.findMany()`, `DB.user.create()` … volledig getik                                                   |
| Aanmelding    | **Better Auth**                                                                   | Prisma-adapter; Google + e-pos/wagwoord; verifikasie, herstel en koersbeperking                                |
| E-pos         | **Resend**                                                                        | Gratis 3 000/maand; verifikasie- en herstel-e-posse                                                            |
| Push          | **Web-push (VAPID)**                                                              | Met 'n Workers-versoenbare biblioteek (die gewone `web-push` werk nie op Workers nie); gestuur via `waitUntil` |
| Foto's        | **Cloudflare R2**                                                                 | Gratis 10 GB; opgelaai deur 'n remote `form`                                                                   |
| Vanlyn        | **Service worker** (SvelteKit se `src/service-worker.ts`) + **IndexedDB** (`idb`) | App-dop en besoekte bladsye in die kas; remote-query-antwoorde in die kas; uitkassie vir mutasies              |
| App           | **PWA** eerste (installeerbaar, vanlyn, push)                                     | Later, indien nodig, 'n **Capacitor**-omhulsel vir Play Store / App Store. Die vanlyn-ontwerp werk in albei    |
| Styl          | **Tailwind CSS 4**                                                                | Met die `forms`-plugin                                                                                         |
| Toetse        | **Vitest** (services), **Playwright** (e2e)                                       |                                                                                                                |

### SvelteKit 3 — wat anders is as weergawe 2

- Daar is **geen `svelte.config.js`** meer nie. Die konfigurasie gaan in `sveltekit({...})` in `vite.config.ts`.
- **`$lib` is vervang deur `#lib/...`** (Node se subpad-invoere in `package.json`), met die volle lêernaam: `import { DB } from '#lib/server/db/index.ts'`.
- **Omgewingsveranderlikes** word in `src/env.ts` met `defineEnvVars` + 'n Zod-skema gedefinieer en uit `$app/env/private` of `$app/env/public` ingevoer.
- **`handleError`** kry `{ kind, error, event }`, waar `kind` een van `app | framework | validation | unknown` is. Net `unknown` moet gelog en gemasker word.
- **Enige `/server/`-gids** (nie net `$lib/server`) is net vir die bediener beskikbaar.

### Bekende struikelblokke (en oplossings)

| Probleem                                                                                            | Oplossing                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma se `workerd`-kliënt laai sy enjin met `import('./x.wasm?module')`, wat Vite nie verstaan nie | 'n Klein Vite-plugin (`vite-plugins/prisma-wasm.ts`). In dev kompileer dit die WASM self; in die bou kopieer dit die WASM na die bediener-uitset en laat Wrangler dit bundel |
| Saadskrip in Node kan nie `.wasm?module` invoer nie                                                 | Voer skripte deur Vite uit (`scripts/run.mjs` met `runnerImport`)                                                                                                            |
| `prisma.config.ts` kan nie SvelteKit 3 se `$app/tsconfig` oplos nie                                 | Gebruik `prisma.config.mjs`, en voer `svelte-kit sync` uit voor `prisma generate`                                                                                            |
| npm 11 blokkeer installeer-skripte (`allowScripts`)                                                 | Keur net esbuild, prisma, @prisma/engines en workerd goed met `npm approve-scripts`. Doen dit weer ná opgraderings                                                           |
| 'n `pending`-snippet in `<svelte:boundary>` laat SSR die data oorslaan                              | Gebruik geen `pending` vir data wat die bediener moet render nie                                                                                                             |
| Een Prisma-kliënt mag nie oor Worker-versoeke heen hergebruik word nie                              | Een kliënt per versoek, lui geskep via `getRequestEvent()`                                                                                                                   |
| iOS/Safari ondersteun nie die _Background Sync_-API nie                                             | Die uitkassie word gestuur by `online`, wanneer die app oopmaak en wanneer dit na die voorgrond kom, en nie net via Background Sync nie                                      |
| Die blaaier kan IndexedDB en die kas uitvee as die foon se stoorplek min raak                       | `navigator.storage.persist()` versoek, veral ná installasie as PWA. Die app moet in elk geval met 'n leë kas kan begin                                                       |
| SSR-bladsye laai nie vanlyn nie                                                                     | Die service worker gebruik eers die netwerk en val dan terug op die kas vir besoekte bladsye, met 'n vanlyn-terugvalbladsy vir onbesoekte roetes                             |
| Privaat data bly in die kas op 'n gedeelde foon                                                     | By afmelding word die kas en IndexedDB uitgevee. Die kas is altyd per gebruiker                                                                                              |
| Remote functions se vervoerformaat is 'n interne detail van SvelteKit                               | Die vanlyn-laag word in Fase 5 teen die werklike vervoer geverifieer; die kas-strategie raak net `GET`-versoeke                                                              |

---

## 4. Datamodel (benadering A: algemene tabelle + detailtabelle per soort)

### Waarom detailtabelle?

- **Algemene tabelle** (`Listing`, `Response`, `Interest`) hou alles wat vir álle soorte geld.
- **Detailtabelle** (`JobDetails`, later `ServiceDetails` en `ProductDetails`) is 1-tot-1 met `Listing` en hou die soort-spesifieke velde.
- Voordele: volledige TypeScript-tipes, die databasis dwing reëls af, gewone `JOIN`s en indekse vir filters, en maklike verslae.
- Prys: 'n nuwe soort vereis 'n nuwe tabel en migrasie. Dit is aanvaarbaar, want nuwe soorte is skaars terwyl filter en vertoon daagliks gebeur.

### Enums

```prisma
enum ListingKind      { JOB }                                  // later: SERVICE, PRODUCT, RENTAL …
enum ListingStatus    { OPEN CLOSED COMPLETED CANCELLED }       // CLOSED = genoeg reaksies aanvaar
enum ResponseStatus   { INTERESTED WITHDRAWN ACCEPTED DECLINED }
enum JobType          { PERMANENT PART_TIME ODD_JOB SEASONAL }
enum NotificationType { NEW_LISTING NEW_RESPONSE RESPONSE_ACCEPTED RESPONSE_DECLINED LISTING_CANCELLED }
enum ReportStatus     { OPEN RESOLVED DISMISSED }
```

### Aanmelding (Better Auth — gegenereer met `npx @better-auth/cli generate`)

```prisma
model User {
  id            String   @id
  name          String
  email         String   @unique
  emailVerified Boolean  @default(false)
  image         String?                     // Google-profielfoto
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  sessions        Session[]
  accounts        Account[]
  profile         Profile?
  workerProfile   WorkerProfile?
  interests       Interest[]
  jobTypePrefs    JobTypePreference[]
  qualifications  Qualification[]
  listings        Listing[]
  responses       Response[]
  pushSubs        PushSubscription[]
  notifications   Notification[]
  reportsMade     Report[] @relation("Reporter")
  reportsAbout    Report[] @relation("ReportedUser")
}
// Session, Account, Verification: Better Auth se standaardvelde
```

### Profiel (algemeen)

```prisma
model Profile {
  userId          String    @id
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  headline        String?   @db.VarChar(80)  // "Ervare messelaar en teëlwerker"
  bio             String?
  photoKey        String?                    // R2-sleutel; val terug op User.image
  phone           String?                    // net gedeel ná ACCEPTED (bediener beheer)
  available       Boolean   @default(true)   // af = geen NEW_LISTING-kennisgewings
  isAdmin         Boolean   @default(false)
  blocked         Boolean   @default(false)
  popiaConsentAt  DateTime?                  // null = /begin nog nie voltooi
  updatedAt       DateTime  @updatedAt
}

model Qualification {                        // algemeen: ook vir dienste nuttig
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String                           // "Elektrisiën – Trade Test"
  issuer    String?
  year      Int?
  createdAt DateTime @default(now())
  @@index([userId])
}
```

### Belangstellings (algemene passing)

```prisma
model Category {
  id        Int         @id @default(autoincrement())
  kind      ListingKind                      // kategorieë hoort by 'n soort
  name      String
  icon      String?
  sortOrder Int         @default(0)
  active    Boolean     @default(true)
  listings  Listing[]
  interests Interest[]
  @@unique([kind, name])
}

model Interest {                             // "stuur my kennisgewings oor hierdie kategorie"
  userId          String
  categoryId      Int
  yearsExperience Int?                       // ervaring in hierdie kategorie (opsioneel)
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category        Category @relation(fields: [categoryId], references: [id])
  createdAt       DateTime @default(now())
  @@id([userId, categoryId])
  @@index([categoryId])
}
```

### Soort-spesifiek: werk

```prisma
model WorkerProfile {                        // 1-tot-1 met User; net vir werksoekers
  userId         String  @id
  user           User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  driversLicence Boolean @default(false)
  ownTransport   Boolean @default(false)
}

model JobTypePreference {                    // watter tipes werk wil ek hê?
  userId  String
  jobType JobType
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([userId, jobType])
  @@index([jobType])
}

model JobDetails {                           // 1-tot-1 met Listing (kind = JOB)
  listingId              String  @id
  listing                Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  jobType                JobType
  requiresDriversLicence Boolean @default(false)
  @@index([jobType])
}
```

### Plasings en reaksies (algemeen)

```prisma
model Listing {
  id          String        @id @default(cuid())
  kind        ListingKind
  ownerId     String
  owner       User          @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  categoryId  Int
  category    Category      @relation(fields: [categoryId], references: [id])
  title       String        @db.VarChar(100)
  description String?
  price       String?                        // vrye teks: "R300 per dag", "R50 elk"
  capacity    Int           @default(1)      // hoeveel reaksies aanvaar kan word (bv. 3 werkers)
  location    String?
  startsAt    DateTime?
  endsAt      DateTime?
  closesAt    DateTime?                      // sperdatum vir reaksies
  status      ListingStatus @default(OPEN)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  job           JobDetails?                  // later: service ServiceDetails?, product ProductDetails?
  responses     Response[]
  notifications Notification[]
  reports       Report[]

  @@index([status, kind, categoryId])
  @@index([ownerId, status])
}

model Response {
  id          String         @id @default(cuid())
  listingId   String
  responderId String
  listing     Listing        @relation(fields: [listingId], references: [id], onDelete: Cascade)
  responder   User           @relation(fields: [responderId], references: [id], onDelete: Cascade)
  status      ResponseStatus @default(INTERESTED)
  note        String?                        // "Kan eers 09:00 begin"
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  @@unique([listingId, responderId])
  @@index([responderId, status])
}
```

### Kennisgewings en moderering

```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint  String   @unique
  p256dh    String
  auth      String
  device    String?
  createdAt DateTime @default(now())
}

model Notification {
  id          String           @id @default(cuid())
  recipientId String
  recipient   User             @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  type        NotificationType
  listingId   String?
  listing     Listing?         @relation(fields: [listingId], references: [id], onDelete: Cascade)
  title       String
  body        String?
  url         String
  readAt      DateTime?
  createdAt   DateTime         @default(now())
  @@index([recipientId, readAt])
}

model Report {
  id             String       @id @default(cuid())
  reporterId     String
  reporter       User         @relation("Reporter", fields: [reporterId], references: [id])
  reportedUserId String?
  reportedUser   User?        @relation("ReportedUser", fields: [reportedUserId], references: [id])
  listingId      String?
  listing        Listing?     @relation(fields: [listingId], references: [id])
  reason         String
  status         ReportStatus @default(OPEN)
  handledById    String?
  createdAt      DateTime     @default(now())
}
```

### Vanlyn-sinchronisering (idempotensie)

```prisma
model ProcessedRequest {                     // "hierdie aksie is reeds verwerk"
  requestId String   @id                     // UUID van die kliënt (uitkassie-item)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  action    String                           // bv. "responses.respond"
  result    Json?                            // die oorspronklike antwoord, vir herhalings
  createdAt DateTime @default(now())
  @@index([userId, createdAt])               // ou rye word ná 30 dae opgeruim
}
```

(`User` kry `processedRequests ProcessedRequest[]`.)

### Verhoudings

```
User 1─1 Profile · 1─0..1 WorkerProfile · 1─* Qualification
User *─* Category            via Interest (+ jare ervaring)
User 1─* JobTypePreference
User (plaser) 1─* Listing *─1 Category
Listing 1─0..1 JobDetails     (later ServiceDetails, ProductDetails)
Listing 1─* Response *─1 User (reageerder)
User 1─* PushSubscription, Notification, ProcessedRequest
Report → User en/of Listing
```

### 'n Nuwe soort byvoeg (later), byvoorbeeld `PRODUCT`

1. Voeg `PRODUCT` by `ListingKind`.
2. Skep `ProductDetails` (1-tot-1) en voeg `product ProductDetails?` by `Listing`.
3. Saai die kategorieë vir `PRODUCT`.
4. Skryf `services/kinds/product.ts` (Zod-skema, passing en vertoning) en registreer dit.
5. Voeg die vorm-afdeling vir die detailvelde by. Alles anders (reaksies, kennisgewings en aanvaarding) werk reeds.

---

## 5. Besigheidsreëls (in `services/`)

### Soort-module (een per soort)

```ts
// services/kinds/types.ts
interface KindModule<Details> {
	kind: ListingKind;
	detailsSchema: z.ZodType<Details>; // validasie van die detailvelde
	createDetails(tx, listingId: string, d: Details): Promise<void>;
	matchFilter(listing: ListingWithDetails): Prisma.UserWhereInput; // ekstra passing-reëls
	label: { singular: string; plural: string; respond: string }; // "Werk", "Ek is beskikbaar" …
}
// services/kinds/index.ts → export const kinds = { JOB: jobKind } satisfies Record<ListingKind, KindModule<any>>
```

### Reëls

- **Passing** (`matching.ts`): die basis geld vir almal: `available ∧ ¬blocked ∧ popiaConsentAt ≠ null ∧ id ≠ ownerId ∧ Interest(categoryId)`. Daarby kom die soort se `matchFilter`.
  - Vir `JOB`: daar moet 'n `JobTypePreference` vir `job.jobType` bestaan, en as `requiresDriversLicence` gestel is, moet `WorkerProfile.driversLicence` waar wees.
- **createListing**: die gebruiker mag nie geblokkeer wees nie. Valideer die basis en die detailvelde (`kinds[kind].detailsSchema`), skep albei in een transaksie en stuur `notify(matching, NEW_LISTING)`.
- **respond**: die plasing is `OPEN`, die sperdatum is nie verby nie, en dit is nie die eie plasing nie. Upsert die `Response` en stuur `notify(owner, NEW_RESPONSE)`.
- **acceptResponse** (transaksie): net die eienaar mag dit doen. Die reaksie word `ACCEPTED`. As die aantal `ACCEPTED` gelyk is aan `capacity`, word die plasing `CLOSED` en word die oorblywende `INTERESTED`-reaksies `DECLINED`. Almal wat geraak word, kry 'n kennisgewing.
- **cancelListing**: die plasing word `CANCELLED`, en almal wat gereageer het, kry 'n kennisgewing.
- **Kontak-sigbaarheid**: `phone` word net teruggegee as daar 'n `ACCEPTED`-reaksie tussen die twee gebruikers bestaan.
- **Geskiedenis**: voltooide plasings (`COMPLETED`) waarvoor jy aanvaar is, verskyn op jou publieke profiel met die telling "N voltooi".
- **Foto**: slegs JPEG, PNG of WebP, maksimum 5 MB. Die bediener verklein dit na 512×512 voor dit na R2 gaan.
- **Idempotensie** (`server/idempotency.ts`): `withRequestId(requestId, action, fn)`. As `requestId` al in `ProcessedRequest` is, word die gestoorde `result` teruggegee; anders word `fn` in dieselfde transaksie uitgevoer en die resultaat gestoor.
- **Vanlyn-konflikte**: die bediener se toestand wen altyd. 'n Uitkassie-aksie wat nie meer geldig is nie (bv. reageer op 'n gesluite plasing), word met 'n duidelike Afrikaanse rede verwerp, en die kliënt wys dit aan die gebruiker.
- **deleteAccount** (POPIA): die `User` word uitgevee (cascade), saam met die R2-foto.

---

## 6. Projekstruktuur

```
prisma/
  schema.prisma  seed.ts  migrations/
prisma.config.mjs                 Prisma CLI-konfigurasie (.mjs — sien struikelblokke)
vite-plugins/prisma-wasm.ts       Prisma se WASM in dev en op Cloudflare
scripts/run.mjs                   voer TS-skripte deur Vite uit (saad)
src/
  env.ts                          omgewingsveranderlikes + Zod
  hooks.server.ts                 handleError; later: Better Auth, sessie, wagte
  service-worker.ts               app-dop + bladsy- en query-kas; push ontvang en klik; uitkassie-sein
  lib/
    server/
      db/
        create.ts                 createPrisma(url) — geen SvelteKit-afhanklikhede nie
        client.ts                 prisma() — een kliënt per versoek
        index.ts                  export const DB = { user, profile, category, listing, response, … }
        category.ts  listing.ts  response.ts  interest.ts  profile.ts  …
        generated/                Prisma-kliënt (gegenereer, nie in git nie)
      auth.ts  email.ts  guards.ts  idempotency.ts
      services/
        kinds/  types.ts  index.ts  job.ts
        listings.ts  matching.ts  responses.ts  profile.ts
        notifications.ts  push.ts  moderation.ts
    remote/                       *.remote.ts — net Zod + guard + roep 'n service
    offline/                      vanlyn-infrastruktuur (geen besigheidslogika nie)
      db.ts                       IndexedDB (idb): uitkassie + metadata
      outbox.ts                   perform(): aanlyn → stuur; vanlyn → stoor in die tou
      sync.ts                     stuur die uitkassie in volgorde; hanteer verwerpings
      status.svelte.ts            aanlyn/vanlyn, aantal wagtende aksies, "laas bygewerk"
    schemas/                      gedeelde Zod-skemas
    components/                   net vertoning
  routes/
docs/PLAN.md
```

### Die `DB`-koppelvlak

```ts
// src/lib/server/db/listing.ts
export const listing = {
  create:   (data: Prisma.ListingUncheckedCreateInput) => prisma().listing.create({ data }),
  findById: (id: string) => prisma().listing.findUnique({ where: { id }, include: { category: true, job: true, owner: true } }),
  findMany: (args?: Prisma.ListingFindManyArgs) => prisma().listing.findMany(args),
  findOpenForUser: (userId: string, filter?: OpportunityFilter) => …,   // domein-navraag
  findByOwner:     (ownerId: string, status?: ListingStatus) => …,
};
// src/lib/server/db/index.ts
export const DB = { category, listing, response, interest, profile, …,
  $transaction: <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) => prisma().$transaction(fn) };
```

---

## 7. Remote functions

| Lêer                      | Funksies                                                                                                                                                                                                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.remote.ts`          | `signIn`, `signUp`, `signInWithGoogle`, `signOut`, `forgotPassword`, `resetPassword` (alles `form`)                                                                                                                                                                                                                  |
| `profile.remote.ts`       | `getMe` (q), `completeOnboarding` (f), `updateProfile` (f), `updateInterests` (f, kategorieë + jare), `updateWorkerProfile` (f, tipes + rybewys + vervoer), `uploadPhoto` (f), `removePhoto` (c), `addQualification` (f), `removeQualification` (c), `setAvailable` (c), `deleteAccount` (f), `getPublicProfile` (q) |
| `categories.remote.ts`    | `getCategories` (q, per soort)                                                                                                                                                                                                                                                                                       |
| `listings.remote.ts`      | `getMyListings` (q), `getListingForOwner` (q), `createListing` (f), `updateListing` (f), `cancelListing` (c), `completeListing` (c), `estimateRecipients` (q)                                                                                                                                                        |
| `opportunities.remote.ts` | `getOpportunities` (q, filters), `getOpportunity` (q)                                                                                                                                                                                                                                                                |
| `responses.remote.ts`     | `respond` (f), `withdraw` (c), `acceptResponse` (c), `getMyResponses` (q)                                                                                                                                                                                                                                            |
| `notifications.remote.ts` | `getNotifications` (q), `getUnreadCount` (q), `markRead` (c), `savePushSubscription` (c), `removePushSubscription` (c), `getVapidPublicKey` (q)                                                                                                                                                                      |
| `reports.remote.ts`       | `createReport` (f)                                                                                                                                                                                                                                                                                                   |
| `admin.remote.ts`         | `getStats`, `getReports`, `resolveReport`, `searchUsers`, `setBlocked`, `setAdmin`, `getAllCategories`, `saveCategory`                                                                                                                                                                                               |

(q = query, f = form, c = command.) Elke funksie volg dieselfde patroon: `guard()` → Zod → **één** service-oproep → 'n vertoonklaar resultaat.
Elke `form`/`command` (behalwe aanmelding) aanvaar ook 'n `requestId` en loop deur `withRequestId()`. Sien afdeling 9.

---

## 8. Webblaaie

Die URL's is algemeen, maar die UI-teks praat vir eers van "werk".

### Uitleg en wagte (`hooks.server.ts`)

- Nie aangemeld nie → `/teken-in`. `popiaConsentAt` is null → `/begin`. `blocked` → `/geblokkeer`. `/admin/*` vereis `isAdmin`.
- Navigasie (onderaan op foon, sybalk op rekenaar): `Tuis` · `Geleenthede` · `My plasings` · `Kennisgewings` · `Profiel`
- **Vanlyn-statusbalk** in die uitleg: "Jy is vanlyn · laas bygewerk 14:32 · 2 aksies wag". Dit skakel na `/uitkassie`.

### Publiek

| Roete                                                  | Inhoud                                                 |
| ------------------------------------------------------ | ------------------------------------------------------ |
| `/`                                                    | Wat Dorpsplein is en hoe dit werk; aangemeld → `/tuis` |
| `/teken-in`, `/registreer`                             | Google of e-pos + wagwoord                             |
| `/wagwoord-vergeet`, `/wagwoord-herstel`               | Herstelvloei                                           |
| `/privaatheid`, `/terme`, `/installeer`, `/geblokkeer` | Statiese bladsye                                       |

### Aanboording `/begin`

1. Foon + POPIA-toestemming
2. Belangstellings: kategorieë (+ jare ervaring)
3. _(as werk-kategorieë gekies is)_ tipes werk, rybewys, eie vervoer, opskrif, foto (opsioneel)
4. Kennisgewings aanskakel (op iPhone eers `/installeer`)

### Aangemeld

| Roete                  | Inhoud                                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/tuis`                | Beskikbaar-skakelaar, nuutste geleenthede, my oop reaksies, my oop plasings + reaksietelling                                                                         |
| `/geleenthede`         | Oop plasings wat by my pas (filter op soort, kategorie en tipe)                                                                                                      |
| `/geleenthede/[id]`    | Besonderhede; **Ek is beskikbaar** (+ nota) / **Onttrek**; ná aanvaarding: plaser se foonnommer; Rapporteer                                                          |
| `/my-reaksies`         | My reaksies + status                                                                                                                                                 |
| `/plasings`            | My plasings, met oortjies Oop · Gesluit · Voltooi · Gekanselleer                                                                                                     |
| `/plasings/nuut`       | Kies soort (vir eers net Werk) → vorm met algemene + detailvelde; regstreekse "± N mense sal kennisgewing kry"                                                       |
| `/plasings/[id]`       | Besonderhede + reaksielys (foto, naam, opskrif, ervaring, rybewys/vervoer, "N voltooi", nota); **Aanvaar**; kontak van aanvaarde mense; Wysig · Kanselleer · Voltooi |
| `/plasings/[id]/wysig` | Dieselfde vorm (geen herkennisgewing nie)                                                                                                                            |
| `/mense/[id]`          | Publieke profiel: foto, opskrif, bio, belangstellings + ervaring, kwalifikasies, geskiedenis. Geen foonnommer nie                                                    |
| `/kennisgewings`       | Inkassie                                                                                                                                                             |
| `/profiel`             | Oor my · Belangstellings · Werk-voorkeure · Kwalifikasies · Beskikbaarheid · Toestelle · Rekening                                                                    |
| `/uitkassie`           | Aksies wat wag of verwerp is, met die rede; **Probeer weer** / **Gooi weg**                                                                                          |
| `/vanlyn`              | Terugvalbladsy vir roetes wat nog nie in die kas is nie                                                                                                              |
| `/admin/*`             | Statistiek, rapporte, gebruikers, kategorieë                                                                                                                         |

### Hoofvloei

```
/ ─► /registreer ─► /begin ─► /tuis
                               │
   ┌────────── plaser ─────────┐     ┌──────── reageerder ────────┐
   /plasings/nuut ─► /plasings/[id]    (push) ─► /geleenthede/[id]
                       ▲     │ Aanvaar                │ Ek is beskikbaar
         (push: nuwe reaksie)│                        │
                       └─────┼────────────────────────┘
                             └─► (push: aanvaar) ─► /geleenthede/[id] + kontak
```

---

## 9. Vanlyn

### Doel

Wanneer Dorpsplein as 'n app (PWA, later moontlik Capacitor) geïnstalleer is, moet dit sonder sein **bruikbaar** bly. Mense moet kan sien wat hulle laas gesien het, en aksies kan uitvoer wat outomaties gestuur word sodra daar weer verbinding is.

### Omvang

|                        | Vanlyn beskikbaar                                                                                                                                                                                      | Hoe                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| **Lees**               | `/tuis`, `/geleenthede` (+ besonderhede wat al oopgemaak is), `/plasings` (+ reaksies soos laas gesinchroniseer), `/my-reaksies`, `/kennisgewings`, eie `/profiel`, besoekte `/mense/[id]`, kategorieë | Uit die kas, gemerk "laas bygewerk om …"                       |
| **Skryf (in die tou)** | Reageer / onttrek; skep, wysig, kanselleer en voltooi 'n plasing; aanvaar 'n reaksie; wysig profiel en belangstellings; beskikbaar-skakelaar; merk kennisgewing gelees; rapporteer                     | Uitkassie → gestuur sodra daar sein is → die bediener valideer |
| **Net aanlyn**         | Registreer, eerste aanmelding, wagwoordherstel, Google-aanmelding, foto-oplaai, rekening-uitvee, push aanskakel, admin                                                                                 | Knoppies word gedeaktiveer met "Benodig 'n internetverbinding" |

'n Bestaande sessie bly vanlyn geldig. Aanmelding self vereis wel 'n verbinding.

### Hoe dit werk

**Lees (service worker):**

1. **App-dop**: SvelteKit se gebou-lêers (`$service-worker`: `build`, `files`) word by installasie in die kas gesit.
2. **Bladsye**: navigasieversoeke gebruik eers die netwerk en val dan terug op die kas. Besoekte bladsye word in die kas gehou; 'n onbesoekte roete kry `/vanlyn`.
3. **Data**: remote **query**-versoeke (`GET`) gebruik eers die netwerk met 'n kort tydsperk, en val dan terug op die laaste antwoord in die kas. Mutasies (`POST`) word nooit gekas nie.

**Skryf (uitkassie):**

1. Elke mutasie in die UI gaan deur `perform(action, input)` in `#lib/offline/outbox.ts`.
2. Aanlyn: die remote function word direk geroep, met 'n nuwe `requestId`.
3. Vanlyn, of by 'n netwerkfout: `{ requestId, action, input, createdAt }` word in IndexedDB gestoor, en die UI wys "Wag om gestuur te word".
4. `sync.ts` stuur die tou **in volgorde** wanneer die toestel aanlyn kom, die app oopmaak of na die voorgrond kom. Dit gebruik ook Background Sync waar beskikbaar.
5. Die bediener se antwoord op elke item:
   - **Sukses** → die item word verwyder en die betrokke queries word herlaai.
   - **Verwerp** (validasie of besigheidsreël) → die item word gemerk as verwerp, met die bediener se rede, en verskyn op `/uitkassie`.
   - **Netwerkfout** → die item bly in die tou; daar word later weer probeer.
6. `withRequestId()` op die bediener verseker dat 'n item wat twee keer gestuur word (bv. as die verbinding halfpad verbreek het), net een keer verwerk word.

**Toegelate aksies:** die uitkassie het 'n vaste lys aksies wat in die tou mag gaan (`responses.respond`, `listings.create`, …). Dit verhoed dat net-aanlyn-aksies per ongeluk in die tou beland.

### Reëls vir die kliënt

- Die kliënt **wys** net. Dit voorspel nie die uitslag nie: geen "plasing is nou gesluit" voordat die bediener dit bevestig het nie. Tougestaande aksies word as "wagtend" gemerk.
- Vorms gebruik dieselfde gedeelde Zod-skemas (`#lib/schemas`) vir onmiddellike terugvoer. Dit is UX; die bediener valideer altyd weer.
- Kas en IndexedDB word by afmelding uitgevee.

### Toetse

- Playwright met `context.setOffline(true)`: maak bladsye vanlyn oop, reageer op 'n plasing, gaan weer aanlyn en kyk dat die reaksie op die bediener aankom.
- Vitest vir `withRequestId()`: dieselfde `requestId` twee keer → een rekord en dieselfde resultaat.
- Konflik-toets: reageer vanlyn, laat die plaser intussen die plasing sluit, sinchroniseer, en kyk dat die aksie verwerp word en op `/uitkassie` verskyn.

---

## 10. Hoe ons werk

- **Fondament (Fase 0): jy bou self, een stap op 'n slag.** Ek verduidelik elke stap (wat, waarom, wat om na te kyk). Jy voer dit uit en rapporteer terug, en dan gaan ons verder.
- **Ná die fondament** skryf ek kode stuk vir stuk; jy hersien en speel na elke fase.

---

## 11. Fases

### Fase 0 — Fondament (jy bou self)

| Stap | Wat                                                                                                       | Jy leer                                        |
| ---- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1    | `sv create` in hierdie repo: SvelteKit 3, TS, Tailwind, Cloudflare, remote functions                      | Projekstruktuur en SvelteKit 3 se konfigurasie |
| 2    | Neon: rekening, projek, takke `main`/`dev`, gepoelde en direkte verbinding, `.env`                        | Serverless Postgres en takke                   |
| 3    | Prisma installeer, `allowScripts` goedkeur, `prisma.config.mjs`, generator (`workerd`)                    | Prisma 7 se nuwe opstelling                    |
| 4    | Skema: `ListingKind` + `Category`; eerste migrasie                                                        | Migrasies                                      |
| 5    | Saad + `scripts/run.mjs`; die WASM-plugin                                                                 | Waarom Prisma op Workers WASM gebruik          |
| 6    | `src/env.ts`; die DB-laag (`create.ts`, `client.ts`, `category.ts`, `index.ts`)                           | Een kliënt per versoek, die `DB`-patroon       |
| 7    | Eerste remote function + SSR-bladsy; `hooks.server.ts` (`handleError`)                                    | Remote functions, `<svelte:boundary>`, SSR     |
| 8    | `npm run build` + `npm run preview` (Wrangler, `.dev.vars`); check, lint en commit                        | Cloudflare se runtime plaaslik                 |
| 9    | Cloudflare Workers gekoppel aan GitHub (`tertius4/dorpsplein`), geheime, preview-Worker; eerste ontplooiing | CI/CD op Cloudflare                            |

✅ **Speel:** die kategorieë verskyn op `/` plaaslik en op die Cloudflare-URL. Wysig een in `npm run db:studio` en kyk hoe dit verander.

### Fase 1 — Aanmelding en profiel

Better Auth (Google + e-pos, Resend), `User`/`Session`/`Account`/`Verification`, `Profile`, `Interest`, `WorkerProfile`, `JobTypePreference`, `Qualification`, R2-foto's, wagte, `/teken-in`, `/registreer`, `/wagwoord-*`, `/begin`, `/profiel`, `/mense/[id]`, `/tuis` (leeg), `/privaatheid`.
✅ **Speel:** registreer op albei maniere, voltooi `/begin`, laai 'n foto op, voeg kwalifikasies by, bekyk jou publieke profiel, en kyk dat wagte herlei.

### Fase 2 — Plasings en passing

`Listing`, `JobDetails`, die soort-module-patroon (`kinds/job.ts`), `matching.ts`, `/plasings/*`, ontvanger-skatting. `ProcessedRequest` + `withRequestId()`: **mutasies is van hier af idempotent**, sodat Fase 5 net die kliëntkant hoef by te voeg. Saad: 10 toetsgebruikers met verskillende belangstellings.
✅ **Speel:** skep plasings met verskillende kategorieë en tipes en kyk hoe "± N mense" verander. Vitest vir passing.

### Fase 3 — Reaksies en aanvaarding

`Response`, `responses.ts`, `/geleenthede/*`, `/my-reaksies`, aanvaarding met sluit-logika, kontak-deling en profielgeskiedenis.
✅ **Speel:** gebruik twee blaaiers. 'n Plasing vir 2 mense kry 3 reaksies; jy aanvaar 2, die plasing word "Gesluit" en die derde persoon kry "afgewys". Playwright-toets.

### Fase 4 — Kennisgewings

4a: `Notification` + `/kennisgewings` + teller. 4b: push (VAPID, service worker, manifest, `/installeer`).
✅ **Speel:** die inkassie vul in die tweede blaaier, en die foon lui wanneer 'n plasing geskep word.

### Fase 5 — Vanlyn

Service worker-kas (app-dop, bladsye, queries), `/vanlyn`, `#lib/offline/*` (IndexedDB, `perform()`, `sync.ts`), vanlyn-statusbalk, `/uitkassie`, `navigator.storage.persist()`, opruiming by afmelding.
✅ **Speel:** installeer die app op 'n foon, skakel vliegtuigmodus aan en blaai deur `/tuis` en `/geleenthede`. Reageer op 'n plasing en skakel vliegtuigmodus af: die reaksie kom by die plaser aan. Probeer ook die konflik-scenario uit afdeling 9.

### Fase 6 — Admin, veiligheid en afronding

`Report`, `/admin/*`, blokkering, rekening-uitvee, `/terme`, foutbladsye en toeganklikheid.
✅ **Speel:** rapporteer en blokkeer iemand, en vee 'n toetsrekening uit.

### Fase 7 — Proeflopie

Produksie-tak, `.co.za`-domein, Google OAuth-produksie-sleutels, en 10–20 inwoners + 3–5 werkgewers vir 2 weke.

### Later

- **Nuwe soorte:** `SERVICE` (dienste/vakmanne), `PRODUCT`, `RENTAL`.
- Capacitor-omhulsel vir Play Store / App Store (as die PWA nie genoeg is nie).
- Graderings, e-pos as rugsteun vir push, kalender-beskikbaarheid, eerste-kom-eerste-maal, Ora-betalings.

---

## 12. Verifikasie (deurlopend)

- `npm run check` en `npm run lint` ná elke stap of fase.
- Vitest vir `services/` teen die Neon `dev`-tak.
- Playwright e2e vir die hoofvloei (vanaf Fase 3) en vanlyn-scenario's (vanaf Fase 5).
- Elke fase word na 'n Cloudflare-voorskou ontplooi en op 'n foon getoets.
