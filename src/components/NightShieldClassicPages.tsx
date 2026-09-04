import { Fragment, type CSSProperties } from "react";

type ClassicShieldKit = {
  target: string;
  order: string;
  ingredients: { name: string; detail: string }[];
  spell: string;
};

type ClassicShieldPagesProps = {
  name: string;
  fearLabel: string;
  location: string;
  helper: string;
  ritual: string;
  kit: ClassicShieldKit;
};

function plain(value: string, fallback: string, maxLength: number) {
  const clean = value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() || fallback;
  return clean.length <= maxLength ? clean : `${clean.slice(0, maxLength - 3).trim()}...`;
}

export function ClassicShieldPages({ name, fearLabel, location, helper, ritual, kit }: ClassicShieldPagesProps) {
  const heroName = plain(name, "EROUL NOSTRU", 28);
  const safeLocation = plain(location, "camera copilului", 48);
  const safeHelper = plain(helper, "o îmbrățișare", 42);
  const safeRitual = plain(ritual, "trei respirații lente", 48);
  const bottleLabel = fearLabel.toLocaleUpperCase("ro-RO");
  const clauses = [
    { art: "Art. I", text: `Zona ${safeLocation} intră sub protecția oficială a Ordinului Dragonului Somnoros.` },
    { art: "Art. II", text: `Orice formă sau sunet este verificat împreună cu un adult și readus la dimensiunea lui adevărată.` },
    { art: "Art. III", text: `${safeHelper} poate fi chemat oricând, fără grabă și fără nicio probă de curaj.` },
    { art: "Art. IV", text: `Pentru ${heroName}, scutul se activează complet prin ritualul: ${safeRitual}.` },
  ];
  const signatures = [
    { name: "Selena Clar-de-Lună", title: "Inspectoarea Nopților Cuminți" },
    { name: "Licuricius al III-lea", title: "Paznicul Luminilor de Veghe" },
  ];
  const steps = [
    { roman: "I", l1: "Amestecă ingredientele magice,", l2: "agitând flaconul spre fereastră." },
    { roman: "II", l1: `Pulverizează blând la ${safeLocation},`, l2: `apoi folosește ${safeHelper}.` },
    { roman: "III", l1: `Încheie cu ritualul: ${safeRitual},`, l2: "și declară camera pregătită de somn." },
  ];
  const instructionLines = [
    "1.  Agită flaconul de 7 ori",
    "2.  Rostește descântecul în șoaptă",
    `3.  Pulverizează la ${safeLocation}`,
    `4.  Folosește ${safeHelper}`,
    `5.  Încheie cu: ${safeRitual}  ✓`,
  ];

  return (
    <>
      <div id="ns-page-1" className="mk-page" style={{ display: "none" }}>
        <div className="mk-bg" />
        <div className="mk-border-outer" />
        <div className="mk-border-inner" />
        {(["tl", "tr", "bl", "br"] as const).map((pos) => <CornerSVG key={pos} pos={pos} />)}
        <div className="mk-content">
          <p className="mk-ministry">Povestea Mea Magică · Scutul de Noapte</p>
          <h1 className="mk-title">CERTIFICAT OFICIAL<br />DE PROTECȚIE MAGICĂ</h1>
          <p className="mk-subtitle">împotriva {kit.target} și a fricilor de noapte</p>
          <Divider stars={3} />
          <div className="mk-beneficiary-box">
            <span className="mk-beneficiary-label">Se acordă copilului curajos</span>
            <div className="mk-beneficiary-name">{heroName}</div>
          </div>
          <p className="mk-body">
            Prin autoritatea conferită de <em>Ordinul Dragonului Somnoros</em> și cu binecuvântarea <em>Zânei Luminilor de Noapte</em>, camera lui {heroName} este protejată printr-un <em>scut invizibil</em> împotriva {kit.target}. <em>Certificatul se activează prin citire, zâmbet și îmbrățișare.</em>
          </p>
          <Divider stars={1} />
          <p className="mk-clauses-title">Clauze Oficiale Antimonstru · Articole de Lege Magică</p>
          <div className="mk-clauses-grid">
            {clauses.map((clause) => <div key={clause.art} className="mk-clause"><span className="mk-clause-num">{clause.art}</span>{clause.text}</div>)}
          </div>
          <Divider stars={1} />
          <div className="mk-seal-row">
            <div className="mk-sig-block"><div className="mk-sig-line" /><div className="mk-sig-name">{signatures[0].name}</div><div className="mk-sig-title">{signatures[0].title}</div></div>
            <DragonSeal />
            <div className="mk-sig-block"><div className="mk-sig-line" /><div className="mk-sig-name">{signatures[1].name}</div><div className="mk-sig-title">{signatures[1].title}</div></div>
          </div>
          <Divider stars={1} narrow />
          <p className="mk-validity">Valabil pentru ritualuri de seară, sub supravegherea unui adult</p>
          <p className="mk-cert-number">Nr. #0001 · Seria SOMN-LINIȘTIT</p>
        </div>
      </div>

      <div id="ns-page-2" className="mk-page" style={{ display: "none" }}>
        <div className="mk-bg" />
        <div className="mk-border-outer" />
        <div className="mk-border-inner" />
        {(["tl", "tr", "bl", "br"] as const).map((pos) => <CornerSVG key={pos} pos={pos} />)}
        <div className="mk-content">
          <p className="mk-ministry">Povestea Mea Magică · Ritual de Noapte</p>
          <h1 className="mk-title" style={{ fontSize: 30 }}>REȚETA SECRETĂ</h1>
          <p className="mk-subtitle">a Spray-ului Anti-Monștri · Formulă Clasificată</p>
          <Divider stars={3} />
          <div className="mk-recipe-cols">
            <div className="mk-recipe-col">
              <p className="mk-recipe-section-title">Ingrediente Magice</p>
              {kit.ingredients.map((ingredient, index) => <div key={ingredient.name} className="mk-ingredient"><span className="mk-ing-num">{index + 1}</span><div><div className="mk-ing-name">{["💧", "✨", "🧂"][index]} {ingredient.name}</div><div className="mk-ing-detail">{ingredient.detail}</div></div></div>)}
            </div>
            <div className="mk-vdivider" />
            <div className="mk-recipe-col">
              <p className="mk-recipe-section-title">Mod de Preparare</p>
              {steps.map((step) => <div key={step.roman} className="mk-step"><div className="mk-step-num"><span>{step.roman}</span></div><div><div className="mk-step-l1">{step.l1}</div><div className="mk-step-l2">{step.l2}</div></div></div>)}
            </div>
          </div>
          <Divider stars={3} />
          <div className="mk-incantation-box" style={{ marginTop: 50 }}><p className="mk-incantation-label">Descântecul de Activare · Se rostește în șoaptă</p><p className="mk-incantation-text">„{kit.spell}”</p></div>
          <Divider stars={1} narrow />
          <p className="mk-disclaimer">⚠️ Ritual de joacă pentru seară, pregătit de un adult cu ingrediente inofensive</p>
          <div className="mk-mini-seal-row">
            {["Aprobat de\nDragonul Somnoros", "Nr. Rețetă\nSPRAY-007", "Zâna Luminilor\nde Noapte"].map((text, index) => <Fragment key={text}><div className="mk-mini-seal">{text.split("\n").map((line) => <span key={line}>{line}<br /></span>)}</div>{index < 2 && <span className="mk-mini-dot">✦</span>}</Fragment>)}
          </div>
        </div>
      </div>

      <div id="ns-page-3" className="mk-page mk-page-parchment" style={{ display: "none" }}>
        <div className="mk-border-outer mk-border-dark" />
        <div className="mk-border-inner mk-border-inner-dark" />
        {(["tl", "tr", "bl", "br"] as const).map((pos) => <CornerSVG key={pos} pos={pos} dark />)}
        <div className="mk-content">
          <p className="mk-ministry mk-ministry-dark">Decupați și lipiți pe flacon · Tăiați pe linia punctată</p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 20, marginBottom: 28 }}>
            <div className="mk-label-cut-wrap"><div className="mk-label-main"><p className="mk-label-ministry">MINISTERUL PROTECȚIEI MAGICE</p><h2 className="mk-label-title">SPRAY MAGIC</h2><h3 className="mk-label-subtitle">ANTI-{bottleLabel}</h3><div className="mk-label-divider" /><div className="mk-label-stars">✦ ✦ ✦ ✦ ✦</div><div className="mk-label-divider" style={{ marginTop: 10 }} /><p className="mk-label-owner">Proprietar: <strong>{heroName}</strong></p><p className="mk-label-formula">Formula Secretă Nr. SPRAY-007</p><p className="mk-label-ingredients">{kit.ingredients.map((ingredient) => ingredient.name).join(" · ")}</p><p className="mk-label-validity">VALABIL PÂNĂ LA: SFÂRȘITUL MONȘTRILOR</p></div></div>
          </div>
          <div className="mk-labels-bottom-row">
            <div className="mk-label-cut-wrap" style={{ flexShrink: 0 }}><div className="mk-seal-label"><div style={{ transform: "scale(0.85)" }}><DragonSeal /></div></div></div>
            <div className="mk-label-cut-wrap" style={{ flex: 1 }}><div className="mk-instr-label"><p className="mk-instr-title">INSTRUCȚIUNI</p>{instructionLines.map((line) => <p key={line} className="mk-instr-line">{line}</p>)}<p className="mk-instr-footer">SPRAY-007 · SOMN LINIȘTIT</p></div></div>
          </div>
          <p className="mk-page3-note">Sus: Etichetă principală flacon &nbsp;·&nbsp; Jos stânga: Sigiliu rotund &nbsp;·&nbsp; Jos dreapta: Etichetă cu instrucțiuni</p>
        </div>
      </div>
    </>
  );
}

