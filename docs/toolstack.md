# Toolstack - Povestea Mea Magica

## Aplicatie web

| Tehnologie | Rol |
| --- | --- |
| Next.js 16 | Framework-ul aplicatiei: pagini, rute API, metadata SEO si build de productie. |
| React 19 | Componentele interactive ale site-ului si ale creatorilor de materiale. |
| TypeScript | Tipare statice pentru cod mai sigur si mentenabil. |
| Tailwind CSS 4 | Sistemul de stilizare, responsive layout si design tokens ale brandului. |
| next/font / Google Fonts | Fonturile de interfata si cele editoriale folosite in produse. |
| Lucide React | Iconografia interfetei. |

## Experienta si miscare

| Tehnologie | Rol |
| --- | --- |
| Framer Motion | Tranzitii, animatii de interfata, modale si stari de incarcare. |
| Lenis | Scroll fluid al site-ului; zonele cu scroll propriu, precum conversatia Lumi, sunt excluse explicit. |
| Three.js | Motorul 3D pentru personajul Lumi. |
| React Three Fiber | Integrarea scenei Three.js in componente React. |

## Inteligenta artificiala

| Tehnologie | Rol |
| --- | --- |
| Google Cloud Vertex AI | Platforma principala pentru generare text, conversatia Lumi si imagini de coperta. Consuma billing/credite Google Cloud. |
| `@google/genai` | SDK-ul folosit de server pentru apelurile Vertex AI. |
| Gemini 2.5 Flash | Modelul Vertex principal pentru continutul personalizat. |
| Gemini 2.5 Flash Lite | Model Vertex de rezerva. Daca modelul principal nu raspunde, fiecare produs il incearca inainte de orice fallback local. |
| Fallback template personalizat | A treia plasa de siguranta. Genereaza continut local, personalizat dupa alegerile familiei, cand modelele AI nu sunt disponibile. |
| Vertex image model | Genereaza coperta ilustrata a povestii. Pentru indisponibilitate exista un fallback vizual generic, fara datele copilului. |
| Google Cloud Text-to-Speech | Previzualizare audio in romana prin service account-ul Cloud Run: Zephyr pentru povesti si Aoede pentru Lumi. |

Ordinea pentru generarea produselor este: **model Vertex principal -> model Vertex de rezerva -> template personalizat**.

## Produse si PDF

| Tehnologie | Rol |
| --- | --- |
| HTML/CSS print templates | Layout-urile A4 pentru Povestea de Seara, Scutul de Noapte si Trusa de Rabdare. |
| html2canvas (CDN) | Randarea paginilor de produs in canvas, direct in browser. |
| jsPDF (CDN) | Construirea si descarcarea PDF-urilor A4, direct in browser. |
| Pollinations | Fallback temporar doar pentru o coperta generica, fara nume, varsta sau detalii libere despre copil. |

## Platforma, securitate si operare

| Tehnologie | Rol |
| --- | --- |
| Google Cloud Run | Hosting-ul de productie pentru aplicatia Next.js si rutele API. |
| Cloud Build | Construieste containerul aplicatiei la deploy din sursa. |
| Google Cloud IAM / service account | Autentificare intre Cloud Run si Vertex AI, fara cheie de service account stocata in repository. |
| Google Cloud Monitoring | Dashboard-uri pentru utilizarea Vertex si comportamentul operational al serviciului. |
| Cloud Run structured logs | Telemetrie agregata pentru vizite, generari, erori, descarcari si feedback. Nu logheaza nume, povesti, prompturi sau conversatii. |
| Rate limiting in-memory | Protectie best-effort pentru endpoint-urile de generare, telemetrie si Lumi in perioada beta. |
| Endpoint `/api/health` | Verificare publica a starii de productie si a configuratiei esentiale, fara expunerea secretelor. |

## Optional / neactiv in aceasta etapa

| Tehnologie | Rol |
| --- | --- |
| Stripe | Pregatita pentru etapa de comanda si plata, dar checkout-ul nu este activ in beta. |
| Resend | Livrare tranzactionala a PDF-urilor ca atasament email. Se activeaza printr-o cheie stocata in Secret Manager si un domeniu expeditor verificat. |
| n8n | Pregatit pentru automatizari operationale ulterioare. |

## Calitate si dezvoltare

| Tehnologie | Rol |
| --- | --- |
| ESLint | Verificare statica a calitatii codului. |
| TypeScript compiler | Verificare de tipuri inainte de deploy. |
| Next.js production build | Verificare a compilarii, rutelor si paginilor statice pentru productie. |
| GitHub | Versionarea codului sursa si istoricul modificarilor. |
