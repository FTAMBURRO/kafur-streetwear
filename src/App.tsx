import { useEffect, useMemo, useState } from "react";
import { LanguageContext, messages, useLanguage, type Language } from "./i18n";
import Drop001Cinematic from "./components/drop001/Drop001Cinematic";
import KafurDepthHero from "./components/hero/KafurDepthHero";
import LogoInterlude from "./components/hero/LogoInterlude";

type Page = "home" | "shop" | "product" | "collections" | "about" | "cart";
type CartItem = { id: number; size: string; quantity: number };

const photos = {
  campaign: "https://images.unsplash.com/photo-1635650804060-bb009bcb2ea5?auto=format&fit=crop&w=1600&q=88",
  about: "https://images.unsplash.com/photo-1705944910791-887c4ed535c8?auto=format&fit=crop&w=1400&q=88",
  editorial: "https://images.unsplash.com/photo-1635650804483-2a77a8c9e728?auto=format&fit=crop&w=1400&q=88",
};

const products = [
  {
    id: 1,
    code: "KFR-001",
    name: "OBSERVATION",
    price: 58000,
    color: "OFF WHITE",
    image: "https://images.unsplash.com/photo-1615525694019-4a674aca7783?auto=format&fit=crop&w=1000&q=88",
    alternate: "https://images.unsplash.com/photo-1559697242-a465f2578a95?auto=format&fit=crop&w=1000&q=88",
  },
  {
    id: 2,
    code: "KFR-002",
    name: "ALL EYES ON NOTHING",
    price: 62000,
    color: "WASHED BLACK",
    image: "https://images.unsplash.com/photo-1661110546797-d86cc72a2765?auto=format&fit=crop&w=1000&q=88",
    alternate: "https://images.unsplash.com/photo-1518590713842-629f89f09c9f?auto=format&fit=crop&w=1000&q=88",
  },
  {
    id: 3,
    code: "KFR-003",
    name: "AFTERIMAGE",
    price: 58000,
    color: "BONE",
    image: "https://images.unsplash.com/photo-1657779650831-2e2b6d5fa314?auto=format&fit=crop&w=1000&q=88",
    alternate: "https://images.unsplash.com/photo-1659522761084-79196b64abe4?auto=format&fit=crop&w=1000&q=88",
  },
  {
    id: 4,
    code: "KFR-004",
    name: "DIVINE ERROR",
    price: 64000,
    color: "BLACK",
    image: "https://images.unsplash.com/photo-1778759335271-91d85dacaf96?auto=format&fit=crop&w=1000&q=88",
    alternate: "https://images.unsplash.com/photo-1618453292507-4959ece6429e?auto=format&fit=crop&w=1000&q=88",
  },
];

const money = (value: number, language: Language) =>
  new Intl.NumberFormat(language === "es" ? "es-AR" : "en-US", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

const productName = (id: number, t: ReturnType<typeof useLanguage>["t"]) =>
  [t.productNames.observation, t.productNames.eyes, t.productNames.afterimage, t.productNames.divine][id - 1] ?? "";

const productColor = (id: number, t: ReturnType<typeof useLanguage>["t"]) =>
  [t.colors.offWhite, t.colors.washedBlack, t.colors.bone, t.colors.black][id - 1] ?? "";

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`brand ${inverse ? "brand--inverse" : ""}`} aria-label="KAFUR">
      <img src="/assets/kafur-logo.png" alt="KAFUR" />
    </div>
  );
}

function Button({
  children,
  onClick,
  inverse = false,
  wide = false,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  inverse?: boolean;
  wide?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={`button ${inverse ? "button--inverse" : ""} ${wide ? "button--wide" : ""}`}
      onClick={onClick}
    >
      <span>{children}</span>
      <span aria-hidden="true">↗</span>
    </button>
  );
}

