# Atelierul Scutului Magic: pagini de pastrat

## Ordinea documentului

- Paginile 1-10: aventura si ritualul existent.
- Pagina 11: diploma, A4 landscape (297 x 210 mm).
- Pagina 12: reteta, A4 portrait (210 x 297 mm).
- Pagina 13: patru etichete decupabile, A4 portrait.

Cititorul, descarcarea si atasamentul PDF pentru email folosesc aceeasi
constructie din `src/lib/kits/template.ts`. Geometria este comuna in
`src/lib/kits/pageGeometry.ts`.

## Personalizare si ilustratii

Fundalurile aprobate sunt in `public/examples/scut/keepsakes/`. Sunt ilustratii
statice reutilizabile, nu imagini regenerate pentru fiecare comanda. Diploma
a fost pregatita cu generatorul de imagini integrat; reteta si etichetele au
fost pregatite cu Vertex AI, cu aprobarea utilizatorului. Costul pregatirii
acestor fundaluri este unic, nu se adauga la fiecare comanda.

Numele, monograma, adultul de incredere, pasii ritualului si formula de curaj
sunt text HTML personalizat si escapate inainte de randare. Pasii si formula
provin din continutul AI validat al comenzii. Doar marca statica de pe reteta
este inclusa in ilustratie; niciun nume de copil nu este inclus in fundaluri.

`scripts/prepare-shield-keepsake-assets.mjs` converteste cele trei surse PNG
aprobate in WebP. CSS-ul si coordonatele sunt in
`src/components/shield-keepsakes.css`.

## Verificare

- Testele unitare verifica ordinea, numarul paginilor, personalizarea si A4.
- `scripts/qa-premium-kits.mjs` verifica cititorul, exportul PDF si mobilul.
- `QA_STRESS=1 QA_KIND=monster` foloseste nume lung si textele maxime.
- `QA_EMAIL=1` intercepteaza trimiterea si salveaza atasamentul pentru audit;
  nu trimite email real si nu apeleaza AI/Stripe.
- Exportul refuza textul care depaseste pagina sau zonele delimitate.

PDF-urile deja descarcate sau trimise nu se modifica retroactiv. Noua versiune
se aplica exporturilor realizate dupa publicarea codului.
