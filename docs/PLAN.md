# Dorpsplein — Plan

> **Stand van sake (10 Oktober 2026):** Fase 0 (fondament) en Fase 1 (aanmelding en profiele) is klaar en in produksie op <https://dorpsplein.co.za>. **Volgende: Fase 2, plasings en passing** (sien §11).

## 1. Visie

**Dorpsplein** bring enige twee mense in Orania bymekaar wat met mekaar handel wil dryf: 'n aanstelling, 'n diens, 'n produk, enigiets.

Ons begin met **werk** (werkgewer ↔ werknemer), maar die datamodel en kode word van die begin af **algemeen** ontwerp. 'n Nuwe soort handel (dienste, produkte, verhuring …) moet later bygevoeg kan word sonder om die bestaande struktuur te herbou.

Dorpsplein moet ook **vanlyn werk**. As dit as 'n app op die foon geïnstalleer is, moet mense steeds kan sien wat hulle laas gesien het, en aksies kan uitvoer wat outomaties gestuur word sodra daar weer sein is. Sien **§9**.

### Die kernpatroon (geld vir álle soorte)

1. Mense stel hul **belangstellings** in: kategorieë waaroor hulle kennisgewings wil kry. ✅ _gebou_
2. Iemand skep 'n **plasing** (`Listing`) van 'n sekere **soort** (`kind`). ⏳ _Fase 2_
3. Almal wie se belangstellings pas, kry 'n **kennisgewing**. ⏳ _Fase 2 (passing), Fase 4 (kennisgewing)_
4. Hulle **reageer** (`Response`): "Ek stel belang / is beskikbaar". ⏳ _Fase 3_
5. Die plaser **aanvaar** een of meer reaksies. Kontakbesonderhede word gedeel en die plasing sluit wanneer dit vol is. ⏳ _Fase 3_

### Eerste soort: `JOB`

Dek: permanente poste, deeltyds, los takies ("middagwerkie") en seisoenwerk.
_Dienste en vakmanne word later 'n eie soort (`SERVICE`)._

---

## 2. Argitektuur-beginsels

- **Een SvelteKit-projek** bevat die frontend én die backend, sonder 'n aparte API of BaaS.
- **Die bediener doen die werk**: SSR en SvelteKit **remote functions** (`query`, `form`, `command` in `*.remote.ts`).
- **Geen besigheidslogika in die frontend nie.** Komponente roep net remote functions en vertoon die resultaat. Alle validasie, magtiging, passing en kennisgewings gebeur in `src/lib/server/**`. SvelteKit 3 verbied dat kliëntkode enige `/server/`-gids invoer, en dit dwing die reël af.
  - Die enigste blaaierkode buite vertoning is **infrastruktuur en mediavoorbereiding**: die service worker (kas en push), `PushManager.subscribe()`, die vanlyn-laag (kas en uitkassie) en die verkleining van foto's (`#lib/client/resize-image.ts`). Dit stoor, stuur of berei data voor, maar **besluit nooit** iets nie. Die bediener valideer altyd weer.
- **Lae:** `komponent → *.remote.ts (Zod + guard) → services → DB → Prisma → Neon`.
  - `*.remote.ts`: net `requireUser()`, Zod en **één** service-oproep. Gee 'n **vertoonvorm** terug, nooit 'n rou databasisry nie.
  - `services/`: die besigheidsreëls. Gooi `error(4xx, 'Afrikaanse boodskap')`; remote `form`s vertaal 'n 400 na `invalid()` waar 'n boodskap by die vorm beter is as 'n foutbladsy.
  - `db/`: getikte repos (`DB.profile.upsert(...)`). Repos wat in 'n transaksie gebruik word, kry 'n laaste parameter `db: Db = prisma()`.
- **Wagte in `hooks.server.ts` is vir navigasie (UX), nie sekuriteit nie.** Wat werklik saak maak (toestemming, eienaarskap, sigbaarheid), word in die services teen die databasis afgedwing.
- **Privaatheid deur witlyste:** publieke data word met 'n eksplisiete Prisma-`select` gelees (`db/user.ts`), sodat sensitiewe velde nooit uit die databasis kom nie. Een 404 vir "bestaan nie / mag nie sien nie", sodat niemand kan aflei dat 'n rekening bestaan nie.
- **Eienaarskap in die navraag (IDOR):** wysig of vee uit met `where: { id, userId }` (bv. `deleteOwned`), nie net `where: { id }` nie.
- **Vanlyn: die kliënt kas en staan in die tou; die bediener besluit** (Fase 5). Elke aksie word eers deur die bediener gevalideer wanneer dit gesinchroniseer word.
- **Mutasies word idempotent** vanaf Fase 2: elke `form`/`command` aanvaar 'n `requestId` (UUID van die kliënt), en die bediener verwerk dieselfde `requestId` nooit twee keer nie.
- **Soort-modules:** alles wat van 'n soort afhang (detailvelde, validasie, passing, vertoonteks) leef in een lêer per soort (`services/kinds/job.ts`). Die res van die kode is soort-agnosties.
- **Kode en kommentaar in Engels of Afrikaans (wees konsekwent per lêer); UI-teks en URL's in Afrikaans.**

---

## 3. Tegnologie