function Divider({ stars = 3, narrow = false }: { stars?: number; narrow?: boolean }) {
  const width = narrow ? 140 : 260;
  return <div className="mk-divider"><div className="mk-div-line" style={{ width }} />{Array.from({ length: stars }).map((_, index) => <span key={index} className="mk-div-star">✦</span>)}<div className="mk-div-line" style={{ width }} /></div>;
}

function CornerSVG({ pos, dark = false }: { pos: "tl" | "tr" | "bl" | "br"; dark?: boolean }) {
  const scaleX = pos === "tr" || pos === "br" ? -1 : 1;
  const scaleY = pos === "bl" || pos === "br" ? -1 : 1;
  const style: CSSProperties = { position: "absolute", width: 52, height: 52, top: pos.startsWith("t") ? 8 : undefined, bottom: pos.startsWith("b") ? 8 : undefined, left: pos.endsWith("l") ? 8 : undefined, right: pos.endsWith("r") ? 8 : undefined, transform: `scale(${scaleX}, ${scaleY})` };
  const stroke = dark ? "#8a6e2f" : "#c9a84c";
  return <svg style={style} viewBox="0 0 52 52" fill="none"><path d="M2 30 L2 2 L30 2" stroke={stroke} strokeWidth="1.6" /><path d="M2 14 L14 2" stroke={stroke} strokeWidth="0.9" opacity="0.55" /><path d="M2 22 L22 2" stroke={stroke} strokeWidth="0.5" opacity="0.3" /><circle cx="2" cy="2" r="2.6" fill={stroke} opacity="0.85" /></svg>;
}