function Header({
  page,
  cartCount,
  navigate,
  openCart,
}: {
  page: Page;
  cartCount: number;
  navigate: (page: Page) => void;
  openCart: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const go = (next: Page) => {
    navigate(next);
    setMenuOpen(false);
  };

  return (
    <>
      <header className="header">
        <button className="logo-button" onClick={() => go("home")} aria-label={t.nav.home}>
          <Brand />
        </button>
        <nav className="nav" aria-label={t.nav.primary}>
          <button className={page === "shop" ? "is-active" : ""} onClick={() => go("shop")}>{t.nav.shop}</button>
          <button className={page === "collections" ? "is-active" : ""} onClick={() => go("collections")}>{t.nav.collections}</button>
          <button className={page === "about" ? "is-active" : ""} onClick={() => go("about")}>{t.nav.about}</button>
        </nav>
        <div className="header-actions">
          <button className="bag-link" onClick={openCart}>{t.nav.bag} <span>[{cartCount}]</span></button>
          <button
            className="language-switch"
            type="button"
            role="switch"
            aria-label={language === "es" ? t.switch.toEnglish : t.switch.toSpanish}
            aria-checked={language === "en"}
            title={language === "es" ? t.switch.toEnglish : t.switch.toSpanish}
            data-language={language}
            onClick={() => setLanguage(language === "es" ? "en" : "es")}
          >
            <span className={language === "es" ? "is-selected" : ""}>ES</span>
            <span className={language === "en" ? "is-selected" : ""}>EN</span>
          </button>
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
            {menuOpen ? t.nav.close : t.nav.menu}
          </button>
        </div>
      </header>
      {menuOpen && (
        <nav className="mobile-nav" aria-label={t.nav.menuLabel}>
          <span>{t.nav.menuLabel}</span>
          <button onClick={() => go("shop")}>{t.nav.shop}</button>
          <button onClick={() => go("collections")}>{t.nav.collections}</button>
          <button onClick={() => go("about")}>{t.nav.about}</button>
          <button onClick={openCart}>{t.nav.bag} [{cartCount}]</button>
          <small>{t.nav.location}</small>
        </nav>
      )}
    </>
  );
}

function ProductCard({
  product,
  index,
  onSelect,
}: {
  product: (typeof products)[number];
  index: number;
  onSelect: () => void;
}) {
  const { language, t } = useLanguage();
  const name = productName(product.id, t);
  const color = productColor(product.id, t);
  return (
    <article className="product-card" onClick={onSelect}>
      <button className="product-card__image" aria-label={t.product.view.replace("{name}", name)}>
        <img src={product.image} alt={t.product.alt.replace("{name}", name)} />
        <img className="product-card__alternate" src={product.alternate} alt="" />
        <span className="product-card__quick">{t.product.quickView} ↗</span>
      </button>
      <div className="product-card__meta">
        <div>
          <span>{String(index + 1).padStart(2, "0")} / {product.code}</span>
          <h3>{name}</h3>
        </div>
        <p>{money(product.price, language)}</p>
      </div>
      <p className="product-card__color">{color} / {t.product.cotton}</p>
    </article>
  );
}

function SectionHeader({ number, title, side }: { number: string; title: string; side?: string }) {
  return (
    <div className="section-header">
      <span>{number}</span>
      <h2>{title}</h2>
      <span>{side}</span>
    </div>
  );
}

function Home({ navigate }: { navigate: (page: Page) => void }) {
  const { language, t } = useLanguage();
  return (
    <main>
      {/* 1 — HERO KAFUR: imagen definitiva intacta, fijada con recorrido.
          El carrusel DROP 001 queda segundo. */}
      <div className="hero-pin">
        <KafurDepthHero language={language} onExplore={() => navigate("shop")} />
      </div>
      {/* Momento de oscuridad: el logo clavado, entre la foto y el carrusel. */}
      <LogoInterlude />

      <Drop001Cinematic language={language} onExplore={() => navigate("shop")} />

      <section className="products-section">
        <SectionHeader number="01" title={t.home.releases} side={t.home.limited} />
        <div className="product-grid">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} onSelect={() => navigate("product")} />
          ))}
        </div>
      </section>

      <section className="manifesto-strip">
        <p>{t.home.manifestoFirst}</p>
        <span>KFR — BUENOS AIRES</span>
        <p>{t.home.manifestoLast}</p>
      </section>

      <section className="campaign">
        <div className="campaign__image">
          <img src={photos.campaign} alt={t.home.campaignAlt2} />
          <span>{t.home.campaignLabel}</span>
        </div>
        <div className="campaign__copy">
          <span>{t.home.editorial}</span>
          <h2>{t.home.campaignTitle.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h2>
          <p>{t.home.campaignText}</p>
          <Button onClick={() => navigate("collections")}>{t.home.viewCampaign}</Button>
        </div>
      </section>

      <section className="shop-all">
        <div>
          <span>{t.home.fullCollection}</span>
          <h2>{t.home.shopHeadline}<br /><em>{t.home.shopEmphasis}</em></h2>
        </div>
        <Button onClick={() => navigate("shop")} wide>{t.home.shopAll}</Button>
      </section>

      <section className="identity">
        <div className="identity__number">K / 01</div>
        <div className="identity__copy">
          <span>{t.home.about}</span>
          <p>{t.home.aboutText}</p>
          <button onClick={() => navigate("about")}>{t.home.story} <span>→</span></button>
        </div>
      </section>
    </main>
  );
}