| Laag          | Keuse                                               | Notas                                                                                                                                        |
| ------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Raamwerk      | **SvelteKit 3** + Svelte 5, TypeScript              | Remote functions en `async` is nog eksperimenteel en word in `vite.config.ts` aangeskakel                                                    |
| Validasie     | **Zod 4**                                           | Standard Schema, dus werk dit direk met remote functions en `src/env.ts`                                                                     |
| Huisvesting   | **Cloudflare Workers** + statiese lêers (`assets`)  | `@sveltejs/adapter-cloudflare` 8, `nodejs_compat`, `observability` aan. Bindings via `cloudflare:workers` (sien §3 struikelblokke)           |
| Databasis     | **Neon Postgres** (Frankfurt)                       | Gratis; skaal na nul en word self wakker. Takke `main` (produksie) en `dev`. ±170 ms per heen-en-weer vanaf SA                               |
| ORM           | **Prisma 7.10** (vasgepen)                          | Generator `prisma-client`, runtime `workerd`, `@prisma/adapter-neon`, plus 'n herprobeer-uitbreiding vir Neon se koue begin (`db/create.ts`) |
| DB-koppelvlak | Eie **`DB`-objek** bo-op Prisma                     | `DB.profile.findByUserId()`, `DB.interest.syncForUser()` … volledig getik                                                                    |
| Aanmelding    | **Better Auth 1.7.7** (vasgepen)                    | Prisma-adapter; e-pos/wagwoord met verplig­te verifikasie, wagwoordherstel, Google OAuth; `cookieCache` 5 min; eie koersbeperking vir vorms  |
| E-pos         | **Resend**, domein `pos.dorpsplein.co.za`           | Afsender `geen-antwoord@pos.dorpsplein.co.za`; SPF/DKIM/DMARC (`p=none`). Plaaslik sonder sleutel: e-posse word na die terminale gelog       |
| Foto's        | **Cloudflare R2**, binding `PHOTOS`                 | `dorpsplein-fotos` (produksie), `dorpsplein-fotos-dev` (dev). Blaaier verklein na 512² WebP (verwyder GPS); bediener kontroleer magic bytes  |
| Push          | **Web-push (VAPID)** — Fase 4                       | Met 'n Workers-versoenbare biblioteek (die gewone `web-push` werk nie op Workers nie); gestuur via `waitUntil`                               |
| Vanlyn        | **Service worker** + **IndexedDB** (`idb`) — Fase 5 | App-dop en besoekte bladsye in die kas; remote-query-antwoorde in die kas; uitkassie vir mutasies                                            |
| App           | **PWA** eerste (installeerbaar, vanlyn, push)       | Later, indien nodig, 'n **Capacitor**-omhulsel vir Play Store / App Store                                                                    |
| Styl          | **Tailwind CSS 4**                                  | Met die `forms`-plugin                                                                                                                       |
| Toetse        | **Vitest** (services), **Playwright** (e2e)         | Nog min toetse; sien §12                                                                                                                     |

### Omgewings

| Omgewing  | Git-tak  | Worker                                          | URL                            | Neon-tak | R2-emmer                | `APP_ENV`    |
| --------- | -------- | ----------------------------------------------- | ------------------------------ | -------- | ----------------------- | ------------ |
| Plaaslik  | enige    | — (`npm run dev` / `npm run preview`)           | `localhost:5173` / `:4173`     | `dev`    | nageboots (`.wrangler`) | `local`      |
| Dev       | `dev`    | `dorpsplein-dev` (`wrangler.jsonc` → `env.dev`) | <https://dev.dorpsplein.co.za> | `dev`    | `dorpsplein-fotos-dev`  | `dev`        |
| Produksie | `master` | `dorpsplein`                                    | <https://dorpsplein.co.za>     | `main`   | `dorpsplein-fotos`      | `production` |

- **Werkvloei:** funksie-tak → saamsmelt in `dev` (`--no-ff`) → toets op `dev.dorpsplein.co.za` (agter Cloudflare Access) → saamsmelt `dev` in `master`.
- **Migrasies:** `npm run db:migrate` werk Neon `dev` by terwyl jy ontwikkel. Vir produksie: `DIRECT_URL="…main…" npx prisma migrate deploy` **voordat** `dev` in `master` saamgesmelt word. Outomatisering volg in Fase 7.
- **Konfigurasie per omgewing:**

  | Naam                                                                           | Soort               | Waar                                                                   |
  | ------------------------------------------------------------------------------ | ------------------- | ---------------------------------------------------------------------- |
  | `APP_ENV`, `BETTER_AUTH_URL`, `EMAIL_FROM`, `GOOGLE_CLIENT_ID`                 | `vars` (nie geheim) | `wrangler.jsonc`, op **albei** vlakke (`env.dev` erf nie)              |
  | `PHOTOS` (R2)                                                                  | binding             | `wrangler.jsonc`, op albei vlakke                                      |
  | `DATABASE_URL`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `GOOGLE_CLIENT_SECRET` | geheim              | `wrangler secret put … [--env dev]`; plaaslik in `.env` en `.dev.vars` |
  | `DIRECT_URL`                                                                   | net Prisma CLI      | `.env`                                                                 |

  Elke omgewing het sy **eie** `BETTER_AUTH_SECRET`, Resend-sleutel en Google OAuth-kliënt. `.env.example` lys alles.

### SvelteKit 3 — wat anders is as weergawe 2

- Daar is **geen `svelte.config.js`** meer nie. Die konfigurasie gaan in `sveltekit({...})` in `vite.config.ts`.
- **`$lib` is vervang deur `#lib/...`** (Node se subpad-invoere in `package.json`), met die volle lêernaam: `import { DB } from '#lib/server/db/index.ts'`.
- **Omgewingsveranderlikes** word in `src/env.ts` met `defineEnvVars` + 'n Zod-skema gedefinieer en uit `$app/env/private` of `$app/env/public` ingevoer.
- **`building`** kom uit `$app/env` (nie `$app/environment` nie).
- **`handleError`** (`@sveltejs/kit/hooks`) kry `{ kind, error, event }`, waar `kind` een van `app | framework | validation | unknown` is. Net `unknown` word gelog en gemasker.
- **Enige `/server/`-gids** (nie net `$lib/server`) is net vir die bediener beskikbaar.
- **Route-groepe** (`(guest)`, `(onboarding)`, `(app)`) bepaal die wagte; sien §8.

### Remote functions — patrone wat ons gebruik

