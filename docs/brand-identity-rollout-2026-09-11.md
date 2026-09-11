# Identitatea site-ului: versiune pentru verificare

11 septembrie 2026. Implementare locală, fără commit, push sau deploy în această etapă.

## Sistem vizual

- Un singur master vectorial: `public/brand/emblem.svg`. Din acesta sunt derivate iconul, imaginea pentru email și variantele raster folosite de aplicație.
- Fraunces 500/600 pentru titlurile site-ului și wordmark; Nunito pentru corp și controale. Diacritice latine extinse. Emailurile păstrează fonturile de sistem compatibile cu clienții de mail.
- Bleumarin `#0B2035`, auriu `#F2CD7A`, fundal `#FBFCFD`. Pruna și verdele rămân accente ale produselor, nu identități paralele.
- Header, footer, butoane, pagina principală, pagini de ajutor și emailuri aliniate. Ilustrațiile și compozițiile PDF-urilor nu au fost regenerate.
- Iconul aplicației are aproximativ 3 KB; masterul vectorial sub 8 KB. Capturile din Cum funcționează sunt WebP, circa 12–28 KB fiecare.

## Conținut și experiență

- Ediția digitală PDF + audio este explicită în primul ecran.
- Homepage-ul include un fragment autentic din povestea fondatorului, cu link spre Despre.
- Navigarea secundară oferă acces la povestea brandului, proces, întrebări și ajutor. Meniul mobil se poate derula și închide cu Escape.
- Cum funcționează are trei fluxuri distincte, cu capturi reale ale formularelor și modele publice. Taburile funcționează și de la tastatură.
- FAQ este grupat în patru categorii, cu acordeoane și linkuri care deschid direct întrebarea. Include lipsa emailului, accesul de 30 de zile, fotografia opțională și limita mostrelor afișată în configurator.
- Contactul pornește de la problema clientului și deschide emailuri cu subiect potrivit. Nu expune public existența comenzilor.
- Siguranța are aceeași structură editorială și explică fotografii, generare, controlul părintelui și acces privat, fără garanții absolute.
- Modele, FAQ, Livrare și Confidențialitate reflectă structura actuală a Atelierului și livrarea comercială.
- Politicile lungi au rezumat practic și cuprins; condițiile juridice nu au fost reformulate ca parte a unei consultanțe juridice.
- Recenziile păstrează autorii și textele aprobate. Sunt asociate experienței relevante, fără date sau calificativ de achiziție verificată inventate.
- Preferințele cookie se deschid și când nu este configurat un instrument publicitar opțional.
- Launcherul Lumi inactiv se retrage când footerul este vizibil; conversația deschisă și generarea nu sunt întrerupte.

## Verificare

- Build Next.js de producție reușit, cu 46 de pagini generate.
- TypeScript și lint pentru componentele noi și principalele componente modificate: fără erori.
- 96 de teste existente și trei teste noi pentru identitate, emailuri și FAQ: trecute.
- 12 rute verificate vizual la 1440, 390 și 320 px: HTTP 200, fără erori JavaScript observate, imagini lipsă sau depășire orizontală.
- Alte cinci rute comerciale verificate la 1440, 1024, 390 și 320 px: HTTP 200 și fără depășire orizontală.
- Meniu, preferințe cookie, retragerea Lumi din footer, încadrarea dialogului, ancore FAQ și taburi: verificate la cele patru dimensiuni.
- Capturi și rezultate: `/private/tmp/pmm-brand-qa/`.

## Limite și pași separați

- Nu au fost trimise emailuri, lansate generări AI sau făcute plăți. Auditul vizual nu închide problemele UAT ale mostrelor.
- Nu este un test pe telefoane fizice, cu tastatură iOS/Android, și nici un audit juridic sau Core Web Vitals.
- Portretul real al fondatorului, fotografiile autentice ale familiilor și un interval de răspuns al suportului rămân de furnizat/confirmat. Nu au fost fabricate.
- Revizia vizuală trebuie aprobată înainte de publicare. Site-ul live nu a fost schimbat.
