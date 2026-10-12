# Dorpsplein — Plan

> **Stand van sake (12 Oktober 2026):** Fase 0 (fondament), Fase 1 (aanmelding en profiele) en Fase 2 (plasings en passing) is klaar en in produksie op <https://dorpsplein.co.za>. Fase 3 (reaksies en aanvaarding) is ook klaar en in produksie. Die frontend word herontwerp; die blaaier- en Playwright-toetse vir Fase 3 is daarom oorgeslaan en volg ná die herontwerp (sien §11 → Fase 3 → Wat nog oor is). **Volgende: Fase 4, kennisgewings.**

## 1. Visie

**Dorpsplein** bring enige twee mense in Orania bymekaar wat met mekaar handel wil dryf: 'n aanstelling, 'n diens, 'n produk, enigiets.

Ons begin met **werk** (werkgewer ↔ werknemer), maar die datamodel en kode word van die begin af **algemeen** ontwerp. 'n Nuwe soort handel (dienste, produkte, verhuring …) moet later bygevoeg kan word sonder om die bestaande struktuur te herbou.

Dorpsplein moet ook **vanlyn werk**. As dit as 'n app op die foon geïnstalleer is, moet mense steeds kan sien wat hulle laas gesien het, en aksies kan uitvoer wat outomaties gestuur word sodra daar weer sein is. Sien **§9**.

### Die kernpatroon (geld vir álle soorte)