function DragonSeal() {
  return <div className="mk-dragon-seal"><div className="mk-dragon-seal-inner" style={{ marginTop: -8 }}><svg viewBox="0 0 80 80" width="54" height="54" fill="none"><ellipse cx="40" cy="47" rx="12" ry="10" fill="#c9a84c" opacity="0.85" /><ellipse cx="40" cy="30" rx="9" ry="8" fill="#c9a84c" opacity="0.85" /><ellipse cx="47" cy="32" rx="5" ry="4" fill="#c9a84c" opacity="0.75" /><path d="M52 47 Q66 43 68 55 Q60 51 52 51" fill="#c9a84c" opacity="0.8" /><path d="M28 41 Q13 28 17 17 Q25 31 34 39" fill="#c9a84c" opacity="0.65" /><path d="M52 41 Q67 28 63 17 Q55 31 46 39" fill="#c9a84c" opacity="0.65" /><circle cx="45" cy="28" r="2.5" fill="#0e0f23" /><circle cx="45.8" cy="27.2" r="0.9" fill="#c9a84c" opacity="0.6" /><path d="M51 28 Q58 22 55 15 Q51 20 49 15 Q47 21 51 28Z" fill="#f4e4a0" opacity="0.8" /></svg><p className="mk-dragon-seal-text">SIGILIUL<br />DRAGONULUI<br />SOMNOROS<br />· AUTENTIC ·</p></div></div>;
}