function Shop({ navigate }: { navigate: (page: Page) => void }) {
  const { t } = useLanguage();
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeSize, setActiveSize] = useState("ALL");
  return (
    <main className="page page--shop">
      <div className="shop-intro">
        <span>{t.shop.catalogue}</span>
        <h1>{t.nav.shop}<br /><em>{t.shop.all}</em></h1>
        <p>DROP 001<br />{t.shop.pieces}</p>
      </div>
      <div className="shop-tools">
        <button onClick={() => setFilterOpen(!filterOpen)}>{t.shop.filters} <span>{filterOpen ? "−" : "+"}</span></button>
        <span>{t.shop.results}</span>
        <button>{t.shop.sort} {t.shop.featured} <span>↓</span></button>
      </div>
      {filterOpen && (
        <div className="filter-panel">
          <div><span>{t.shop.size}</span><div className="filter-options">{[t.shop.allSizes, "S", "M", "L", "XL"].map((size) => <button key={size} className={activeSize === (size === t.shop.allSizes ? "ALL" : size) ? "active" : ""} onClick={() => setActiveSize(size === t.shop.allSizes ? "ALL" : size)}>{size}</button>)}</div></div>
          <div><span>{t.shop.color}</span><div className="filter-options"><button>{t.colors.black}</button><button>{t.colors.offWhite}</button></div></div>
            <div><span>{t.shop.collection}</span><div className="filter-options"><button className="active">DROP 001</button></div></div>
            <div><span>{t.shop.price}</span><div className="filter-options"><button>{t.shop.price === "PRECIO" ? "$50.000 — $65.000" : "$50,000 — $65,000"}</button></div></div>
        </div>
      )}
      <div className="product-grid product-grid--catalogue">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} onSelect={() => navigate("product")} />
        ))}
      </div>
      <div className="shop-end"><span>{t.shop.end}</span><Brand /></div>
    </main>
  );
}

function ProductDetail({ addToCart }: { addToCart: (size: string) => void }) {
  const { language, t } = useLanguage();
  const [size, setSize] = useState("M");
  const [guideOpen, setGuideOpen] = useState(false);
  const product = products[0];
  const name = productName(product.id, t);
  const color = productColor(product.id, t);
  return (
    <main className="page product-detail">
      <div className="product-gallery">
        <figure className="product-gallery__primary"><img src={product.image} alt={`${name} — ${t.product.front.toLowerCase()}`} /><span>01 / {t.product.front}</span></figure>
        <figure><img src={product.alternate} alt={`${name} — ${t.product.fit.toLowerCase()}`} /><span>02 / {t.product.fit}</span></figure>
        <figure><img src={photos.editorial} alt={`${name} — ${t.product.detail.toLowerCase()}`} /><span>03 / {t.product.detail}</span></figure>
      </div>
      <aside className="product-info">
        <span>{product.code} / DROP 001</span>
        <h1>{name}</h1>
        <p className="product-info__price">{money(product.price, language)}</p>
        <p className="product-info__description">{t.product.description}</p>
        <div className="color-row"><span>{t.product.color}</span><strong><i /> {color}</strong></div>
        <div className="size-heading"><span>{t.product.size}</span><button onClick={() => setGuideOpen(!guideOpen)}>{t.product.sizeGuide} ↗</button></div>
        <div className="sizes">{["S", "M", "L", "XL"].map((item) => <button key={item} className={size === item ? "active" : ""} onClick={() => setSize(item)}>{item}</button>)}</div>
        {guideOpen && <div className="size-guide"><span>{t.product.fit}</span><p>S 54cm / M 57cm / L 60cm / XL 63cm</p></div>}
        <Button onClick={() => addToCart(size)} wide>{t.product.addToBag} — {money(product.price, language)}</Button>
        <div className="product-notes"><p>{t.product.freeShipping}</p><p>{t.product.installments}</p><p>{t.product.madeIn}</p></div>
      </aside>
    </main>
  );
}

