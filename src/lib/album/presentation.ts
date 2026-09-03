export type AlbumPublicProgress = {
  stage: "planning" | "cover" | "scenes" | "activity" | "rendering" | "delivery";
  current: number;
  total: number;
};

const albumWorlds = new Set(["forest", "stars", "ocean", "clouds", "dinosaurs", "castle"]);

export function albumWorldFromLumi(theme: string) {
  if (theme === "space") return "stars";
  return albumWorlds.has(theme) ? theme : null;
}

export function albumProgressPresentation(progress?: AlbumPublicProgress) {
  if (!progress) {
    return {
      label: "Pregătim atelierul",
      detail: "Confirmăm comanda și pornim generarea.",
      percent: 6,
    };
  }

  switch (progress.stage) {
    case "planning":
      return {
        label: "Scriem firul aventurii",
        detail: "Alegerile voastre devin cele 13 momente ale poveștii.",
        percent: 12,
      };
    case "cover":
      return {
        label: "Dăm chip personajului",
        detail: "Coperta stabilește aspectul pe care îl păstrăm în toate scenele.",
        percent: 20,
      };
    case "scenes": {
      const total = Math.max(1, progress.total);
      const current = Math.min(total, Math.max(0, progress.current));
      return {
        label: `Ilustrăm scenele ${current} din ${total}`,
        detail: "Fiecare imagine este creată separat și verificată înainte de a continua.",
        percent: Math.round(22 + (current / total) * 54),
      };
    }
    case "activity":
      return {
        label: "Pregătim caietul de activități",
        detail: "Transformăm aventura în jocuri, desen și o pagină de amintire.",
        percent: 80,
      };
    case "rendering":
      return {
        label: "Așezăm povestea în pagină",
        detail: "Construim cartea și caietul în format A5 landscape.",
        percent: 90,
      };
    case "delivery":
      return {
        label: "Pregătim livrarea",
        detail: "Ultima verificare este în curs, apoi trimitem linkul securizat.",
        percent: 97,
      };
  }
}