- **Velde:** `form.fields.x.as('text', beginwaarde)`; groepe met `as('checkbox', waarde, gekies)`; geneste lyste (`fields.interests[i].years`); `allIssues()` vir geneste foute + `refine`-boodskappe; velde wat met `_` begin (`_password`) word nooit teruggestuur nie; booleans in vorm-skemas moet `.optional()` wees.
- **Single-flight:** ná 'n mutasie roep die bediener `await query().refresh()` sodat die nuwe data saam met die antwoord gaan. As die bediener reeds die nuwe waarde ken, gebruik `query().set(waarde)` (bv. `getCurrentUser` ná 'n naamverandering, want `locals.user` is in daardie versoek nog oud).
- **Kliënt-versoekte verversing:** `command(...).updates(query())` op die kliënt vereis dat die command dit hanteer met `await requested(query, 1).refreshAll()`, anders 400 _"Requested update was not handled"_.
- **`command`** vir knoppies/skakelaars sonder `<form>` (vereis JavaScript); **`form`** vir alles met velde (werk sonder JavaScript).
- **Lêers:** `z.instanceof(File)` in die skema; die blaaier sit die verkleinde lêer via `DataTransfer` in die versteekte vorm se `<input type="file">` en roep `requestSubmit()`.

### Bekende struikelblokke (en oplossings)

