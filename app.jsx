// Short Waves — main React app
// Renders the bilingual single-page site. Reads content from window.SW_CONTENT.

const { useState, useEffect, useRef } = React;

// ---------- URL-based language routing ----------
// /          → default lang
// /ru/, /en/ → explicit lang via subpath
// ?lang=ru   → explicit lang via query string
// Works under custom domain (benfenley.com) and project-pages
// (benfenley.github.io/shortwaves/) — site base is whatever remains
// after stripping a trailing /(ru|en)/? segment.
function detectSiteAndLang() {
  let base = "/";
  let lang = null;
  let chapter = null;
  try {
    const path = window.location.pathname;
    // /ru/N/ or /en/N/ — chapter page
    const cm = path.match(/^(.*?)\/(ru|en)\/(\d+)\/?$/);
    if (cm) {
      base = (cm[1] || "") + "/";
      lang = cm[2];
      chapter = parseInt(cm[3], 10);
    } else {
      // /ru/ or /en/ — language home
      const m = path.match(/^(.*?)\/(ru|en)\/?$/);
      if (m) {
        base = (m[1] || "") + "/";
        lang = m[2];
      } else {
        base = path.endsWith("/") ? path : path.replace(/[^/]*$/, "");
        if (!base) base = "/";
        const q = new URLSearchParams(window.location.search).get("lang");
        if (q === "ru" || q === "en") lang = q;
      }
    }
  } catch {}
  return { base, lang, chapter };
}
const { base: SITE_BASE, lang: INITIAL_LANG_FROM_URL, chapter: INITIAL_CHAPTER } = detectSiteAndLang();
const asset = (p) => SITE_BASE + p.replace(/^\//, "");

// ---------- small decorative primitives ----------

function RadioWaves({ size = 40, strokeWidth = 1 }) {
  // concentric circles — radio propagation glyph
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true">
      <circle cx="0" cy="0" r="6" fill="currentColor" />
      <circle cx="0" cy="0" r="16" fill="none" stroke="currentColor" strokeWidth={strokeWidth} opacity="0.7" />
      <circle cx="0" cy="0" r="28" fill="none" stroke="currentColor" strokeWidth={strokeWidth} opacity="0.45" />
      <circle cx="0" cy="0" r="40" fill="none" stroke="currentColor" strokeWidth={strokeWidth} opacity="0.22" />
    </svg>
  );
}

function DialTicks({ labels }) {
  return (
    <div className="dial">
      {labels.map((l, i) => (
        <div className="dial__cell" key={i}>
          <div className="dial__ticks" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span>
            <span className="dial__major"></span>
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <span className="dial__label">{l}</span>
        </div>
      ))}
    </div>
  );
}

function Diamond({ size = 6 }) {
  return (
    <svg width={size} height={size} viewBox="-1 -1 2 2" aria-hidden="true" style={{ verticalAlign: "middle" }}>
      <rect x="-0.7" y="-0.7" width="1.4" height="1.4" transform="rotate(45)" fill="currentColor" />
    </svg>
  );
}

// thin route map — only straight lines and dots, no illustration
function RouteMap({ showLines = true }) {
  // points roughly placed on a stylized atlas grid
  const pts = [
    { x: 22, y: 64, label: "Brooklyn" },
    { x: 60, y: 38, label: "London" },
    { x: 64, y: 42, label: "Paris" },
    { x: 78, y: 30, label: "Leningrad" },
    { x: 74, y: 50, label: "Odessa" },
  ];
  // pairs of city indices to connect
  const arcs = [
    [0, 1], [1, 2], [2, 4], [4, 3], [1, 3], [0, 4],
  ];
  return (
    <svg className="routemap" viewBox="0 0 100 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* hairline grid */}
      <g stroke="currentColor" strokeWidth="0.08" opacity="0.35">
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={"v" + i} x1={i * 10} y1="0" x2={i * 10} y2="80" />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={"h" + i} x1="0" y1={i * 10} x2="100" y2={i * 10} />
        ))}
      </g>
      {showLines && (
        <g fill="none" stroke="currentColor" strokeWidth="0.25" opacity="0.55">
          {arcs.map(([a, b], i) => {
            const A = pts[a], B = pts[b];
            const mx = (A.x + B.x) / 2;
            const my = (A.y + B.y) / 2 - Math.abs(B.x - A.x) * 0.18;
            return <path key={i} d={`M ${A.x} ${A.y} Q ${mx} ${my} ${B.x} ${B.y}`} strokeDasharray="0.6 0.6" />;
          })}
        </g>
      )}
      <g>
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="0.6" fill="currentColor" />
            <circle cx={p.x} cy={p.y} r="1.2" fill="none" stroke="currentColor" strokeWidth="0.15" />
          </g>
        ))}
      </g>
    </svg>
  );
}