export const CLASSIC_SHIELD_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&display=swap');
.mk-page{width:794px;height:1123px;background:linear-gradient(160deg,#0e0f23 0%,#0d1535 55%,#0e0f23 100%);position:relative;overflow:hidden;font-family:'Crimson Pro',Georgia,serif;box-sizing:border-box}.mk-page *{box-sizing:border-box}.mk-page-parchment{background:#f0ead8!important}.mk-bg{position:absolute;inset:0;background:radial-gradient(ellipse at 15% 15%,rgba(155,89,182,.07) 0%,transparent 55%),radial-gradient(ellipse at 85% 85%,rgba(201,168,76,.05) 0%,transparent 55%)}.mk-border-outer{position:absolute;inset:16px;border:2.5px solid #c9a84c;border-radius:3px}.mk-border-inner{position:absolute;inset:27px;border:.65px solid rgba(201,168,76,.3);border-radius:2px}.mk-border-dark{border-color:#8a6e2f!important}.mk-border-inner-dark{border-color:rgba(138,110,47,.3)!important}.mk-content{position:relative;z-index:10;padding:54px 68px 38px;display:flex;flex-direction:column;height:100%;box-sizing:border-box}.mk-ministry{font-family:'Cinzel',serif;font-size:8px;font-weight:600;letter-spacing:.32em;color:#c9a84c;text-align:center;text-transform:uppercase;opacity:.78;margin-bottom:12px}.mk-ministry-dark{color:#7a5c22}.mk-title{font-family:'Cinzel',serif;font-size:27px;font-weight:700;color:#f4e4a0;text-align:center;line-height:1.22;margin:0 0 7px;letter-spacing:.04em;text-shadow:0 0 28px rgba(201,168,76,.25)}.mk-subtitle{font-family:'Cinzel',serif;font-size:10.5px;color:#c9a84c;text-align:center;letter-spacing:.17em;margin-bottom:2px;opacity:.88}.mk-divider{display:flex;align-items:center;gap:10px;justify-content:center;margin:13px auto}.mk-div-line{height:1px;background:linear-gradient(90deg,transparent,#c9a84c,transparent);opacity:.58}.mk-div-star{color:#c9a84c;font-size:12px}.mk-beneficiary-box{text-align:center;margin:12px 0;padding:16px 28px;background:rgba(201,168,76,.06);border:1px solid rgba(201,168,76,.22);border-radius:3px}.mk-beneficiary-label{font-family:'Cinzel',serif;font-size:8px;letter-spacing:.26em;color:#c9a84c;text-transform:uppercase;display:block;margin-bottom:10px;opacity:.85}.mk-beneficiary-name{font-family:'Cinzel',serif;font-size:26px;color:#f4e4a0;font-weight:600;letter-spacing:.05em;border-bottom:1px solid rgba(201,168,76,.42);display:inline-block;min-width:300px;padding-bottom:6px;max-width:540px;overflow-wrap:anywhere}.mk-body{font-size:13.5px;line-height:1.75;color:#d4c5e8;text-align:center;font-style:italic;margin:11px 0;overflow-wrap:anywhere}.mk-body em{color:#f4e4a0;font-style:normal;font-weight:500}.mk-clauses-title{font-family:'Cinzel',serif;font-size:8px;font-weight:600;letter-spacing:.28em;color:#c9a84c;text-align:center;text-transform:uppercase;margin:8px 0 10px;opacity:.85}.mk-clauses-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:6px}.mk-clause{background:rgba(201,168,76,.05);border:1px solid rgba(201,168,76,.18);border-radius:3px;padding:11px 14px;font-size:12px;color:#bfb3d4;line-height:1.65;text-align:left;overflow-wrap:anywhere}.mk-clause-num{font-family:'Cinzel',serif;color:#c9a84c;font-size:8.5px;font-weight:600;letter-spacing:.14em;display:block;margin-bottom:5px}.mk-seal-row{display:flex;align-items:center;justify-content:space-between;gap:20px;margin:8px 0}.mk-sig-block{flex:1;text-align:center}.mk-sig-line{height:1px;background:rgba(201,168,76,.4);width:180px;margin:0 auto 7px}.mk-sig-name{font-size:11.5px;color:#9a8bc0;font-style:italic;margin-bottom:4px}.mk-sig-title{font-family:'Cinzel',serif;font-size:7px;color:#c9a84c;letter-spacing:.12em;text-transform:uppercase;opacity:.82}.mk-dragon-seal{flex-shrink:0;width:100px;height:100px;border-radius:50%;border:1.8px solid #c9a84c;background:rgba(201,168,76,.07);display:flex;align-items:center;justify-content:center;box-shadow:0 0 18px rgba(201,168,76,.12)}.mk-dragon-seal-inner{text-align:center}.mk-dragon-seal-text{font-family:'Cinzel',serif;font-size:6px;color:#c9a84c;letter-spacing:.1em;line-height:1.5;margin-top:3px}.mk-validity{font-family:'Cinzel',serif;font-size:7.5px;color:rgba(201,168,76,.5);text-align:center;letter-spacing:.2em;text-transform:uppercase;margin-top:6px}.mk-cert-number{font-family:'Cinzel',serif;font-size:7px;color:rgba(201,168,76,.28);text-align:right;letter-spacing:.15em;margin-top:4px}.mk-recipe-cols{display:flex;gap:0;margin:12px 0;flex:1;align-items:flex-start}.mk-recipe-col{flex:1;padding:0 18px}.mk-recipe-col:first-child{padding-left:0}.mk-recipe-col:last-child{padding-right:0}.mk-vdivider{width:1px;flex-shrink:0;margin:6px;background:linear-gradient(to bottom,transparent,rgba(201,168,76,.38) 20%,rgba(201,168,76,.38) 80%,transparent)}.mk-recipe-section-title{font-family:'Cinzel',serif;font-size:9px;font-weight:600;letter-spacing:.28em;color:#c9a84c;text-transform:uppercase;margin-bottom:18px;opacity:.9}.mk-ingredient{display:flex;gap:14px;align-items:flex-start;margin-bottom:20px}.mk-ing-num{font-family:'Cinzel',serif;font-size:24px;font-weight:700;color:rgba(201,168,76,.18);line-height:1;flex-shrink:0;width:24px;text-align:right;margin-top:1px}.mk-ing-name{font-size:13.5px;font-weight:500;color:#f4e4a0;line-height:1.3;overflow-wrap:anywhere}.mk-ing-detail{font-size:11px;color:#9a8bc0;font-style:italic;margin-top:3px;overflow-wrap:anywhere}.mk-step{display:grid;grid-template-columns:28px minmax(0,1fr);column-gap:12px;align-items:start;margin-bottom:18px}.mk-step-num{width:28px;height:28px;box-sizing:border-box;border-radius:50%;border:1.2px solid rgba(201,168,76,.5);background:rgba(201,168,76,.08);color:#d7b759;display:grid;place-items:center;margin:0}.mk-step-num span{display:block;font-family:'Cinzel',serif;font-size:9px;font-weight:700;line-height:1;text-align:center;transform:translateY(-1.5px)}.mk-step-l1{font-size:13px;color:#d4c5e8;line-height:1.45;overflow-wrap:anywhere}.mk-step-l2{font-size:12px;color:#bfb3d4;font-style:italic;margin-top:3px;overflow-wrap:anywhere}.mk-incantation-box{background:rgba(201,168,76,.06);border:1px solid rgba(201,168,76,.26);border-radius:4px;padding:20px 30px;text-align:center;margin:6px 0}.mk-incantation-label{font-family:'Cinzel',serif;font-size:7.5px;font-weight:600;letter-spacing:.28em;color:#c9a84c;text-transform:uppercase;display:block;margin-bottom:12px;opacity:.88}.mk-incantation-text{font-size:16px;font-style:italic;color:#d4c5e8;line-height:1.75;overflow-wrap:anywhere;white-space:pre-line}.mk-disclaimer{font-family:'Cinzel',serif;font-size:7px;color:rgba(201,168,76,.4);text-align:center;letter-spacing:.14em;margin:6px 0 4px}.mk-mini-seal-row{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px}.mk-mini-seal{font-family:'Cinzel',serif;font-size:7px;color:rgba(201,168,76,.38);letter-spacing:.14em;text-align:center;line-height:1.6}.mk-mini-dot{color:rgba(201,168,76,.28);font-size:10px}.mk-label-cut-wrap{border:1.5px dashed rgba(138,110,47,.42);border-radius:8px;padding:7px;display:inline-block}.mk-label-main{width:560px;background:linear-gradient(160deg,#0e0f23,#0d1535);border:2px solid #c9a84c;border-radius:12px;padding:28px 40px;text-align:center}.mk-label-ministry{font-family:'Cinzel',serif;font-size:7.5px;letter-spacing:.26em;color:#c9a84c;text-transform:uppercase;opacity:.78;margin-bottom:10px}.mk-label-title{font-family:'Cinzel',serif;font-size:34px;font-weight:700;color:#f4e4a0;letter-spacing:.05em;margin:0 0 5px}.mk-label-subtitle{font-family:'Cinzel',serif;font-size:15px;color:#c9a84c;letter-spacing:.12em;margin-bottom:10px}.mk-label-divider{height:1px;background:linear-gradient(90deg,transparent,#c9a84c,transparent);opacity:.45;margin:8px 0}.mk-label-stars{color:#c9a84c;font-size:14px;letter-spacing:8px;margin:6px 0}.mk-label-owner{font-family:'Cinzel',serif;font-size:12px;color:#d4c5e8;margin:10px 0 5px;letter-spacing:.1em;overflow-wrap:anywhere}.mk-label-owner strong{color:#f4e4a0}.mk-label-formula{font-size:13px;color:#9a8bc0;font-style:italic;margin-bottom:4px}.mk-label-ingredients{font-size:12px;color:#bfb3d4;font-style:italic;margin-bottom:7px;overflow-wrap:anywhere}.mk-label-validity{font-family:'Cinzel',serif;font-size:7px;color:rgba(201,168,76,.5);letter-spacing:.15em;text-transform:uppercase}.mk-labels-bottom-row{display:flex;gap:28px;align-items:flex-start;justify-content:center}.mk-seal-label{width:180px;height:180px;border-radius:50%;background:linear-gradient(160deg,#0e0f23,#0d1535);border:2.5px solid #c9a84c;display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px rgba(201,168,76,.1)}.mk-instr-label{background:linear-gradient(160deg,#0e0f23,#0d1535);border:2px solid #c9a84c;border-radius:12px;width:420px;padding:26px 32px;text-align:center;display:flex;flex-direction:column;justify-content:center}.mk-instr-title{font-family:'Cinzel',serif;font-size:9px;font-weight:600;color:#c9a84c;letter-spacing:.24em;text-transform:uppercase;opacity:.9;margin-bottom:12px}.mk-instr-line{font-size:15px;color:#d4c5e8;margin:6px 0;overflow-wrap:anywhere}.mk-instr-footer{font-family:'Cinzel',serif;font-size:7px;color:rgba(201,168,76,.4);letter-spacing:.14em;margin-top:10px}.mk-page3-note{font-family:'Cinzel',serif;font-size:7.5px;color:rgba(138,110,47,.5);text-align:center;letter-spacing:.16em;margin-top:auto;padding-top:18px}
`;
