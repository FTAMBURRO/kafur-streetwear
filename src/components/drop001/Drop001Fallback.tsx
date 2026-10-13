import { drop001Closing, drop001Looks, type Drop001Language } from "../../data/drop001";

export default function Drop001Fallback({
  language,
  onExplore,
}: {
  language: Drop001Language;
  onExplore: () => void;
}) {
  return (
    <section className="drop-fallback" aria-label="DROP 001">
      {drop001Looks.map((look, index) => (
        <article className="drop-fallback__look" key={look.id}>
          <img src={look.image} alt={look.alt[language]} loading={index === 0 ? "eager" : "lazy"} />
          <div className="drop-fallback__shade" />
          <div className="drop-fallback__copy">
            <span>{look.eyebrow[language]}</span>
            <h1>{look.title[language]}</h1>
            <p>{look.description[language]}</p>
          </div>
        </article>
      ))}
      <div className="drop-fallback__closing">
        <span>{drop001Closing.eyebrow[language]}</span>
        <h2>{drop001Closing.title[language]}</h2>
        <p>{drop001Closing.description[language]}</p>
        <button className="drop-cinematic__cta" type="button" onClick={onExplore}>
          <span>{language === "es" ? "VER LAS REMERAS" : "VIEW THE T-SHIRTS"}</span><span aria-hidden="true">↗</span>
        </button>
      </div>
    </section>
  );
}