| Probleem                                                                                                                    | Oplossing                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma se `workerd`-kliënt laai sy enjin met `import('./x.wasm?module')`, wat Vite nie verstaan nie                         | `vite-plugins/prisma-wasm.ts`: in dev kompileer dit die WASM self; in die bou kopieer dit die WASM na die **bediener**-uitset (per Vite-omgewing) en laat Wrangler dit bundel |
| Skripte in Node kan nie `.wasm?module` invoer nie                                                                           | Voer skripte deur Vite uit: `node --env-file=.env scripts/run.mjs <lêer.ts>` (gebruik `createPrisma` uit `db/create.ts`, nie `prisma()` nie)                                  |
| `prisma.config.ts` kan nie SvelteKit 3 se `$app/tsconfig` oplos nie                                                         | `prisma.config.mjs`; voer `svelte-kit sync` uit voor `prisma generate` (`prepare` doen dit)                                                                                   |
| Prisma 7 se `migrate dev` voer nie `prisma generate` uit nie                                                                | `db:migrate` = `prisma migrate dev && prisma generate`                                                                                                                        |
| `npm run db:migrate -- --name x` vra steeds vir 'n naam en **hang** sonder terminale (en hou die migrasie-slot op Neon vas) | `npx prisma migrate dev --name x --create-only`, lees die SQL, dan `npx prisma migrate dev`                                                                                   |
| npm 11 blokkeer installeer-skripte (`allowScripts`)                                                                         | Keur net esbuild, prisma, @prisma/engines en workerd goed met `npm approve-scripts`. Doen dit weer ná opgraderings                                                            |
| **adapter-cloudflare 8 gee nie `event.platform` deur nie** (dev én produksie)                                               | Bindings en `waitUntil`: `import { env, waitUntil } from 'cloudflare:workers'` (die adapter boots dit in dev na). `App.Platform` in `app.d.ts` word nie gebruik nie           |
| 'n `pending`-snippet in `<svelte:boundary>` laat SSR die data oorslaan                                                      | Gebruik geen `pending` vir data wat die bediener moet render nie; die laai-balk in die uitleg wys navigasie                                                                   |
| Een Prisma-kliënt mag nie oor Worker-versoeke heen hergebruik word nie                                                      | Een kliënt per versoek (`WeakMap` op `getRequestEvent()`); Better Auth kry 'n `Proxy` wat elke oproep na die huidige versoek se kliënt stuur                                  |
| Better Auth se CLI kan `auth.ts` nie laai nie (`$app/*`-invoere)                                                            | Die auth-tabelle is met die hand uit `node_modules/@better-auth/core/dist/db/get-tables.mjs` vertaal. Kontroleer dit weer by opgraderings of nuwe Better Auth-plugins         |
| Better Auth se `peerDependencies` verwag SvelteKit 2                                                                        | `overrides` in `package.json`                                                                                                                                                 |
| `auth.api.*` vanaf die bediener slaan Better Auth se router oor, dus ook sy **koersbeperking**                              | Eie koersbeperking (`server/rate-limit.ts`, atomiese SQL op `RateLimit` met sleutels `app:…`) in die auth-vorms. SvelteKit self kontroleer `Origin` vir remote functions      |
| `svelteKitHandler` hanteer `/api/auth/*` net as die oorsprong presies `BETTER_AUTH_URL` is                                  | 'n Onverklaarbare 404 op `/api/auth/*` = verkeerde URL of poort                                                                                                               |
| `wrangler dev` met `routes` stuur versoeke as `https://dorpsplein.co.za/…`                                                  | `preview` = `wrangler dev --port 4173 --local-upstream localhost:4173 --upstream-protocol http`                                                                               |
| `cookieCache`: sessie-data is tot 5 min oud                                                                                 | Na 'n naam- of foto-verandering: deur `auth.api.updateUser` gaan (werk die koekie by)                                                                                         |
| Workers Free: 10 ms CPU per versoek                                                                                         | Geen beeldverwerking op die bediener nie (foto's word in die blaaier verklein)                                                                                                |
| Die blaaier hou soms 'n verouderde Vite-module in die kas (vreemde "x is not defined")                                      | Harde herlaai (Ctrl+Shift+R); dit is 'n dev-artefak, nie 'n kodefout nie                                                                                                      |
| iOS/Safari ondersteun nie _Background Sync_ nie (Fase 5)                                                                    | Die uitkassie word gestuur by `online`, wanneer die app oopmaak en wanneer dit na die voorgrond kom                                                                           |
| Die blaaier kan IndexedDB en die kas uitvee (Fase 5)                                                                        | `navigator.storage.persist()`; die app moet met 'n leë kas kan begin                                                                                                          |
| SSR-bladsye laai nie vanlyn nie (Fase 5)                                                                                    | Service worker: eers netwerk, dan kas vir besoekte bladsye, met `/vanlyn` as terugval                                                                                         |
| Privaat data bly in die kas op 'n gedeelde foon (Fase 5)                                                                    | By afmelding word die kas en IndexedDB uitgevee                                                                                                                               |

---

## 4. Datamodel (benadering A: algemene tabelle + detailtabelle per soort)

### Waarom detailtabelle?

- **Algemene tabelle** (`Listing`, `Response`, `Interest`) hou alles wat vir álle soorte geld.
- **Detailtabelle** (`JobDetails`, later `ServiceDetails` en `ProductDetails`) is 1-tot-1 met `Listing` en hou die soort-spesifieke velde.
- Voordele: volledige TypeScript-tipes, die databasis dwing reëls af, gewone `JOIN`s en indekse vir filters, en maklike verslae.
- Prys: 'n nuwe soort vereis 'n nuwe tabel en migrasie.

### ✅ Gebou (migrasies `init`, `auth`, `profile`, `public_profile`)

Sien `prisma/schema.prisma` vir die presiese velde. Opsomming:

| Model                                        | Doel                                                                                                                                                                                    |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ListingKind` (enum)                         | `JOB`                                                                                                                                                                                   |
| `Category`                                   | Kategorieë per soort (`@@unique([kind, name])`); word nooit uitgevee nie, net `active = false`                                                                                          |
| `User`, `Session`, `Account`, `Verification` | Better Auth. `User.image` = Google-foto **of** ons eie foto-URL (gesinchroniseer by oplaai)                                                                                             |
| `RateLimit`                                  | Better Auth se koersbeperking (`storage: 'database'`) én ons eie (`app:`-sleutels; `lastRequest` = begin van die venster)                                                               |
| `Profile`                                    | 1-tot-1 met `User`: `headline`, `bio`, `photoKey` (R2), `phone` (E.164, `+27…`), `available`, `publicProfile`, `isAdmin`, `blocked`, `popiaConsentAt` (null = `/begin` nie voltooi nie) |
| `Qualification`                              | Naam, uitreiker, jaar; hoogstens 20 per persoon                                                                                                                                         |
| `Interest`                                   | `@@id([userId, categoryId])` + `yearsExperience`; `@@index([categoryId])` vir passing; `Category` is `RESTRICT`                                                                         |
| `JobType` (enum)                             | `PERMANENT`, `PART_TIME`, `ODD_JOB`, `SEASONAL`                                                                                                                                         |
| `WorkerProfile`                              | `driversLicence`, `ownTransport`                                                                                                                                                        |
| `JobTypePreference`                          | `@@id([userId, jobType])`, `@@index([jobType])`                                                                                                                                         |

### ⏳ Beplan

```prisma
enum ListingStatus    { OPEN CLOSED COMPLETED CANCELLED }       // CLOSED = genoeg reaksies aanvaar
enum ResponseStatus   { INTERESTED WITHDRAWN ACCEPTED DECLINED }
enum NotificationType { NEW_LISTING NEW_RESPONSE RESPONSE_ACCEPTED RESPONSE_DECLINED LISTING_CANCELLED }
enum ReportStatus     { OPEN RESOLVED DISMISSED }

// Fase 2
model Listing {
  id          String        @id @default(cuid())
  kind        ListingKind
  ownerId     String
  owner       User          @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  categoryId  Int
  category    Category      @relation(fields: [categoryId], references: [id])
  title       String        @db.VarChar(100)
  description String?       @db.VarChar(2000)
  price       String?       @db.VarChar(100)  // vrye teks: "R300 per dag"
  capacity    Int           @default(1)       // hoeveel reaksies aanvaar kan word
  location    String?       @db.VarChar(120)
  startsAt    DateTime?
  endsAt      DateTime?
  closesAt    DateTime?                       // sperdatum vir reaksies
  status      ListingStatus @default(OPEN)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  job         JobDetails?                     // later: service ServiceDetails?, product ProductDetails?
  @@index([status, kind, categoryId])
  @@index([ownerId, status])
}

model JobDetails {                            // 1-tot-1 met Listing (kind = JOB)
  listingId              String  @id
  listing                Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  jobType                JobType
  requiresDriversLicence Boolean @default(false)
  @@index([jobType])
}

model ProcessedRequest {                      // idempotensie: "hierdie aksie is reeds verwerk"
  requestId String   @id                      // UUID van die kliënt
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  action    String                            // bv. "listings.create"
  result    Json?                             // die oorspronklike antwoord, vir herhalings
  createdAt DateTime @default(now())
  @@index([userId, createdAt])                // ou rye word ná 30 dae opgeruim
}

// Fase 3
model Response {
  id          String         @id @default(cuid())
  listingId   String
  responderId String
  listing     Listing        @relation(fields: [listingId], references: [id], onDelete: Cascade)
  responder   User           @relation(fields: [responderId], references: [id], onDelete: Cascade)
  status      ResponseStatus @default(INTERESTED)
  note        String?        @db.VarChar(300) // "Kan eers 09:00 begin"
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  @@unique([listingId, responderId])
  @@index([responderId, status])
}

// Fase 4
model PushSubscription { id, userId, endpoint @unique, p256dh, auth, device?, createdAt }
model Notification     { id, recipientId, type, listingId?, title, body?, url, readAt?, createdAt; @@index([recipientId, readAt]) }

// Fase 6
model Report           { id, reporterId, reportedUserId?, listingId?, reason, status, handledById?, createdAt }
```

### Verhoudings

```
User 1─1 Profile · 1─0..1 WorkerProfile · 1─* Qualification            ✅
User *─* Category            via Interest (+ jare ervaring)              ✅
User 1─* JobTypePreference                                               ✅
User (plaser) 1─* Listing *─1 Category                                   ⏳ Fase 2
Listing 1─0..1 JobDetails     (later ServiceDetails, ProductDetails)     ⏳ Fase 2
Listing 1─* Response *─1 User (reageerder)                               ⏳ Fase 3
User 1─* PushSubscription, Notification, ProcessedRequest                ⏳ Fase 2/4
Report → User en/of Listing                                              ⏳ Fase 6
```

### 'n Nuwe soort byvoeg (later), byvoorbeeld `PRODUCT`

1. Voeg `PRODUCT` by `ListingKind`.
2. Skep `ProductDetails` (1-tot-1) en voeg `product ProductDetails?` by `Listing`.
3. Saai die kategorieë vir `PRODUCT`.
4. Skryf `services/kinds/product.ts` (Zod-skema, passing en vertoning) en registreer dit.
5. Voeg die vorm-afdeling vir die detailvelde by. Alles anders (reaksies, kennisgewings en aanvaarding) werk reeds.

---

## 5. Besigheidsreëls (in `services/`)

### ✅ Gebou

- **Aanboording** (`onboarding.ts`): POPIA-toestemming + selnommer + kategorieë + werktipes + rybewys/vervoer in **een transaksie**; kategorieë moet aktief wees (`assertActiveJobCategories`). Daarna die `dp_onboarded`-koekie (waarde = `userId`) as **UX-wenk** vir die wag.
- **Profiel** (`profile.ts`): `getMyProfile` (parallelle navrae met `Promise.all`), `updateAbout` (naam via Better Auth), `updateInterests` (`syncForUser`: vee uit + `createMany`, met jare), `updateJobPreferences`, `setAvailable`, `setPublicProfile`, kwalifikasies (hoogstens 20, `deleteOwned`).
- **Publieke profiel** (`people.ts`): sigbaar as `popiaConsentAt ≠ null ∧ ¬blocked ∧ (publicProfile ∨ aangemeld)`, anders dieselfde 404. Besoekers sien "Jan B." (`displayName`), lede die volle naam. Nooit e-pos of foon nie. `noindex`.
- **Foto's** (`photos.ts`): hoogstens 1 MB, tipe aan die **magic bytes** (JPEG/PNG/WebP), sleutel `profiles/<userId>/<uuid>.<ext>`, ou foto word ná die DB-opdatering uitgevee (in die agtergrond), URL word ook op `User.image` gesit. Aflewering via `/foto/[...key]` (`immutable`, `nosniff`, net ons sleutelformaat). Voorkeur: eie foto → Google-foto → voorletters.
- **Tuis** (`home.ts`): status, profiel-voltooiingslys (5 punte) en die deelbare profiel-URL.
- **Aanmelding** (`auth.ts` + `auth.remote.ts`): verpligte e-posverifikasie (24 h), `onExistingUserSignUp` stuur 'n "jy het reeds 'n rekening"-e-pos (geen opsporingslek nie), herstel (1 h, `revokeSessionsOnPasswordReset`, "wagwoord verander"-e-pos), Google met `prompt: 'select_account'` en versleutelde tokens. Koersbeperking: aanmeld 5/15 min per e-pos + 20/15 min per IP; registreer 5/h per IP; wagwoord-vergeet 3/h per e-pos + 10/h per IP.
- **Agtergrondtake** (`background.ts`): `runInBackground(promise)` = `waitUntil` uit `cloudflare:workers`, met foutlogging.

### ⏳ Beplan

```ts
// services/kinds/types.ts
interface KindModule<Details> {
	kind: ListingKind;
	detailsSchema: z.ZodType<Details>; // validasie van die detailvelde
	createDetails(tx: Transaction, listingId: string, d: Details): Promise<void>;
	matchFilter(listing: ListingWithDetails): Prisma.UserWhereInput; // ekstra passing-reëls
	label: { singular: string; plural: string; respond: string }; // "Werk", "Ek is beskikbaar" …
}
// services/kinds/index.ts → export const kinds = { JOB: jobKind } satisfies Record<ListingKind, KindModule<any>>
// (JOB_TYPE_LABELS bestaan reeds in kinds/job.ts)
```

- **Passing** (`matching.ts`): die basis geld vir almal: `available ∧ ¬blocked ∧ popiaConsentAt ≠ null ∧ id ≠ ownerId ∧ Interest(categoryId)`. Daarby kom die soort se `matchFilter`. Vir `JOB`: 'n `JobTypePreference` vir `job.jobType`, en as `requiresDriversLicence`, dan `WorkerProfile.driversLicence`. (Sien `scripts/voorbeeld-passing.ts` vir die navraag in aksie.)
- **createListing**: die gebruiker moet opgestel wees en mag nie geblokkeer wees nie. Valideer die basis en die detailvelde, skep albei in een transaksie, en (Fase 4) stuur `notify(matching, NEW_LISTING)`.
- **respond** (Fase 3): die plasing is `OPEN`, die sperdatum is nie verby nie, en dit is nie die eie plasing nie.
- **acceptResponse** (Fase 3, transaksie): net die eienaar. As die aantal `ACCEPTED` = `capacity`, word die plasing `CLOSED` en die oorblywende `INTERESTED` → `DECLINED`.
- **cancelListing**: `CANCELLED`, en almal wat gereageer het, kry 'n kennisgewing.
- **Kontak-sigbaarheid** (Fase 3): `phone` net as daar 'n `ACCEPTED`-reaksie tussen die twee is.
- **Geskiedenis**: voltooide plasings waarvoor jy aanvaar is, op jou publieke profiel ("N voltooi").
- **Idempotensie** (`server/idempotency.ts`): `withRequestId(requestId, action, fn)`.
- **deleteAccount** (Fase 6, POPIA): `User` uitvee (cascade) **plus** die R2-foto's (die databasis weet nie van R2 nie).

---

## 6. Projekstruktuur

```
prisma/              schema.prisma  seed.ts  migrations/
prisma.config.mjs    Prisma CLI-konfigurasie
vite-plugins/        prisma-wasm.ts
scripts/             run.mjs (TS-skripte deur Vite)  voorbeeld-passing.ts
src/
  env.ts             omgewingsveranderlikes + Zod
  hooks.server.ts    Better Auth (sessie → locals), route-groep-wagte, handleError
  lib/
    index.ts         getInitials()
    client/          resize-image.ts                       (blaaier: mediavoorbereiding)
    components/      Avatar.svelte (geen groen nie!)  LegalPage.svelte
    schemas/         fields.ts  auth.ts  onboarding.ts  profile.ts   (gedeelde Zod)
    remote/          auth  categories  onboarding  profile  people  home   (*.remote.ts)
    server/
      auth.ts        Better Auth-instansie (lui, Proxy na prisma())
      background.ts  runInBackground (waitUntil)
      email.ts  emails.ts   sendEmail (Resend / log) + Afrikaanse sjablone
      guards.ts      requireUser()
      http.ts        safeRedirect() (teen open redirects)
      rate-limit.ts  withinLimit() + RULES
      storage.ts     photoBucket() (R2 via cloudflare:workers)
      db/            create.ts (createPrisma, Db-tipe)  client.ts (prisma())  index.ts (DB)
                     category  interest  job-type-preferences  profile  qualification
                     rate-limit  user  worker-profile
      services/      onboarding  profile  people  photos  home  kinds/job.ts
  routes/
    +layout.svelte   kopstrook, onderste balk (foon), laai-balk, voetstrook
    +page.svelte     voorblad
    (guest)/         teken-in  registreer (+ kyk-jou-e-pos)
    (onboarding)/    begin
    (app)/           tuis  profiel
    mense/[id]       publieke profiel
    foto/[...key]    R2-aflewering (+server.ts)
    e-pos-bevestig  wagwoord-vergeet  wagwoord-herstel  privaatheid  terme  +error.svelte
docs/PLAN.md
```

**Beplan:** `db/listing.ts`, `services/kinds/{types,index}.ts`, `services/{listings,matching}.ts`, `server/idempotency.ts`, `remote/listings.remote.ts`, `routes/(app)/plasings/*` (Fase 2); `responses`, `geleenthede/*` (Fase 3); `notifications`, `service-worker.ts` (Fase 4); `lib/offline/*` (Fase 5).

---

## 7. Remote functions

| Lêer                                   | ✅ Gebou                                                                                                                                                                                          | ⏳ Beplan                                                                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.remote.ts`                       | `getCurrentUser` (q), `signUp`, `signIn`, `signInWithGoogle`, `signOut`, `forgotPassword`, `resetPassword` (f)                                                                                    | —                                                                                                                                             |
| `categories.remote.ts`                 | `getCategories` (q)                                                                                                                                                                               | —                                                                                                                                             |
| `onboarding.remote.ts`                 | `getOnboardingOptions` (q), `completeOnboarding` (f)                                                                                                                                              | —                                                                                                                                             |
| `profile.remote.ts`                    | `getMyProfile` (q); `updateAbout`, `updateInterests`, `updateJobPreferences`, `addQualification`, `uploadPhoto` (f); `setAvailable`, `setPublicProfile`, `removeQualification`, `removePhoto` (c) | `deleteAccount` (Fase 6)                                                                                                                      |
| `people.remote.ts`                     | `getPublicProfile` (q, sonder aanmelding)                                                                                                                                                         | —                                                                                                                                             |
| `home.remote.ts`                       | `getHome` (q)                                                                                                                                                                                     | Uitbrei met geleenthede en plasings                                                                                                           |
| `listings.remote.ts`                   | —                                                                                                                                                                                                 | `getMyListings`, `getListingForOwner`, `estimateRecipients` (q); `createListing`, `updateListing` (f); `cancelListing`, `completeListing` (c) |
| `opportunities.remote.ts`              | —                                                                                                                                                                                                 | `getOpportunities`, `getOpportunity` (q)                                                                                                      |
| `responses.remote.ts`                  | —                                                                                                                                                                                                 | `respond` (f), `withdraw`, `acceptResponse` (c), `getMyResponses` (q)                                                                         |
| `notifications.remote.ts`              | —                                                                                                                                                                                                 | `getNotifications`, `getUnreadCount`, `getVapidPublicKey` (q); `markRead`, `savePushSubscription`, `removePushSubscription` (c)               |
| `reports.remote.ts`, `admin.remote.ts` | —                                                                                                                                                                                                 | Fase 6                                                                                                                                        |

(q = query, f = form, c = command.)

---

## 8. Webblaaie

### Uitleg en wagte (`hooks.server.ts`)

- `handle`: Better Auth-sessie → `locals.user`/`locals.session`, dan `guard()` (nie vir remote-versoeke nie), dan `svelteKitHandler`.
- **Route-groepe:**
  - `(guest)`: aangemeld → `/tuis`.
  - `(onboarding)`: nie aangemeld → `/teken-in?na=…`; reeds opgestel → `/tuis`.
  - `(app)`: nie aangemeld → `/teken-in?na=…`; nie opgestel → `/begin`.
  - Geen groep: publiek. `/` stuur aangemelde gebruikers na `/tuis`.
- **Navigasie:** kopstrook (avatar + naam, Teken uit) en op die foon 'n onderste balk. Tans **Tuis · Profiel**; _Geleenthede_, _My plasings_ en _Kennisgewings_ word bygevoeg soos hulle gebou word. Laai-balk via `navigating`. Voetstrook: Privaatheid · Terme · Kontak.

### Roetes

| Roete                                                                   | Stand     | Inhoud                                                                                                                                                        |
| ----------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                                     | ✅        | Voorblad: wat Dorpsplein is, drie stappe, Registreer, kategorieë                                                                                              |
| `/teken-in`, `/registreer`, `/registreer/kyk-jou-e-pos`                 | ✅        | E-pos + wagwoord of Google                                                                                                                                    |
| `/e-pos-bevestig`, `/wagwoord-vergeet`, `/wagwoord-herstel`             | ✅        | Verifikasie- en herstelvloei                                                                                                                                  |
| `/begin`                                                                | ✅        | Selnommer, opskrif, kategorieë, werktipes, rybewys/vervoer, POPIA (sluit "profiel is publiek" in)                                                             |
| `/tuis`                                                                 | ✅        | Groet, "Oop vir werk"-kaart met skakelaar, profiel-voltooiingslys, deel jou profiel, "Binnekort"                                                              |
| `/profiel`                                                              | ✅        | Foto · beskikbaar · publiek · oor my · belangstellings (+ jare) · werktipes · kwalifikasies (ankers `#foto`, `#oor-my`, `#belangstellings`, `#kwalifikasies`) |
| `/mense/[id]`                                                           | ✅        | Publieke profiel met groen "Oop vir werk"-kaart en kolletjie (groen = net beskikbaarheid)                                                                     |
| `/privaatheid`, `/terme`                                                | ✅ konsep | POPIA-beleid (Tertius van Niekerk, privaat@dorpsplein.co.za); terme (18+). Moet nog regsnagesien word                                                         |
| `/foto/[...key]`                                                        | ✅        | R2-aflewering                                                                                                                                                 |
| `/plasings`, `/plasings/nuut`, `/plasings/[id]`, `/plasings/[id]/wysig` | ⏳ Fase 2 | Eie plasings; vorm met regstreekse "± N mense sal kennisgewing kry"                                                                                           |
| `/geleenthede`, `/geleenthede/[id]`, `/my-reaksies`                     | ⏳ Fase 3 | Passende plasings; Ek is beskikbaar / Onttrek; kontak ná aanvaarding                                                                                          |
| `/kennisgewings`, `/installeer`                                         | ⏳ Fase 4 | Inkassie; PWA-installasiegids                                                                                                                                 |
| `/uitkassie`, `/vanlyn`                                                 | ⏳ Fase 5 | Wagtende/verwerpte aksies; vanlyn-terugval                                                                                                                    |
| `/admin/*`, `/geblokkeer`                                               | ⏳ Fase 6 | Statistiek, rapporte, gebruikers, kategorieë                                                                                                                  |

### Hoofvloei (teiken)

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

## 9. Vanlyn (Fase 5)

### Doel

Wanneer Dorpsplein as 'n app (PWA, later moontlik Capacitor) geïnstalleer is, moet dit sonder sein **bruikbaar** bly.

### Omvang

|                        | Vanlyn beskikbaar                                                                                                                                       | Hoe                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Lees**               | `/tuis`, `/geleenthede` (+ oopgemaakte besonderhede), `/plasings`, `/my-reaksies`, `/kennisgewings`, eie `/profiel`, besoekte `/mense/[id]`, kategorieë | Uit die kas, gemerk "laas bygewerk om …"                       |
| **Skryf (in die tou)** | Reageer / onttrek; skep, wysig, kanselleer en voltooi 'n plasing; aanvaar; wysig profiel en belangstellings; skakelaars; merk gelees; rapporteer        | Uitkassie → gestuur sodra daar sein is → die bediener valideer |
| **Net aanlyn**         | Registreer, eerste aanmelding, wagwoordherstel, Google, foto-oplaai, rekening-uitvee, push aanskakel, admin                                             | Knoppies gedeaktiveer: "Benodig 'n internetverbinding"         |

### Hoe dit werk

**Lees (service worker):** app-dop (`$service-worker`: `build`, `files`) by installasie in die kas; navigasie eers netwerk, dan kas (onbesoek → `/vanlyn`); remote **query**-`GET`s eers netwerk met 'n kort tydsperk, dan kas. `POST`s word nooit gekas nie.

**Skryf (uitkassie):** elke mutasie gaan deur `perform(action, input)` (`#lib/offline/outbox.ts`). Aanlyn: direk, met 'n nuwe `requestId`. Vanlyn: `{ requestId, action, input, createdAt }` in IndexedDB, en die UI wys "Wag om gestuur te word". `sync.ts` stuur die tou in volgorde by `online`, oopmaak of voorgrond. Sukses → verwyder + herlaai queries; verwerp → `/uitkassie` met die rede; netwerkfout → bly in die tou. `withRequestId()` maak herhalings veilig. Net 'n vaste lys aksies mag in die tou.

### Reëls vir die kliënt

- Die kliënt **wys** net en voorspel nie uitslae nie. Tougestaande aksies word as "wagtend" gemerk.
- Vorms gebruik dieselfde gedeelde Zod-skemas (`#lib/schemas`) vir onmiddellike terugvoer; die bediener valideer altyd weer.
- Kas en IndexedDB word by afmelding uitgevee.

### Toetse

Playwright met `context.setOffline(true)`; Vitest vir `withRequestId()`; konflik-toets (reageer vanlyn terwyl die plaser intussen sluit → verwerp → `/uitkassie`).

---

## 10. Hoe ons werk

- **Fondament en Fase 1:** jy het stap vir stap gebou met verduidelikings; vanaf stap 1.13 het jy soms gevra dat ek 'n stap self implementeer.
- **Patroon per stap:**
  1. Ek **vlees die stap uit** (wat, lêers, ontwerpbesluite, toetse) en vra besluite wat joune is.
  2. Jy sê "gaan voort" (of bou self).
  3. Ek bou, voer `check` + `lint` uit, en **toets in die ingeboude blaaier** teen `npm run dev` (en `npm run preview` vir Cloudflare-spesifieke goed), met tydelike toetsgebruikers wat ek daarna uitvee.
  4. Ek commit **nie**; jy hersien en commit.
- **Taal:** gesprek en UI in Afrikaans; kode-identifiseerders in Engels.

---

## 11. Fases

### ✅ Fase 0 — Fondament

SvelteKit 3 + TS + Tailwind; Neon (`main`/`dev`); Prisma 7 met die WASM-plugin; `Category` + saad; die DB-laag; eerste remote function + SSR; produksiebou in workerd; Cloudflare Workers met eie domein en `env.dev`.

### ✅ Fase 1 — Aanmelding en profiel

| Stap      | Wat                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------- |
| 1.1–1.3   | Better Auth 1.7.7, geheime per omgewing, auth-tabelle, `handle`-hook, `curl`-verkenning           |
| 1.4–1.5   | Registreer/aanmeld/afmeld met remote forms; eie koersbeperking                                    |
| 1.6–1.8   | Resend (`pos.dorpsplein.co.za`), e-posverifikasie, wagwoord vergeet/herstel                       |
| 1.9       | Google-aanmelding (aparte dev- en produksiekliënte)                                               |
| 1.10–1.12 | Profiel-tabelle, route-groep-wagte, `/begin` in een transaksie                                    |
| 1.13      | `/profiel` met verskeie vorms en single-flight                                                    |
| 1.14      | Kwalifikasies, publieke `/mense/[id]`, privaat-skakelaar, duidelike beskikbaarheid                |
| 1.15      | Profielfoto's in R2 (blaaier-verkleining, GPS weg); `waitUntil`/bindings via `cloudflare:workers` |
| 1.16      | `/tuis`, navigasie, voorblad, `/privaatheid`, `/terme`; vrystelling na produksie                  |

### ⏳ Fase 2 — Plasings en passing (volgende)

Voorgestelde stappe:

| Stap | Wat                                                                                                                                                |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1  | Skema: `ListingStatus`, `Listing`, `JobDetails`, `ProcessedRequest` + migrasie; repo `db/listing.ts`                                               |
| 2.2  | Soort-module: `kinds/types.ts`, `kinds/index.ts`, `kinds/job.ts` (`detailsSchema`, `createDetails`, `matchFilter`, etikette)                       |
| 2.3  | `matching.ts` + `estimateRecipients`; **eerste regte Vitest-toetse** (passing teen 'n Neon-toetstak, of met saaddata op `dev`)                     |
| 2.4  | `idempotency.ts` (`withRequestId`); mutasies aanvaar `requestId`                                                                                   |
| 2.5  | `services/listings.ts` (create/update/cancel/complete, eienaarskap) + `listings.remote.ts`                                                         |
| 2.6  | Bladsye `/plasings`, `/plasings/nuut` (regstreekse "± N mense"), `/plasings/[id]`, `/plasings/[id]/wysig`; nav-item _My plasings_; `/tuis` uitbrei |
| 2.7  | Saadskrip met ±10 toetsgebruikers; vrystelling (`migrate deploy` op `main`, dan `master`)                                                          |

Oop besluite vir Fase 2: wie mag plaas (enige opgestelde lid?), hoeveel oop plasings per persoon, of die plaser se volle naam/foto op die plasing verskyn, en of plasings publiek sigbaar is (soos profiele) of net vir lede.

✅ **Speel:** skep plasings met verskillende kategorieë en tipes en kyk hoe "± N mense" verander.

### ⏳ Fase 3 — Reaksies en aanvaarding

`Response`, `responses.ts`, `/geleenthede/*`, `/my-reaksies`, aanvaarding met sluit-logika, kontak-deling, profielgeskiedenis ("N voltooi"), nav-item _Geleenthede_.
✅ **Speel:** 'n plasing vir 2 mense kry 3 reaksies; aanvaar 2 → "Gesluit", die derde kry "afgewys". Playwright-toets.

### ⏳ Fase 4 — Kennisgewings

4a: `Notification` + `/kennisgewings` + teller. 4b: push (VAPID, service worker, manifest, `/installeer`).

### ⏳ Fase 5 — Vanlyn

Sien §9.

### ⏳ Fase 6 — Admin, veiligheid en afronding

`Report`, `/admin/*`, blokkering (`/geblokkeer`), **rekening-uitvee** (DB + R2), Cron Trigger om ou `RateLimit`- en `ProcessedRequest`-rye op te ruim, foutbladsye, toeganklikheid, e-posverandering (Better Auth `changeEmail`).

### ⏳ Fase 7 — Proeflopie

Regsnasiening van `/privaatheid` en `/terme`, outomatiese migrasies by ontplooiing, DMARC na `quarantine`, en 10–20 inwoners + 3–5 werkgewers vir 2 weke.

### Later

- **Nuwe soorte:** `SERVICE` (dienste/vakmanne), `PRODUCT`, `RENTAL`.
- Capacitor-omhulsel vir Play Store / App Store (as die PWA nie genoeg is nie).
- Graderings, e-pos as rugsteun vir push, kalender-beskikbaarheid, eerste-kom-eerste-maal, Ora-betalings.

---

## 12. Verifikasie

- `npm run check` en `npm run lint` ná elke stap.
- **Blaaiertoets** van elke stap teen `npm run dev` (tydelike toetsgebruikers via skripte in die scratchpad, daarna uitgevee); Cloudflare-spesifieke goed (bindings, `waitUntil`) ook in `npm run preview`.
- **Nog te doen:**
  - Vitest-eenheidstoetse: `getInitials`, `displayName`, `formatPhone`, `detectImageType`, `safeRedirect` (suiwer funksies), en `matching` vanaf Fase 2. Die voorbeeldtoets in `src/lib/vitest-examples/` kan weg.
  - `src/routes/page.svelte.e2e.ts` faal plaaslik, want die opskrif bevat die omgewing-kenteken ("Dorpsplein local"); gebruik `toContainText`.
  - Playwright e2e vir die hoofvloei vanaf Fase 3, en vanlyn-scenario's vanaf Fase 5.
- Elke fase word op `dev.dorpsplein.co.za` en op 'n foon getoets voor `master`.