function Collections({ navigate }: { navigate: (page: Page) => void }) {
  const { t } = useLanguage();
  return (
    <main className="page">
      <section className="collection-hero">
        <img src={photos.campaign} alt={t.collections.alt} />
        <div><span>{t.collections.collection}</span><h1>{t.collections.headline}<br /><em>{t.collections.resistance}</em></h1><Button onClick={() => navigate("shop")} inverse>{t.collections.shopDrop}</Button></div>
      </section>
      <section className="collection-statement">
        <span>{t.collections.concept}</span>
        <p>{t.collections.statement}</p>
        <span>{t.collections.limited}</span>
      </section>
      <section className="products-section">
        <SectionHeader number="01" title="DROP 001" side={t.collections.available} />
        <div className="product-grid">
          {products.map((product, index) => <ProductCard key={product.id} product={product} index={index} onSelect={() => navigate("product")} />)}
        </div>
      </section>
    </main>
  );
}

function About() {
  const { t } = useLanguage();
  return (
    <main className="page about">
      <section className="about__title"><span>{t.aboutPage.heading}</span><h1>{t.aboutPage.keep}<br /><em>{t.aboutPage.look}</em></h1><p>{t.aboutPage.place.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</p></section>
      <section className="about__story">
        <div><img src={photos.about} alt={t.aboutPage.alt} /><span>KAFUR / BUENOS AIRES</span></div>
        <div><span>{t.aboutPage.pointOfView}</span><h2>{t.aboutPage.title}</h2><p>{t.aboutPage.paragraph1}</p><p>{t.aboutPage.paragraph2}</p></div>
      </section>
      <section className="about__values"><div><span>01</span><h3>{t.aboutPage.individuality}</h3><p>{t.aboutPage.individualityText}</p></div><div><span>02</span><h3>{t.aboutPage.intention}</h3><p>{t.aboutPage.intentionText}</p></div><div><span>03</span><h3>{t.aboutPage.localCulture}</h3><p>{t.aboutPage.localCultureText}</p></div></section>
    </main>
  );
}

function CartContents({
  cart,
  updateQuantity,
  navigate,
}: {
  cart: CartItem[];
  updateQuantity: (quantity: number) => void;
  navigate: (page: Page) => void;
}) {
  const { language, t } = useLanguage();
  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = quantity * products[0].price;
  if (!cart.length) return <div className="empty-cart"><h2>{t.cart.emptyTitle}</h2><p>{t.cart.emptyText}</p><Button onClick={() => navigate("shop")}>{t.cart.explore}</Button></div>;
  return (
    <div className="cart-content">
      <div className="cart-item">
        <img src={products[0].image} alt={t.cart.imageAlt.replace("{name}", productName(products[0].id, t))} />
        <div><span>{products[0].code}</span><h3>{productName(products[0].id, t)}</h3><p>{productColor(products[0].id, t)} / {t.cart.size} {cart[0].size}</p><div className="quantity"><button onClick={() => updateQuantity(Math.max(0, quantity - 1))} aria-label={t.cart.decrease}>−</button><span>{quantity}</span><button onClick={() => updateQuantity(quantity + 1)} aria-label={t.cart.increase}>+</button></div><button className="remove" onClick={() => updateQuantity(0)}>{t.cart.remove}</button></div>
        <strong>{money(subtotal, language)}</strong>
      </div>
      <div className="cart-summary"><div><span>{t.cart.subtotal}</span><strong>{money(subtotal, language)}</strong></div><p>{t.cart.shippingCalculated}</p><Button wide>{t.cart.checkout}</Button><small>{t.cart.installmentsAvailable}</small></div>
    </div>
  );
}

function CartDrawer({
  open,
  close,
  cart,
  updateQuantity,
  navigate,
}: {
  open: boolean;
  close: () => void;
  cart: CartItem[];
  updateQuantity: (quantity: number) => void;
  navigate: (page: Page) => void;
}) {
  const { t } = useLanguage();
  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <div className={`drawer-shell ${open ? "open" : ""}`} aria-hidden={!open}>
      <button className="drawer-backdrop" onClick={close} aria-label={t.cart.close} />
      <aside className="cart-drawer">
        <div className="drawer-heading"><h2>{t.cart.heading} [{quantity}]</h2><button onClick={close}>{t.cart.close} ×</button></div>
        <CartContents cart={cart} updateQuantity={updateQuantity} navigate={(page) => { close(); navigate(page); }} />
        {!!cart.length && <button className="view-bag" onClick={() => { close(); navigate("cart"); }}>{t.cart.viewFull} →</button>}
      </aside>
    </div>
  );
}

