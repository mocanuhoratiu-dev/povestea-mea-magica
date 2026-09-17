# Conversie HEIC locala

- Se aplica formularului comun al tuturor produselor si pachetului.
- Fisierul nu este incarcat pe server pentru conversie. Analiza AI ramane dupa
  consimtamant si dupa apasarea butonului de analiza.
- Worker separat, incarcat la alegerea unui HEIC/HEIF. Limita 10 MB si verificarea
  dimensiunilor din container inainte de decodare, apoi verificarea bitmap-ului.
- Timeout 45 secunde, anulare si terminarea worker-ului la iesirea din formular.
- Rezultat JPEG de maximum 1536 px, fara metadatele originale ale fotografiei.
- Fara servicii de conversie externe si fara relaxarea CSP pentru unsafe-eval.
- Pentru formatele HEIF necompatibile: eroare explicita si alternativa JPG.

## Componente externe

`heic-to` 1.5.2 (LGPL-3.0), varianta CSP, include libheif 1.22.2.
Codul sursa si instructiunile de construire ale versiunii distribuite:
https://github.com/hoppergee/heic-to
https://www.npmjs.com/package/heic-to/v/1.5.2
Pastram fisierele de licenta/notificarile livrate in pachet; codul bibliotecii
nu este modificat.

`image-size` 2.0.2 (MIT) citeste dimensiunile din container, fara decodarea pixelilor.
https://www.npmjs.com/package/image-size/v/2.0.2

Probele automate folosesc o imagine geometrica HEIC, nu fotografia unui copil.
Testele pe telefoane fizice raman separate, in `uat-telefoane-reale.md`.