// ---------- sections ----------

function Header({ t, lang, onLang, onNav, minimal = false }) {
  const [open, setOpen] = useState(false);
  const homeHref = minimal ? (SITE_BASE + lang + "/") : "#top";
  return (
    <header className="site-header" data-screen-label="00 Header">
      <div className="wrap header__inner">
        <a className="wordmark" href={homeHref} onClick={() => setOpen(false)}>
          <span className="wordmark__name">Ben Fenley</span>
          <span className="wordmark__sep" aria-hidden="true">·</span>
          <span className="wordmark__alt">{lang === "ru" ? "Бен Фенли" : "author"}</span>
        </a>
        {!minimal && (
          <>
            <nav className={"nav " + (open ? "is-open" : "")} aria-label="primary">
              {lang === "ru" && (
                <a href="#excerpt" onClick={() => setOpen(false)}>{t.nav.excerpt}</a>
              )}
              <a href="#subscribe" onClick={() => setOpen(false)}>{t.nav.subscribe}</a>
              <a href="#author" onClick={() => setOpen(false)}>{t.nav.author}</a>
              <div className="lang" role="group" aria-label="language">
                <button
                  className={lang === "ru" ? "is-active" : ""}
                  onClick={() => onLang("ru")}
                  aria-pressed={lang === "ru"}
                >RU</button>
                <span aria-hidden="true">|</span>
                <button
                  className={lang === "en" ? "is-active" : ""}
                  onClick={() => onLang("en")}
                  aria-pressed={lang === "en"}
                >EN</button>
              </div>
            </nav>
            <button
              className={"burger " + (open ? "is-open" : "")}
              onClick={() => setOpen(o => !o)}
              aria-label="menu"
              aria-expanded={open}
            >
              <span></span><span></span><span></span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function Hero({ t, lang, showMap }) {
  return (
    <section className="hero" id="top" data-screen-label="01 Hero">
      <div className="hero__bg" aria-hidden="true">
        <RouteMap showLines={showMap} />
      </div>
      <div className="wrap hero__inner">
        <div className="hero__copy">
          <div className="eyebrow">
            <Diamond /> <span>{t.eyebrow}</span> <Diamond />
          </div>
          <h1 className="hero__title">
            <span className="hero__title-line">{t.heroTitle[0]}</span>
            <span className="hero__title-line hero__title-line--alt">{t.heroTitle[1]}</span>
          </h1>
          <div className="hero__rule" aria-hidden="true">
            <span></span><i>{lang === "ru" ? "Бен Фенли" : "a novel by Ben Fenley"}</i><span></span>
          </div>
          <p className="hero__sub">{t.heroSubtitle}</p>
          <p className="hero__lede">{t.heroLede}</p>
          {t.heroCities && <p className="hero__cities">{t.heroCities}</p>}
          <div className="hero__ctas">
            {lang === "ru" ? (
              <>
                <a className="btn btn--primary" href={SITE_BASE + "ru/1/"}>{t.heroCtaPrimary}</a>
                <a className="btn btn--ghost" href="#telegram">{t.heroCtaTertiary} →</a>
              </>
            ) : (
              <>
                <a
                  className="btn btn--primary"
                  href="https://shortwaves.substack.com/p/chapter-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >{t.heroCtaPrimary}</a>
                <a className="btn" href="#subscribe">{t.heroCtaSecondary}</a>
              </>
            )}
          </div>
          <DialTicks labels={t.dial} />
        </div>
        <aside className="hero__vitrine" aria-label="book cover">
          <a
            className="vitrine"
            href={lang === "ru" ? (SITE_BASE + "ru/1/") : "https://shortwaves.substack.com/p/chapter-1"}
            aria-label={lang === "ru" ? "Открыть первую главу" : "Read chapter one"}
            {...(lang === "ru" ? {} : { target: "_blank", rel: "noopener noreferrer" })}
          >
            <div className="vitrine__shadow" aria-hidden="true"></div>
            <img className="vitrine__cover" src={asset(lang === "ru" ? "assets/cover-ru.jpg" : "assets/cover-en.jpg")} alt={lang === "ru" ? "Обложка «Короткие волны»" : "Short Waves cover"} />
          </a>
          <ul className="hero__meta">
            {t.heroMeta.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </aside>
      </div>
      <div className="hero__footer wrap" aria-hidden="true">
        <span>N 51° 29′ 47″</span>
        <span className="hero__footer-sep"></span>
        <span>{lang === "ru" ? "Эфирный шум · 1929" : "Atmospheric noise · 1929"}</span>
        <span className="hero__footer-sep"></span>
        <span>W 0° 12′ 35″</span>
      </div>
    </section>
  );
}

function About({ t }) {
  return (
    <section className="about" id="novel" data-screen-label="02 About">
      <div className="wrap about__inner">
        <div className="kicker">
          <span className="kicker__num">§ 01</span>
          <span className="kicker__txt">{t.aboutKicker}</span>
        </div>
        <p className="about__lead">{t.aboutLead}</p>
        <p className="about__body">{t.aboutBody}</p>
      </div>
    </section>
  );
}

function Cards({ t, lang }) {
  const slotIds = ["card-radio", "card-exile", "card-connection"];
  const slotSrcs = [
    asset("assets/card-radio.jpg"),
    asset("assets/card-exile.jpg"),
    asset("assets/card-connection.jpg"),
  ];
  const slotHints = lang === "ru"
    ? ["иллюстрация: радио", "иллюстрация: эмиграция", "иллюстрация: связи"]
    : ["illustration: radio", "illustration: exile", "illustration: connection"];
  return (
    <section className="cards" data-screen-label="03 Three cards">
      <div className="wrap">
        <div className="kicker">
          <span className="kicker__num">§ 01</span>
          <span className="kicker__txt">{t.cardsKicker}</span>
        </div>
        <div className="cards__grid">
          {t.cards.map((c, i) => (
            <article className="card" key={i}>
              <div className="card__slot">
                <image-slot
                  id={slotIds[i]}
                  shape="rect"
                  src={slotSrcs[i]}
                  placeholder={slotHints[i]}
                ></image-slot>
              </div>
              <div className="card__top">
                <span className="card__tag">{c.tag}</span>
                <RadioWaves size={28} />
              </div>
              <h3 className="card__title">{c.title}</h3>
              <p className="card__body">{c.body}</p>
              <div className="card__meta">
                <Diamond /> <span>{c.meta}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Excerpt({ t, lang }) {
  if (lang !== "ru") return null;
  return (
    <section className="excerpt" id="excerpt" data-screen-label="04 Excerpt">
      <div className="wrap excerpt__inner">
        <div className="kicker">
          <span className="kicker__num">§ 01</span>
          <span className="kicker__txt">{t.excerptKicker}</span>
        </div>
        <div className="excerpt__paper">
          <div className="excerpt__paper-edge" aria-hidden="true"></div>
          <div className="excerpt__stampbox" aria-hidden="true">
            <img src={asset("assets/stamp-levin.png")} alt="" />
          </div>
          {t.excerptHeading && <p className="excerpt__heading">{t.excerptHeading}</p>}
          <div className="excerpt__body">
            {t.excerptLines.map((item, i) => {
              if (typeof item === "string") {
                return <p className={"excerpt__line " + (i === 0 ? "is-dropcap" : "")} key={i}>{item}</p>;
              }
              if (item.kind === "sign") {
                return (
                  <div className="excerpt__sign" key={i} aria-label="shop sign">
                    <span className="excerpt__sign-title">{item.title}</span>
                    <span className="excerpt__sign-sub">{item.subtitle}</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
          <div className="excerpt__caption">
            <span>{t.excerptCaption}</span>
            <span className="excerpt__page">— 47 —</span>
          </div>
        </div>
        <a className="btn btn--primary" href={SITE_BASE + "ru/1/"}>{t.excerptCta} →</a>
      </div>
    </section>
  );
}

function ArtifactCard({ a, lang }) {
  // tiny inline glyphs per artifact — strictly primitives
  const Glyph = () => {
    switch (a.idx) {
      case "01": // QSL card -> small ruled rectangle
        return (
          <svg viewBox="0 0 60 40" className="artifact__glyph">
            <rect x="2" y="2" width="56" height="36" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <rect x="2" y="2" width="56" height="9" fill="currentColor" opacity="0.18" />
            <line x1="6" y1="20" x2="40" y2="20" stroke="currentColor" strokeWidth="0.5" />
            <line x1="6" y1="26" x2="44" y2="26" stroke="currentColor" strokeWidth="0.5" />
            <line x1="6" y1="32" x2="36" y2="32" stroke="currentColor" strokeWidth="0.5" />
            <text x="44" y="34" fontSize="6" fontFamily="JetBrains Mono, monospace" fill="currentColor">QSL</text>
          </svg>
        );
      case "02": // sailboat stamp -> use image
        return <img className="artifact__img" src={asset("assets/sailboat-stamp.png")} alt="" />;
      case "03": // shortwave map -> route lines
        return (
          <svg viewBox="0 0 60 40" className="artifact__glyph">
            <g stroke="currentColor" strokeWidth="0.3" opacity="0.4">
              {Array.from({ length: 7 }).map((_, i) => <line key={i} x1={i * 10} y1="0" x2={i * 10} y2="40" />)}
              {Array.from({ length: 5 }).map((_, i) => <line key={"h" + i} x1="0" y1={i * 10} x2="60" y2={i * 10} />)}
            </g>
            <path d="M 8 30 Q 22 8 36 22 T 54 12" fill="none" stroke="currentColor" strokeWidth="0.9" strokeDasharray="1.2 1.2" />
            <circle cx="8" cy="30" r="1.2" fill="currentColor" />
            <circle cx="36" cy="22" r="1.2" fill="currentColor" />
            <circle cx="54" cy="12" r="1.2" fill="currentColor" />
          </svg>
        );
      case "04": // coils -> stacked circles
        return (
          <svg viewBox="0 0 60 40" className="artifact__glyph">
            {[10, 20, 30, 40, 50].map((cx, i) => (
              <g key={i}>
                <circle cx={cx} cy="20" r="6" fill="none" stroke="currentColor" strokeWidth="0.8" />
                <circle cx={cx} cy="20" r="2" fill="currentColor" opacity="0.5" />
              </g>
            ))}
          </svg>
        );
      case "05": // sign -> rectangle with type
        return (
          <svg viewBox="0 0 60 40" className="artifact__glyph">
            <rect x="3" y="6" width="54" height="28" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <rect x="6" y="9" width="48" height="22" fill="none" stroke="currentColor" strokeWidth="0.3" />
            <text x="30" y="20" textAnchor="middle" fontSize="5.5" fontFamily="EB Garamond, serif" fontStyle="italic" fill="currentColor">Shortwave</text>
            <text x="30" y="27" textAnchor="middle" fontSize="5.5" fontFamily="EB Garamond, serif" fontStyle="italic" fill="currentColor">Evenings</text>
          </svg>
        );
      case "06": // RE-45 ad -> simple speaker grille
        return (
          <svg viewBox="0 0 60 40" className="artifact__glyph">
            <rect x="6" y="4" width="48" height="32" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <circle cx="30" cy="22" r="10" fill="none" stroke="currentColor" strokeWidth="0.6" />
            <circle cx="30" cy="22" r="6" fill="none" stroke="currentColor" strokeWidth="0.4" />
            <circle cx="30" cy="22" r="2" fill="currentColor" />
            <text x="30" y="11" textAnchor="middle" fontSize="3" fontFamily="JetBrains Mono, monospace" fill="currentColor">RE-45</text>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <article className="artifact">
      <div className="artifact__visual">
        <Glyph />
        <span className="artifact__idx">{a.idx}</span>
      </div>
      <div className="artifact__body">
        <h4 className="artifact__title">{a.title}</h4>
        <p className="artifact__text">{a.body}</p>
        <div className="artifact__meta">
          <span>{a.from}</span>
          <span className="artifact__dot" aria-hidden="true">·</span>
          <span>{a.date}</span>
        </div>
      </div>
    </article>
  );
}

function Artifacts({ t, lang }) {
  return (
    <section className="artifacts" id="artifacts" data-screen-label="05 Artifacts">
      <div className="wrap">
        <div className="kicker">
          <span className="kicker__num">§ 04</span>
          <span className="kicker__txt">{t.artifactsKicker}</span>
        </div>
        <p className="artifacts__lead">{t.artifactsLead}</p>
        <div className="artifacts__grid">
          {t.artifacts.map(a => <ArtifactCard a={a} lang={lang} key={a.idx} />)}
        </div>
      </div>
    </section>
  );
}

const SUBSCRIBE_FORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLScgK8ocZQGYbPJTdWAQNtBgCQP3SvIore3aVuvCNtzBNYIvgw/formResponse";
const SUBSCRIBE_FORM_EMAIL_FIELD = "entry.576959582";

function Subscribe({ t, lang }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    if (!email || !/.+@.+\..+/.test(email)) return;
    const body = new FormData();
    body.append(SUBSCRIBE_FORM_EMAIL_FIELD, email);
    fetch(SUBSCRIBE_FORM_ACTION, { method: "POST", mode: "no-cors", body }).catch(() => {});
    if (typeof window !== "undefined") {
      if (window.fbq) { try { window.fbq("track", "Lead"); } catch (_) {} }
      if (window.gtag) { try { window.gtag("event", "generate_lead", { method: "newsletter" }); } catch (_) {} }
    }
    setDone(true);
  };
  return (
    <section className="subscribe" id="subscribe" data-screen-label="06 Subscribe">
      <div className="wrap subscribe__inner">
        <div className="kicker">
          <span className="kicker__num">§ 02</span>
          <span className="kicker__txt">{t.subscribeKicker}</span>
        </div>
        <h2 className="subscribe__title">{t.subscribeTitle}</h2>
        <p className="subscribe__body">{t.subscribeBody}</p>
        <div className="subscribe__card">
          {!done ? (
            <form className="subscribe__form" onSubmit={submit}>
              <label className="field">
                <span>{t.subscribeEmail}</span>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@somewhere.com" />
              </label>
              <button className="btn btn--primary" type="submit">{t.subscribeBtn}</button>
            </form>
          ) : (
            <div className="subscribe__thanks">
              <div className="subscribe__stamp" aria-hidden="true">
                <img src={asset("assets/stamp-fenley.png")} alt="" />
              </div>
              <p className="subscribe__thanks-line">{t.subscribeThanks}</p>
            </div>
          )}
          <p className="subscribe__footnote">{t.subscribeFootnote}</p>
        </div>
      </div>
    </section>
  );
}

function Telegram({ t, lang }) {
  if (lang !== "ru") return null;
  return (
    <section className="telegram" id="telegram" data-screen-label="07 Telegram">
      <div className="wrap telegram__inner">
        <div className="telegram__left">
          <div className="kicker kicker--alt">
            <span className="kicker__num">§ 03</span>
            <span className="kicker__txt">{t.tgKicker}</span>
          </div>
          <h2 className="telegram__title">{t.tgTitle}</h2>
          <p className="telegram__body">{t.tgBody}</p>
          <a className="btn btn--primary btn--on-dark" href="https://t.me/short_waves" target="_blank" rel="noopener noreferrer">{t.tgBtn} →</a>
          <p className="telegram__meta">{t.tgMeta}</p>
        </div>
      </div>
    </section>
  );
}

function Author({ t, lang }) {
  return (
    <section className="author" id="author" data-screen-label="08 Author">
      <div className="wrap author__inner">
        <div className="author__left">
          <div className="kicker">
            <span className="kicker__num">{lang === "ru" ? "§ 04" : "§ 03"}</span>
            <span className="kicker__txt">{t.authorKicker}</span>
          </div>
          <h2 className="author__name">{t.authorName}</h2>
          <p className="author__body">{t.authorBody}</p>
          <p className="author__aside"><em>{t.authorAside}</em></p>
        </div>
      </div>
    </section>
  );
}

// ---------- Chapter page (RU only, paths like /ru/1/, /ru/2/, /ru/3/) ----------

const CHAPTER_SIZE_KEY = "sw_chapter_size";
const CHAPTER_SIZE_MIN = -1;
const CHAPTER_SIZE_MAX = 2;
function readChapterSize() {
  try {
    const v = parseInt(localStorage.getItem(CHAPTER_SIZE_KEY) || "0", 10);
    if (v >= CHAPTER_SIZE_MIN && v <= CHAPTER_SIZE_MAX) return v;
  } catch (e) {}
  return 0;
}

const CHAPTER_CTAS = [
  { label: "Читать на Литрес",       href: "https://www.litres.ru/73979788/" },
  { label: "Читать на Substack",     href: "https://benfenley.substack.com/" },
  { label: "Подписаться в Telegram", href: "https://t.me/short_waves" },
];

function ChapterPage({ num }) {
  const list = (window.SW_CHAPTERS && window.SW_CHAPTERS.ru) || [];
  const ch = list.find(c => c.num === num);
  const total = list.length;
  const [size, setSize] = useState(readChapterSize);
  const adjustSize = (delta) => {
    const next = Math.max(CHAPTER_SIZE_MIN, Math.min(CHAPTER_SIZE_MAX, size + delta));
    setSize(next);
    try { localStorage.setItem(CHAPTER_SIZE_KEY, String(next)); } catch (e) {}
  };
  if (!ch) {
    return (
      <main className="chapter">
        <div className="wrap">
          <p className="chapter__missing">Глава не найдена.</p>
          <p><a className="btn" href={SITE_BASE + "ru/"}>← На главную</a></p>
        </div>
      </main>
    );
  }
  const hasNext = num < total;
  return (
    <main className="chapter">
      <div className="wrap chapter__inner">
        <div className="chapter__topnav">
          <a href={SITE_BASE + "ru/"}>← На главную</a>
          <div className="chapter__topnav-right">
            <div className="chapter__zoom" role="group" aria-label="Размер текста">
              <button
                type="button"
                onClick={() => adjustSize(-1)}
                disabled={size <= CHAPTER_SIZE_MIN}
                aria-label="Уменьшить шрифт"
              >A−</button>
              <button
                type="button"
                onClick={() => adjustSize(1)}
                disabled={size >= CHAPTER_SIZE_MAX}
                aria-label="Увеличить шрифт"
              >A+</button>
            </div>
            <span className="chapter__topnav-meta">{`Глава ${num} из ${total}`}</span>
          </div>
        </div>
        <header className="chapter__head">
          <h1 className="chapter__num">{ch.title}</h1>
          <p className="chapter__loc">{ch.subtitle}</p>
        </header>
        <div className="chapter__body" data-size={size}>
          {ch.scenes.map((scene, si) => (
            <React.Fragment key={si}>
              {si > 0 && <div className="chapter__sep" aria-hidden="true">⁂</div>}
              {scene.map((item, pi) => {
                if (typeof item === "string") {
                  return <p className="chapter__line" key={pi}>{item}</p>;
                }
                if (item && item.kind === "block") {
                  return (
                    <div className="chapter__block" key={pi}>
                      {item.lines.map((line, li) => (
                        <span className="chapter__block-line" key={li}>{line}</span>
                      ))}
                    </div>
                  );
                }
                return null;
              })}
            </React.Fragment>
          ))}
        </div>
        <nav className="chapter__cta" aria-label="продолжение">
          {hasNext && (
            <a className="btn btn--primary chapter__cta-next" href={SITE_BASE + "ru/" + (num + 1) + "/"}>
              Глава {num + 1} →
            </a>
          )}
          <ul className="chapter__cta-list">
            {CHAPTER_CTAS.map((c, i) => (
              <li key={i}>
                <a
                  className={"btn" + (hasNext ? "" : " btn--primary")}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >{c.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}

function Footer({ t, lang }) {
  return (
    <footer className="site-footer" data-screen-label="09 Footer">
      <div className="wrap site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <span className="site-footer__title">{lang === "ru" ? "Короткие волны" : "Short Waves"}</span>
            <span className="site-footer__sub">Ben Fenley · benfenley.com</span>
          </div>
          <nav className="site-footer__links" aria-label="footer">
            {t.footerLinks.map((l, i) => {
              const ext = /^https?:/.test(l.href);
              return (
                <a href={l.href} key={i} {...(ext && { target: "_blank", rel: "noopener noreferrer" })}>{l.label}</a>
              );
            })}
          </nav>
        </div>
        <div className="site-footer__rule" aria-hidden="true"></div>
        <div className="site-footer__bottom">
          <span>{t.footerNote}</span>
          <span className="site-footer__colophon">{t.footerColophon}</span>
        </div>
      </div>
    </footer>
  );
}

// ---------- Tweaks panel ----------

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "lang": "ru",
  "surface": "paper",
  "accent": "purple",
  "showMap": true
}/*EDITMODE-END*/;

function Tweaks({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Language">
        <TweakRadio
          value={tweaks.lang}
          onChange={v => setTweak("lang", v)}
          options={[{ value: "ru", label: "RU" }, { value: "en", label: "EN" }]}
        />
      </TweakSection>
      <TweakSection title="Surface">
        <TweakRadio
          value={tweaks.surface}
          onChange={v => setTweak("surface", v)}
          options={[{ value: "paper", label: "Paper" }, { value: "night", label: "Radio salon" }]}
        />
      </TweakSection>
      <TweakSection title="Accent">
        <TweakColor
          value={tweaks.accent}
          onChange={v => setTweak("accent", v)}
          options={[
            { value: "purple", color: "#3a2a5e", label: "Stamp purple" },
            { value: "oxblood", color: "#7a2a2a", label: "Oxblood" },
            { value: "green", color: "#2f4a35", label: "Deep green" },
            { value: "navy", color: "#1d2a44", label: "Navy" },
          ]}
        />
      </TweakSection>
      <TweakSection title="Route map">
        <TweakToggle
          value={tweaks.showMap}
          onChange={v => setTweak("showMap", v)}
          label="Show route lines"
        />
      </TweakSection>
    </TweaksPanel>
  );
}

// ---------- App root ----------

function App() {
  const [tweaks, setTweaks] = useTweaks({
    ...DEFAULTS,
    ...(INITIAL_LANG_FROM_URL ? { lang: INITIAL_LANG_FROM_URL } : {}),
  });
  const setTweak = (k, v) => setTweaks({ [k]: v });
  const lang = tweaks.lang;
  const t = window.SW_CONTENT[lang];

  const setLang = (newLang) => {
    setTweak("lang", newLang);
    try {
      const newPath = SITE_BASE + newLang + "/";
      const url = newPath + window.location.search + window.location.hash;
      window.history.pushState({ lang: newLang }, "", url);
    } catch {}
  };

  // sync <html lang>
  useEffect(() => {
    document.documentElement.lang = lang;
    const chList = window.SW_CHAPTERS && window.SW_CHAPTERS.ru;
    const ch = INITIAL_CHAPTER !== null && lang === "ru" && chList
      ? chList.find(c => c.num === INITIAL_CHAPTER)
      : null;
    document.title = ch
      ? `${ch.title} — Короткие волны`
      : (lang === "ru" ? "Короткие волны — роман Бена Фенли" : "Short Waves — a novel by Ben Fenley");
    document.body.dataset.surface = tweaks.surface;
    document.body.dataset.accent = tweaks.accent;
  }, [lang, tweaks.surface, tweaks.accent]);

  // react to back/forward navigation between /ru, /en, and base
  useEffect(() => {
    const onPop = () => {
      const { lang: l } = detectSiteAndLang();
      if (l && l !== lang) setTweak("lang", l);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [lang]);

  const isChapter = INITIAL_CHAPTER !== null && lang === "ru";

  return (
    <div className="site" data-lang={lang} data-route={isChapter ? "chapter" : "home"}>
      <Header t={t} lang={lang} onLang={setLang} minimal={isChapter} />
      {isChapter ? (
        <ChapterPage num={INITIAL_CHAPTER} />
      ) : (
        <main>
          <Hero t={t} lang={lang} showMap={tweaks.showMap} />
          <Excerpt t={t} lang={lang} />
          <Subscribe t={t} lang={lang} />
          <Telegram t={t} lang={lang} />
          <Author t={t} lang={lang} />
        </main>
      )}
      <Footer t={t} lang={lang} />
      <Tweaks tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