function CartPage({ cart, updateQuantity, navigate }: { cart: CartItem[]; updateQuantity: (quantity: number) => void; navigate: (page: Page) => void }) {
  const { t } = useLanguage();
  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  return <main className="page cart-page"><div className="cart-page__heading"><span>04 — {t.cart.checkout}</span><h1>{t.cart.heading} <em>[{quantity}]</em></h1></div><CartContents cart={cart} updateQuantity={updateQuantity} navigate={navigate} /></main>;
}

function Footer() {
  const { t } = useLanguage();
  return (
    <footer>
      <section className="newsletter">
        <div><span>{t.footer.privateAccess}</span><h2>{t.footer.innerCircle.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{index > 0 ? <em>{line}</em> : line}</span>)}</h2></div>
        <form onSubmit={(event) => event.preventDefault()}><label htmlFor="email">{t.footer.email}</label><div><input id="email" type="email" placeholder={t.footer.placeholder} /><button type="submit">{t.footer.join} ↗</button></div><small>{t.footer.newsletter}</small></form>
      </section>
      <section className="footer-main">
        <Brand inverse />
        <div><span>{t.footer.navigation}</span><button>{t.nav.shop}</button><button>{t.nav.collections}</button><button>{t.nav.about}</button></div>
        <div><span>{t.footer.information}</span><button>{t.footer.shipping}</button><button>{t.footer.returns}</button><button>{t.footer.sizeGuide}</button></div>
        <div><span>{t.footer.social}</span><button>INSTAGRAM ↗</button><button>TIKTOK ↗</button></div>
      </section>
      <div className="footer-bottom"><span>© KAFUR 2025</span><span>{t.footer.designed}</span><span>{t.footer.region}</span></div>
    </footer>
  );
}

export default function App() {
  const [language, setLanguage] = useState<Language>(() => window.localStorage.getItem("kafur-language") === "en" ? "en" : "es");
  const [page, setPage] = useState<Page>("home");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const t = messages[language];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);
  useEffect(() => {
    window.localStorage.setItem("kafur-language", language);
    document.documentElement.lang = language;
    document.title = language === "es" ? "KAFUR — Streetwear de Buenos Aires" : "KAFUR — Buenos Aires Streetwear";
  }, [language]);
  const navigate = (next: Page) => setPage(next);
  const addToCart = (size: string) => {
    setCart([{ id: 1, size, quantity: cartCount + 1 }]);
    setCartOpen(true);
  };
  const updateQuantity = (quantity: number) => setCart(quantity ? [{ id: 1, size: cart[0]?.size || "M", quantity }] : []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <div className="app">
        <div className="site-chrome">
          <div className="announcement"><span>{t.announcement.shipping}</span><span>{t.announcement.drop}</span><span>{t.announcement.location}</span></div>
          <Header page={page} cartCount={cartCount} navigate={navigate} openCart={() => setCartOpen(true)} />
        </div>
        {page === "home" && <Home navigate={navigate} />}
        {page === "shop" && <Shop navigate={navigate} />}
        {page === "product" && <ProductDetail addToCart={addToCart} />}
        {page === "collections" && <Collections navigate={navigate} />}
        {page === "about" && <About />}
        {page === "cart" && <CartPage cart={cart} updateQuantity={updateQuantity} navigate={navigate} />}
        <Footer />
        <CartDrawer open={cartOpen} close={() => setCartOpen(false)} cart={cart} updateQuantity={updateQuantity} navigate={navigate} />
      </div>
    </LanguageContext.Provider>
  );
}