1. Mense stel hul **belangstellings** in: kategorieë waaroor hulle kennisgewings wil kry. ✅ _gebou_
2. Iemand skep 'n **plasing** (`Listing`) van 'n sekere **soort** (`kind`). ✅ _gebou_
3. Almal wie se belangstellings pas, kry 'n **kennisgewing**. ✅ _passing gebou_ · ⏳ _Fase 4 (kennisgewing)_
4. Hulle **reageer** (`Response`): "Ek stel belang / is beskikbaar". ✅ _gebou (Fase 3)_
5. Die plaser **aanvaar** een of meer reaksies. Kontakbesonderhede word gedeel en die plasing sluit wanneer dit vol is. ✅ _gebou (Fase 3)_

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
- **Mutasies word idempotent** vanaf Fase 2: elke plasing-`form`/`command` aanvaar 'n `requestId` (UUID van die kliënt), en die bediener verwerk dieselfde `requestId` nooit twee keer nie. Die bestaande profiel-mutasies stel net waardes en kry dit eers in Fase 5 (vanlyn).
- **Gedeelde UI-komponente, geen rou Tailwind vir knoppies, velde of kaarte nie.** Gebruik `Button` (ook as skakel met `href`), `Field` + `inputClass`, `Card`, `Badge`, `Alert` en `EmptyState` uit `#lib/components/`, en `buttonClass()` / `inputClass` uit `#lib/styles.ts`. 'n Nuwe voorkoms word 'n nuwe variant in `styles.ts`, nie eenmalige klasse nie.
- **Geen `alert()`, `confirm()` of `prompt()` nie.** Gebruik `confirmAction()` (`#lib/client/confirm.ts`): dit `mount()` `ConfirmModal.svelte` (bo-op die generiese `Modal.svelte` met 'n `children`-snippet wat `close()` kry) en `unmount()` dit weer. 'n Nuwe soort dialoog is 'n eie komponent bo-op `Modal`.
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

| Probleem                                                                                                                    | Oplossing                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma se `workerd`-kliënt laai sy enjin met `import('./x.wasm?module')`, wat Vite nie verstaan nie                         | `vite-plugins/prisma-wasm.ts`: in dev kompileer dit die WASM self; in die bou kopieer dit die WASM na die **bediener**-uitset (per Vite-omgewing) en laat Wrangler dit bundel   |
| Skripte in Node kan nie `.wasm?module` invoer nie                                                                           | Voer skripte deur Vite uit: `node --env-file=.env scripts/run.mjs <lêer.ts>` (gebruik `createPrisma` uit `db/create.ts`, nie `prisma()` nie)                                    |
| `prisma.config.ts` kan nie SvelteKit 3 se `$app/tsconfig` oplos nie                                                         | `prisma.config.mjs`; voer `svelte-kit sync` uit voor `prisma generate` (`prepare` doen dit)                                                                                     |
| Prisma 7 se `migrate dev` voer nie `prisma generate` uit nie                                                                | `db:migrate` = `prisma migrate dev && prisma generate`                                                                                                                          |
| `npm run db:migrate -- --name x` vra steeds vir 'n naam en **hang** sonder terminale (en hou die migrasie-slot op Neon vas) | `npx prisma migrate dev --name x --create-only`, lees die SQL, dan `npx prisma migrate dev`                                                                                     |
| npm 11 blokkeer installeer-skripte (`allowScripts`)                                                                         | Keur net esbuild, prisma, @prisma/engines en workerd goed met `npm approve-scripts`. Doen dit weer ná opgraderings                                                              |
| **adapter-cloudflare 8 gee nie `event.platform` deur nie** (dev én produksie)                                               | Bindings en `waitUntil`: `import { env, waitUntil } from 'cloudflare:workers'` (die adapter boots dit in dev na). `App.Platform` in `app.d.ts` word nie gebruik nie             |
| 'n `pending`-snippet in `<svelte:boundary>` laat SSR die data oorslaan                                                      | Gebruik geen `pending` vir data wat die bediener moet render nie; die laai-balk in die uitleg wys navigasie                                                                     |
| Een Prisma-kliënt mag nie oor Worker-versoeke heen hergebruik word nie                                                      | Een kliënt per versoek (`WeakMap` op `getRequestEvent()`); Better Auth kry 'n `Proxy` wat elke oproep na die huidige versoek se kliënt stuur                                    |
| Better Auth se CLI kan `auth.ts` nie laai nie (`$app/*`-invoere)                                                            | Die auth-tabelle is met die hand uit `node_modules/@better-auth/core/dist/db/get-tables.mjs` vertaal. Kontroleer dit weer by opgraderings of nuwe Better Auth-plugins           |
| Better Auth se `peerDependencies` verwag SvelteKit 2                                                                        | `overrides` in `package.json`                                                                                                                                                   |
| `auth.api.*` vanaf die bediener slaan Better Auth se router oor, dus ook sy **koersbeperking**                              | Eie koersbeperking (`server/rate-limit.ts`, atomiese SQL op `RateLimit` met sleutels `app:…`) in die auth-vorms. SvelteKit self kontroleer `Origin` vir remote functions        |
| `svelteKitHandler` hanteer `/api/auth/*` net as die oorsprong presies `BETTER_AUTH_URL` is                                  | 'n Onverklaarbare 404 op `/api/auth/*` = verkeerde URL of poort                                                                                                                 |
| `wrangler dev` met `routes` stuur versoeke as `https://dorpsplein.co.za/…`                                                  | `preview` = `wrangler dev --port 4173 --local-upstream localhost:4173 --upstream-protocol http`                                                                                 |
| `cookieCache`: sessie-data is tot 5 min oud                                                                                 | Na 'n naam- of foto-verandering: deur `auth.api.updateUser` gaan (werk die koekie by)                                                                                           |
| Workers Free: 10 ms CPU per versoek                                                                                         | Geen beeldverwerking op die bediener nie (foto's word in die blaaier verklein)                                                                                                  |
| Kliënt-navigasie sonder bediener-`load` slaan die wag in `hooks.server.ts` oor                                              | 'n Leë `load` in `+page.server.ts` van `/` en in `+layout.server.ts` van elke groep (`(app)`, `(guest)`, `(onboarding)`)                                                        |
| Remote forms weier `z.coerce` (die invoertipe is `unknown`)                                                                 | Gebruik `z.string().regex(…).transform(Number).pipe(z.number()…)`; datums as `z.string()` met 'n eie `transform`                                                                |
| Prisma se interaktiewe transaksie het 'n verstek-tydsgrens van 5 s; Neon is ±170 ms per navraag                             | Hou transaksies kort. Sewe gelyktydige pogings vir een gebruiker onder die advisory lock oorskry dit (toetse gebruik hoogstens twee)                                            |
| `prisma migrate dev` weier om 'n migrasie wat data uitvee nie-interaktief te skep                                           | Skryf die migrasie met die hand (`migration.sql`) en voer `npx prisma migrate dev` uit; `npx prisma generate` daarna                                                            |
| Migrasie-name sorteer op datum; `remove_drivers_licence` en `remove_worker_profile` is `20261013…` (vooruit gedateer)       | 'n Volgende migrasie moet 'n later datum as `20261013090000` kry (wag tot ná 13 Oktober 09:00, of hernoem sy gids), anders sorteer dit **voor** dié twee                        |
| Die terminaal gebruik Node 18; Prisma en Vite verwag die `.nvmrc`-weergawe (24)                                             | `source ~/.nvm/nvm.sh && nvm use` voor `npm`/`npx`                                                                                                                              |
| Neon `dev` is soms stadig (>500 ms per navraag): databasistoetse oorskry Prisma se 5 s-transaksietydsgrens                  | `createPrisma(url, { transactionTimeout: 20_000 })` in die toets; produksie hou 5 s. Hou stappe in 'n transaksie min (elke navraag ±170 ms vanaf SA)                            |
| Vitest laai nie `.env` nie                                                                                                  | `src/test/setup.ts` (`process.loadEnvFile`); databasistoetse is `describe.skipIf(!process.env.DATABASE_URL)` en loop teen Neon `dev` met `test<nn>-`-id's wat hulle self uitvee |
| Skripte wat `db/client.ts` invoer (`$app/server`) loop nie met `scripts/run.mjs` nie                                        | Gebruik net `createPrisma` in skripte; services en repos neem 'n laaste `db`/`client`-parameter, sodat toetse hul eie kliënt kan gee                                            |
| Die blaaier hou soms 'n verouderde Vite-module in die kas (vreemde "x is not defined")                                      | Harde herlaai (Ctrl+Shift+R); dit is 'n dev-artefak, nie 'n kodefout nie                                                                                                        |
| iOS/Safari ondersteun nie _Background Sync_ nie (Fase 5)                                                                    | Die uitkassie word gestuur by `online`, wanneer die app oopmaak en wanneer dit na die voorgrond kom                                                                             |
| Die blaaier kan IndexedDB en die kas uitvee (Fase 5)                                                                        | `navigator.storage.persist()`; die app moet met 'n leë kas kan begin                                                                                                            |
| SSR-bladsye laai nie vanlyn nie (Fase 5)                                                                                    | Service worker: eers netwerk, dan kas vir besoekte bladsye, met `/vanlyn` as terugval                                                                                           |
| Privaat data bly in die kas op 'n gedeelde foon (Fase 5)                                                                    | By afmelding word die kas en IndexedDB uitgevee                                                                                                                                 |

---

## 4. Datamodel (benadering A: algemene tabelle + detailtabelle per soort)

### Waarom detailtabelle?

- **Algemene tabelle** (`Listing`, `Response`, `Interest`) hou alles wat vir álle soorte geld.
- **Detailtabelle** (`JobDetails`, later `ServiceDetails` en `ProductDetails`) is 1-tot-1 met `Listing` en hou die soort-spesifieke velde.
- Voordele: volledige TypeScript-tipes, die databasis dwing reëls af, gewone `JOIN`s en indekse vir filters, en maklike verslae.
- Prys: 'n nuwe soort vereis 'n nuwe tabel en migrasie.

### ✅ Gebou (migrasies `init`, `auth`, `profile`, `public_profile`, `listings`, `remove_drivers_licence`, `remove_worker_profile`, `responses`)

Sien `prisma/schema.prisma` vir die presiese velde. Opsomming:

| Model                                        | Doel                                                                                                                                                                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ListingKind` (enum)                         | `JOB`                                                                                                                                                                                                                                                                           |
| `Category`                                   | Kategorieë per soort (`@@unique([kind, name])`); word nooit uitgevee nie, net `active = false`                                                                                                                                                                                  |
| `User`, `Session`, `Account`, `Verification` | Better Auth. `User.image` = Google-foto **of** ons eie foto-URL (gesinchroniseer by oplaai)                                                                                                                                                                                     |
| `RateLimit`                                  | Better Auth se koersbeperking (`storage: 'database'`) én ons eie (`app:`-sleutels; `lastRequest` = begin van die venster)                                                                                                                                                       |
| `Profile`                                    | 1-tot-1 met `User`: `headline`, `bio`, `photoKey` (R2), `phone` (E.164, `+27…`), `available`, `publicProfile`, `isAdmin`, `blocked`, `popiaConsentAt` (null = `/begin` nie voltooi nie)                                                                                         |
| `Qualification`                              | Naam, uitreiker, jaar; hoogstens 20 per persoon                                                                                                                                                                                                                                 |
| `Interest`                                   | `@@id([userId, categoryId])` + `yearsExperience`; `@@index([categoryId])` vir passing; `Category` is `RESTRICT`                                                                                                                                                                 |
| `JobType` (enum)                             | `PERMANENT`, `PART_TIME`, `ODD_JOB`, `SEASONAL`                                                                                                                                                                                                                                 |
| `JobTypePreference`                          | `@@id([userId, jobType])`, `@@index([jobType])`                                                                                                                                                                                                                                 |
| `ListingStatus` (enum)                       | `OPEN`, `CLOSED` (genoeg reaksies aanvaar), `COMPLETED`, `CANCELLED`                                                                                                                                                                                                            |
| `Listing`                                    | Algemene plasing: `kind`, `ownerId`, `categoryId` (`RESTRICT`), `title`, `description`, `price` (vrye teks), `capacity` (`CHECK >= 1`), `location`, `startsAt`/`endsAt`/`closesAt`, `status`. Indekse: `[status, kind, categoryId]`, `[status, createdAt]`, `[ownerId, status]` |
| `JobDetails`                                 | 1-tot-1 met `Listing` (`kind = JOB`): `jobType`. `@@index([jobType])`                                                                                                                                                                                                           |
| `ResponseStatus` (enum)                      | `INTERESTED` (wag), `WITHDRAWN`, `ACCEPTED`, `DECLINED`                                                                                                                                                                                                                         |
| `Response`                                   | `listingId`, `responderId` (`CASCADE`), `status`, `note` (≤300), `@@unique([listingId, responderId])`, indekse `[responderId, status]` en `[listingId, status]`. Migrasie `20261013100000_responses` (gedateer ná die twee vooruit-gedateerde)                                  |
| `ProcessedRequest`                           | Idempotensie: `requestId` (PK), `userId`, `action`, `result` (JSON), `createdAt`                                                                                                                                                                                                |

> **Verwyder in Fase 2:** `WorkerProfile` (rybewys en eie vervoer) is heeltemal uit die stelsel. 'n Plaser noem 'n vereiste soos 'n rybewys in die beskrywing. Die migrasies het die bestaande waardes uitgevee.

### ⏳ Beplan

```prisma
enum NotificationType { NEW_LISTING NEW_RESPONSE RESPONSE_ACCEPTED RESPONSE_DECLINED LISTING_CANCELLED }
enum ReportStatus     { OPEN RESOLVED DISMISSED }

// Fase 4
model PushSubscription { id, userId, endpoint @unique, p256dh, auth, device?, createdAt }
model Notification     { id, recipientId, type, listingId?, title, body?, url, readAt?, createdAt; @@index([recipientId, readAt]) }

// Fase 6
model Report           { id, reporterId, reportedUserId?, listingId?, reason, status, handledById?, createdAt }
```

### Verhoudings

```
User 1─1 Profile · 1─* Qualification                                    ✅
User *─* Category            via Interest (+ jare ervaring)              ✅
User 1─* JobTypePreference                                               ✅
User (plaser) 1─* Listing *─1 Category                                   ✅
Listing 1─0..1 JobDetails     (later ServiceDetails, ProductDetails)     ✅
Listing 1─* Response *─1 User (reageerder)                               ✅
User 1─* ProcessedRequest                                            ✅
User 1─* PushSubscription, Notification                                  ⏳ Fase 4
Report → User en/of Listing                                              ⏳ Fase 6
```

### 'n Nuwe soort byvoeg (later), byvoorbeeld `PRODUCT`

1. Voeg `PRODUCT` by `ListingKind`.
2. Skep `ProductDetails` (1-tot-1) en voeg `product ProductDetails?` by `Listing`.
3. Saai die kategorieë vir `PRODUCT`.
4. Skryf `services/kinds/product.ts` (Zod-skema in `schemas/listing.ts`, `createDetails`, `updateDetails`, `matchFilter`, etikette) en registreer dit in `kinds/index.ts` (TypeScript gee 'n fout totdat dit gedoen is).
5. Maak `MatchInput.details` 'n diskriminerende unie, en vervang `include: { job: true }` in `db/listing.ts` en die `JOB`-spesifieke kode in `services/listings.ts` (`split`, `createListing`, `updateListing`, `getListing`) met 'n soort-oorsig.
6. Voeg die vorm-afdeling vir die detailvelde by. Alles anders (reaksies, kennisgewings en aanvaarding) werk reeds.

---

## 5. Besigheidsreëls (in `services/`)

### ✅ Gebou

- **Aanboording** (`onboarding.ts`): twee vorms, want 'n werker en 'n plaser het verskillende behoeftes.
  - **Werker** (`completeWorkerOnboarding`): POPIA-toestemming + selnommer + opskrif + kategorieë + werktipes in **een transaksie**; kategorieë moet aktief wees (`assertActiveJobCategories`).
  - **Plaser** (`completePosterOnboarding`): net selnommer + POPIA-toestemming; `available` is `false`, want 'n plaser wil geen werk-kennisgewings kry nie. Daarna gaan hy na `/plasings/nuut`.
  - Die keuse kom van die voorblad (`/registreer?as=werker|plaser`) en word in die koekie `dp_intent` onthou (`server/intent.ts`), want dit moet registrasie, e-posverifikasie en Google oorleef. Dit is 'n UX-wenk vir `/begin`, nie data nie; dit word uitgevee sodra aanboording klaar is.
  - Daarna die `dp_onboarded`-koekie (waarde = `userId`) as **UX-wenk** vir die wag.
- **Profiel** (`profile.ts`): `getMyProfile` (parallelle navrae met `Promise.all`), `updateAbout` (naam via Better Auth), `updateInterests` (`syncForUser`: vee uit + `createMany`, met jare), `updateJobPreferences`, `setAvailable`, `setPublicProfile`, kwalifikasies (hoogstens 20, `deleteOwned`).
- **Publieke profiel** (`people.ts`): sigbaar as `popiaConsentAt ≠ null ∧ ¬blocked ∧ (publicProfile ∨ aangemeld)`, anders dieselfde 404. Besoekers sien "Jan B." (`displayName`), lede die volle naam. Nooit e-pos of foon nie. `noindex`.
- **Foto's** (`photos.ts`): hoogstens 1 MB, tipe aan die **magic bytes** (JPEG/PNG/WebP), sleutel `profiles/<userId>/<uuid>.<ext>`, ou foto word ná die DB-opdatering uitgevee (in die agtergrond), URL word ook op `User.image` gesit. Aflewering via `/foto/[...key]` (`immutable`, `nosniff`, net ons sleutelformaat). Voorkeur: eie foto → Google-foto → voorletters.
- **Tuis** (`home.ts`): status, profiel-voltooiingslys (5 punte), die deelbare profiel-URL en die aantal oop plasings. 'n **Werker** (`isWorker` = het belangstellings) sien die "Oop vir werk"-kaart, die lys en die deel-kaart; 'n **plaser** sien 'n kaart "Wil jy ook werk kry?".
- **Aanmelding** (`auth.ts` + `auth.remote.ts`): verpligte e-posverifikasie (24 h), `onExistingUserSignUp` stuur 'n "jy het reeds 'n rekening"-e-pos (geen opsporingslek nie), herstel (1 h, `revokeSessionsOnPasswordReset`, "wagwoord verander"-e-pos), Google met `prompt: 'select_account'` en versleutelde tokens. Koersbeperking: aanmeld 5/15 min per e-pos + 20/15 min per IP; registreer 5/h per IP; wagwoord-vergeet 3/h per e-pos + 10/h per IP.
- **Agtergrondtake** (`background.ts`): `runInBackground(promise)` = `waitUntil` uit `cloudflare:workers`, met foutlogging.
- **Soort-modules** (`services/kinds/`): `KindModule<Details>` met `detailsSchema`, `createDetails`, `updateDetails`, `matchFilter` en `label`. `kinds = { JOB: jobKind } satisfies Record<ListingKind, KindModule<any>>`: 'n nuwe `ListingKind` gee 'n kompileerfout totdat sy module bestaan. `JOB_TYPE_LABELS` bly in `kinds/job.ts`. Die Zod-skemas (`schemas/listing.ts`) is gedeel met die vorm.
- **Passing** (`matching.ts`): `buildMatchWhere` = `AND [ basis, soort se matchFilter ]`. Basis: `available ∧ ¬blocked ∧ popiaConsentAt ≠ null ∧ id ≠ ownerId ∧ Interest(categoryId)`. Vir `JOB`: 'n `JobTypePreference` vir `job.jobType`. `estimateRecipients` tel dit. (Sien `scripts/voorbeeld-passing.ts` vir die navraag in aksie.)
- **Plasings** (`listings.ts`): `saveListing` (skep of wysig), `cancelListing`, `completeListing`, `estimate`, `getMyListings`, `getListing`, `getListingForEdit`.
  - Net opgestelde, ongeblokkeerde lede mag plaas (gelees uit die databasis, nie die koekie nie). Hoogstens `MAX_OPEN_LISTINGS = 5` oop plasings per persoon, afgedwing onder 'n `pg_advisory_xact_lock` per eienaar, sodat gelyktydige versoeke dit nie omseil nie.
  - Wysig, kanselleer en voltooi: `where { id, ownerId, status }` (IDOR en dubbele oorgange). 404 as dit nie joune is nie, 409 as dit nie meer oop is nie.
  - **Sigbaarheid:** net aangemelde lede. Die eienaar sien alle statusse; ander sien net `OPEN`-plasings van 'n plaser wat nie geblokkeer is nie, dieselfde 404 vir al die res. Die plaser se **volle naam en foto** wys op die plasing; nooit sy e-pos of foon nie.
  - **Datums:** `<input type="date">`, gestoor as Orania-tyd (`+02:00`, geen somertyd). "Reageer voor" duur tot 23:59:59 van daardie dag (`#lib/dates.ts`).
- **Idempotensie** (`server/idempotency.ts`): `withRequestId(userId, requestId, action, fn)` open 'n transaksie, eis die `requestId` (`createMany` met `skipDuplicates`), voer `fn(tx)` uit en stoor die antwoord. 'n Herhaling kry die gestoorde antwoord (`replayed: true`); 'n fout rol die claim terug; dieselfde id vir 'n ander gebruiker of aksie gee 409. Alle skryfwerk in `fn` moet via `tx` gaan.

- **Reaksies** (`responses.ts`, almal in `withRequestId`, onder `DB.response.lockListing` (advisory lock per plasing) sodat gelyktydige aanvaardings nie `capacity` oorskry nie):
  - **`respond`:** opgestelde, ongeblokkeerde lid (`assertActiveMember` in `members.ts`); plasing `OPEN`; sperdatum nie verby nie; nie die eie plasing nie; plaser nie geblokkeer nie. `WITHDRAWN` word weer `INTERESTED`; `INTERESTED`/`ACCEPTED`/`DECLINED` gee 409 (afgewys kan nie weer reageer nie).
  - **`withdraw`:** net eie reaksie; `INTERESTED|ACCEPTED → WITHDRAWN` terwyl die plasing `OPEN` of `CLOSED` is. Onttrek 'n **aanvaarde** reaksie van 'n `CLOSED` plasing, gaan dit weer `OPEN` (wie afgewys is, bly afgewys).
  - **`acceptResponse` / `declineResponse`:** net die eienaar (404 anders), plasing `OPEN`, reaksie `INTERESTED`. Sodra `ACCEPTED` = `capacity`: plasing → `CLOSED` en die res van `INTERESTED` → `DECLINED`.
  - **Kontak-sigbaarheid:** selnommer word net gelees (`DB.profile.findPhones`) vir die ander party van 'n `ACCEPTED`-reaksie, en gee `toContact()` (vertoonformaat, `tel:` en `https://wa.me/…`). Die reaksielyste (`DB.response.listForListing`/`listByResponder`) lees self nooit 'n foon nie.
  - **Wysig-slot** (`listings.ts` `assertEditable`): ná die eerste nie-onttrekte reaksie is kategorie en werktipe gesluit (409). **Kapasiteit mag wissel, maar moet groter bly as die aantal aanvaardes** (400); dit is 'n bewuste afwyking van die oorspronklike plan, wat kapasiteit ook wou sluit.
  - **Status-oorgange:** voltooi en kanselleer werk vanaf `OPEN` én `CLOSED`.
  - **`getListing`** gee ook `acceptedCount`, `responseCount` (eienaar), `canRespond`, `myResponse` (met die plaser se kontak as aanvaar). 'n Nie-eienaar sien 'n nie-oop plasing net as hy self daarop gereageer het.
- **Geleenthede** (`opportunities.ts`): oop plasings van ander (geen geblokkeerde plasers, verstreke sperdatums, of plasings waarop jy reeds gereageer het, behalwe onttrek). `matches` = kategorie in jou belangstellings én `kinds[kind].matchesPreferences(details, prefs)` (dieselfde reël as `matchFilter`, in die geheue; `job.spec.ts` toets dit). Pas eerste, dan nuutste. Hoogstens 100.
- **Tuis** kry `waitingResponses` (reaksies wat op my besluit wag) en `myLiveResponses`. **Publieke profiel** kry `completedCount` ("N voltooi": aanvaarde reaksies op voltooide plasings, as reageerder en as plaser; net 'n getal).

### ⏳ Beplan

- **Fase 4:** `createListing` stuur `notify(matching, NEW_LISTING)`, net as `replayed` onwaar is.
- **cancelListing/vol/aanvaar** (Fase 4): reageerders kry 'n kennisgewing (nuwe reaksie, aanvaar, afgewys, plasing gekanselleer).
- **deleteAccount** (Fase 6, POPIA): `User` uitvee (cascade) **plus** die R2-foto's (die databasis weet nie van R2 nie).

---

## 6. Projekstruktuur

```
prisma/              schema.prisma  migrations/
prisma.config.mjs    Prisma CLI-konfigurasie
vite-plugins/        prisma-wasm.ts
scripts/             run.mjs (TS-skripte deur Vite)  voorbeeld-passing.ts
prisma/              seed.ts (kategorieë)  seed-people.ts (toetsmense en -plasings, net dev)
src/
  env.ts             omgewingsveranderlikes + Zod
  hooks.server.ts    Better Auth (sessie → locals), route-groep-wagte, handleError
  lib/
    index.ts         getInitials()
    dates.ts         formatDate / toDateInput (Orania-tyd)
    client/          resize-image.ts  confirm.ts           (blaaier: mediavoorbereiding en confirmAction)
    components/      Avatar  LegalPage  ListingForm (gesluit-velde ná reaksies)
                     Button  Field  Card  Badge  Alert  EmptyState  ResponseBadge   (gedeelde UI; sien §2)
                     Modal  ConfirmModal                                             (dialoë; sien §2)
                     ListingView (een plasing, vir eienaar én ander)  ListingResponses (eienaar se reaksielys)  ContactCard
    styles.ts        buttonClass(), inputClass
    schemas/         fields.ts  auth.ts  onboarding.ts  profile.ts  listing.ts  response.ts   (gedeelde Zod; *.spec.ts langsaan)
    remote/          auth  categories  onboarding  profile  people  home  listings  responses  opportunities   (*.remote.ts)
    server/
      auth.ts        Better Auth-instansie (lui, Proxy na prisma())
      background.ts  runInBackground (waitUntil)
      email.ts  emails.ts   sendEmail (Resend / log) + Afrikaanse sjablone
      guards.ts      requireUser()
      idempotency.ts withRequestId()
      intent.ts      dp_intent-koekie (werker/plaser)
      http.ts        safeRedirect() (teen open redirects)
      rate-limit.ts  withinLimit() + RULES
      storage.ts     photoBucket() (R2 via cloudflare:workers)
      db/            create.ts (createPrisma, Db-tipe)  client.ts (prisma())  index.ts (DB)
                     category  interest  job-type-preferences  listing  processed-request
                     profile  qualification  rate-limit  response  user
      services/      onboarding  profile  people  photos  home  listings  matching
                     members  responses  opportunities
                     kinds/{types,index,job}.ts
  routes/
    +layout.svelte   kopstrook, onderste balk (foon), laai-balk, voetstrook
    +page.svelte     voorblad
    (guest)/         teken-in  registreer (+ kyk-jou-e-pos)
    (onboarding)/    begin  begin/werker  begin/plaser
    (app)/           tuis  profiel  plasings  plasings/nuut  plasings/[id]  plasings/[id]/wysig
                     geleenthede  geleenthede/[id]  my-reaksies
    mense/[id]       publieke profiel
    foto/[...key]    R2-aflewering (+server.ts)
    e-pos-bevestig  wagwoord-vergeet  wagwoord-herstel  privaatheid  terme  +error.svelte
docs/PLAN.md
```

**Beplan:** `notifications`, `service-worker.ts` (Fase 4); `lib/offline/*` (Fase 5).

---

## 7. Remote functions

| Lêer                                   | ✅ Gebou                                                                                                                                                                                          | ⏳ Beplan                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `auth.remote.ts`                       | `getCurrentUser` (q), `signUp`, `signIn`, `signInWithGoogle`, `signOut`, `forgotPassword`, `resetPassword` (f)                                                                                    | —                                                                                                                               |
| `categories.remote.ts`                 | `getCategories` (q)                                                                                                                                                                               | —                                                                                                                               |
| `onboarding.remote.ts`                 | `getOnboardingOptions` (q), `completeWorkerOnboarding`, `completePosterOnboarding` (f)                                                                                                            | —                                                                                                                               |
| `profile.remote.ts`                    | `getMyProfile` (q); `updateAbout`, `updateInterests`, `updateJobPreferences`, `addQualification`, `uploadPhoto` (f); `setAvailable`, `setPublicProfile`, `removeQualification`, `removePhoto` (c) | `deleteAccount` (Fase 6)                                                                                                        |
| `people.remote.ts`                     | `getPublicProfile` (q, sonder aanmelding)                                                                                                                                                         | —                                                                                                                               |
| `home.remote.ts`                       | `getHome` (q; ook `waitingResponses`, `myLiveResponses`)                                                                                                                                          | —                                                                                                                               |
| `listings.remote.ts`                   | `getMyListings`, `getListing`, `getListingForEdit`, `estimateRecipients` (q); `saveListing` (f, skep of wysig); `cancelListing`, `completeListing` (c)                                            | —                                                                                                                               |
| `opportunities.remote.ts`              | `getOpportunities` (q); 'n enkele plasing is `getListing`                                                                                                                                         | —                                                                                                                               |
| `responses.remote.ts`                  | `getMyResponses`, `getResponsesForListing` (q); `respond` (f; 400 en 409 word `invalid()`); `withdraw`, `acceptResponse`, `declineResponse` (c; verfris `getListing` en die lys op die bediener)  | —                                                                                                                               |
| `notifications.remote.ts`              | —                                                                                                                                                                                                 | `getNotifications`, `getUnreadCount`, `getVapidPublicKey` (q); `markRead`, `savePushSubscription`, `removePushSubscription` (c) |
| `reports.remote.ts`, `admin.remote.ts` | —                                                                                                                                                                                                 | Fase 6                                                                                                                          |

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
  - **Kliënt-navigasie:** sonder 'n bediener-`load` vra die kliënt die bediener nie en loop die wag nie. Daarom het `/` (`+page.server.ts`) en elke groep (`+layout.server.ts`) 'n leë `load`.
- **Navigasie:** kopstrook (avatar + naam, Teken uit) en op die foon 'n onderste balk. Tans **Tuis · Geleenthede · Plasings · Profiel**; _Kennisgewings_ kom in Fase 4. Vier items op die foonbalk is dalk benoud; kyk by die herontwerp. Laai-balk via `navigating`. Voetstrook: Privaatheid · Terme · Kontak.

### Roetes

| Roete                                                                   | Stand     | Inhoud                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                                     | ✅        | Voorblad: wat Dorpsplein is, twee keuses (_Ek soek werk_ / _Ek soek mense_), drie stappe, kategorieë                                                                                                                              |
| `/teken-in`, `/registreer`, `/registreer/kyk-jou-e-pos`                 | ✅        | E-pos + wagwoord of Google                                                                                                                                                                                                        |
| `/e-pos-bevestig`, `/wagwoord-vergeet`, `/wagwoord-herstel`             | ✅        | Verifikasie- en herstelvloei                                                                                                                                                                                                      |
| `/begin`, `/begin/werker`, `/begin/plaser`                              | ✅        | Keuse (of reguit na die vorm). Werker: selnommer, opskrif, kategorieë, werktipes, POPIA. Plaser: selnommer en POPIA                                                                                                               |
| `/tuis`                                                                 | ✅        | Groet; werker: "Oop vir werk"-kaart met skakelaar, profiel-voltooiingslys, deel jou profiel; plaser: "Wil jy ook werk kry?"; "Jou plasings"                                                                                       |
| `/profiel`                                                              | ✅        | Foto · beskikbaar · publiek · oor my · belangstellings (+ jare) · werktipes · kwalifikasies (ankers `#foto`, `#oor-my`, `#belangstellings`, `#kwalifikasies`)                                                                     |
| `/mense/[id]`                                                           | ✅        | Publieke profiel; groen "Oop vir werk"-kaart en kolletjie net vir werkers wat beskikbaar is (groen = net beskikbaarheid)                                                                                                          |
| `/privaatheid`, `/terme`                                                | ✅ konsep | POPIA-beleid (Tertius van Niekerk, privaat@dorpsplein.co.za); terme (18+). Moet nog regsnagesien word                                                                                                                             |
| `/foto/[...key]`                                                        | ✅        | R2-aflewering                                                                                                                                                                                                                     |
| `/plasings`, `/plasings/nuut`, `/plasings/[id]`, `/plasings/[id]/wysig` | ✅        | My plasings (oop en afgehandel); vorm met regstreekse "± N mense sal kennisgewing kry"; `/plasings/[id]` vir enige aangemelde lid (eienaar kry Wysig, Voltooi, Kanselleer)                                                        |
| `/geleenthede`, `/geleenthede/[id]`, `/my-reaksies`                     | ✅        | Oop plasings, "Pas by jou" eerste; Ek is beskikbaar / Onttrek; kontak (bel en WhatsApp) ná aanvaarding. `/geleenthede/[id]` en `/plasings/[id]` gebruik dieselfde `ListingView`; die eienaar kry Aanvaar/Wys af en die reaksielys |
| `/kennisgewings`, `/installeer`                                         | ⏳ Fase 4 | Inkassie; PWA-installasiegids                                                                                                                                                                                                     |
| `/uitkassie`, `/vanlyn`                                                 | ⏳ Fase 5 | Wagtende/verwerpte aksies; vanlyn-terugval                                                                                                                                                                                        |
| `/admin/*`, `/geblokkeer`                                               | ⏳ Fase 6 | Statistiek, rapporte, gebruikers, kategorieë                                                                                                                                                                                      |

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
- **Node:** loop `source ~/.nvm/nvm.sh && nvm use` voor `npm`/`npx` (die terminaal se verstek is Node 18).

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

### ✅ Fase 2 — Plasings en passing

| Stap | Wat                                                                                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1  | Skema: `ListingStatus`, `Listing`, `JobDetails`, `ProcessedRequest` + migrasie `listings` (met `CHECK capacity >= 1`); repo `db/listing.ts`                                                 |
| 2.2  | Soort-module: `kinds/types.ts`, `kinds/index.ts`, `kinds/job.ts`; gedeelde Zod-skemas in `schemas/listing.ts`; eerste Vitest-toetse                                                         |
| 2.3  | `matching.ts` (`buildMatchWhere`, `estimateRecipients`); Vitest teen Neon `dev` met `test23-`-mense; `src/test/setup.ts` laai `.env`                                                        |
| 2.4  | `idempotency.ts` (`withRequestId`) in een transaksie; `ProcessedRequest`-repo; toetse vir herhaling, terugrol, gelyktydigheid en 409                                                        |
| 2.5  | `services/listings.ts` (skep, wysig, kanselleer, voltooi) + `listings.remote.ts`; limiet van 5 oop plasings onder 'n advisory lock; toetse                                                  |
| 2.6  | Bladsye `/plasings`, `/plasings/nuut` (regstreekse "± N mense"), `/plasings/[id]`, `/plasings/[id]/wysig`; nav-item _Plasings_; `/tuis` uitgebrei                                           |
| 2.7  | Saadskrip `prisma/seed-people.ts` (`npm run db:seed:people`); vrystelling (`migrate deploy` op `main`, dan `dev` → `master`)                                                                |
| 2.8  | Aanpassings ná bou: rybewys en eie vervoer weg (`WorkerProfile` uitgevee); `Avatar` val terug op voorletters; aparte aanboording vir plaser en werker; wag-regstelling vir kliënt-navigasie |

**Besluite:**

- **Wie plaas:** enige opgestelde, ongeblokkeerde lid. **Limiet:** 5 oop plasings per persoon (`MAX_OPEN_LISTINGS`).
- **Sigbaarheid:** net aangemelde lede; die plaser se volle naam en foto wys op die plasing. `/plasings/[id]` wys 'n plasing aan enige aangemelde lid (eienaar kry die knoppies).
- **Wysig:** terwyl 'n plasing `OPEN` is, mag alles verander (ook kategorie en werktipe). In Fase 3 moet dit sluit sodra iemand reageer.
- **Datums:** net datum, geen tyd; Orania-tyd.
- **Rybewys en eie vervoer** is nie data nie: die plaser noem dit in die beskrywing.
- **Plasers:** 'n suiwer plaser het geen belangstellings nie en `available = false`. Hy sien nie die werk-kaart op `/tuis` of die beskikbaarheid op sy publieke profiel nie.

✅ **Gespeel:** plasings met verskillende kategorieë en tipes geskep, "± N mense" het verander, en die sigbaarheid vir 'n tweede lid is getoets. Vrygestel op produksie.

### ✅ Fase 3 — Reaksies en aanvaarding

| Stap | Wat                                                                                                                                                                                                                      | Stand                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| 3.1  | Skema: `ResponseStatus`, `Response`; migrasie `20261013100000_responses` (toegepas op Neon `dev`)                                                                                                                        | ✅                                                          |
| 3.2  | Repo `db/response.ts` (slot per plasing, oorgange met tel-rye, witlys-selects, `countCompletedForUser`); `DB.listing.transition` neem 'n lys, `transitionById`, `findById`, `listOpenForMember`; `DB.profile.findPhones` | ✅                                                          |
| 3.3  | `schemas/response.ts` (`respondSchema`, `responseActionSchema`) + spec                                                                                                                                                   | ✅                                                          |
| 3.4  | `services/responses.ts`, `members.ts`; `listings.ts` (wysig-slot, status vanaf `CLOSED`, uitgebreide `getListing`); `home.ts`                                                                                            | ✅                                                          |
| 3.5  | `opportunities.ts`; `kinds.JOB.matchesPreferences`                                                                                                                                                                       | ✅                                                          |
| 3.6  | `responses.remote.ts`, `opportunities.remote.ts`                                                                                                                                                                         | ✅                                                          |
| 3.7  | Bladsye en komponente (`/geleenthede`, `/geleenthede/[id]`, `/my-reaksies`, `ListingView`, `ListingResponses`, nav, `/tuis`, "N voltooi"); `Modal`/`confirmAction`; gedeelde UI-komponente en `styles.ts`                | ✅ gebou; ✋ nie in die blaaier gesien nie (herontwerp kom) |
| 3.8  | Vitest teen Neon `dev`: `responses.spec.ts` (18 toetse: respond, aanvaar en sluit, gelyktydige aanvaarding, onttrek en heropen, wysig-slot, privaatheid, `toContact`), `response.spec.ts`, `job.spec.ts`                 | ✅ (Playwright-e2e en blaaiertoets bewus oorgeslaan)        |
| 3.9  | `docs/PLAN.md` bygewerk; vrygestel op produksie                                                                                                                                                                          | ✅                                                          |

**Besluite:**

- **`/geleenthede`:** alle oop plasings van ander; dié wat pas (belangstelling + werktipe) kom eerste met "Pas by jou". Plasings waarop jy reeds gereageer het (behalwe onttrek), word nie gewys nie; dié is op `/my-reaksies`.
- **Kontak:** ná aanvaarding sien albei kante mekaar se selnommer (bel en WhatsApp). Nooit e-pos nie.
- **Toestandsmasjien:** `INTERESTED → ACCEPTED|DECLINED` (plaser), `INTERESTED|ACCEPTED → WITHDRAWN` (reageerder), `WITHDRAWN → INTERESTED`. 'n Aanvaarding kan nie deur die plaser ongedaan gemaak word nie; 'n afgewysde kan nie weer reageer nie.
- **Wysig:** kategorie en werktipe sluit by die eerste reaksie; kapasiteit mag wissel maar moet groter bly as die aantal aanvaardes.

**Bekende randgevalle:** (1) Onttrek 'n aanvaarde reageerder ná die sperdatum, word die plasing weer `OPEN` maar niemand kan reageer nie (dit wys "Oop" sonder dat dit werklik oop is). (2) Reageerders kry nog geen kennisgewing nie (Fase 4). (3) `/geleenthede` is gelimiet tot 100 plasings, sonder bladsynommers.

#### Wat nog oor is

1. **Seed:** `prisma/seed-people.ts` het nog geen reaksies nie; brei dit uit sodat `dev` data het.
2. **Blaaiertoets** (ná die herontwerp): speel die scenario "'n plasing vir 2 mense kry 3 reaksies; aanvaar 2 → Gesluit, die derde kry afgewys"; kontak sigbaar net by aanvaarding; onttrek van 'n aanvaarde heropen die plasing; wysig-slot; die modals (`confirmAction`) en die reageer-vorm (is die `requestId` ná 'n onttrekking vars?). Voeg dan 'n Playwright-toets by.
3. Reaksie-toetse duur ±190 s (Neon `dev` is stadig); loop dit alleen: `npx vitest run src/lib/server/services/responses.spec.ts`.

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
  - **Gedoen:** Vitest vir `matching`, `idempotency`, `listings`, `responses`, `schemas/listing`, `schemas/response`, `schemas/onboarding` en `jobKind`. Databasistoetse loop teen Neon `dev`.
  - **Nog te doen:** Vitest vir `getInitials`, `displayName`, `formatPhone`, `detectImageType`, `safeRedirect` (suiwer funksies). Die voorbeeldtoets in `src/lib/vitest-examples/` kan weg.
  - `getListing`/`getMyListings` het geen Vitest-toets nie (hulle gebruik `prisma()` en vereis 'n versoek); net die blaaier het hulle gedek.
  - Klein oop punte: `App.Platform` in `src/app.d.ts` word nie gebruik nie; `getInitials` het nog nie 'n eksplisiete terugkeertipe nie; Neon `dev` het 'n kategorie "Anders" naas "Ander"; die `seed-`-mense (`db:seed:people`) bly op `dev`.
  - Playwright e2e vir die hoofvloei (Fase 3 se scenario is nog nie geskryf nie; wag vir die herontwerp), en vanlyn-scenario's vanaf Fase 5.
- Elke fase word op `dev.dorpsplein.co.za` en op 'n foon getoets voor `master`.
