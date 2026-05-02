const { useEffect, useMemo, useRef, useState } = React;

type Category = "Pizza" | "Drinks" | "Snacks" | "Desserts";
type Tab = "home" | "favorites" | "profile";
type PizzaSize = "S" | "M" | "L";

type TelegramUser = {
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

type Product = {
  id: number;
  category: Category;
  title: string;
  description: string;
  image: string;
  sizes: Record<PizzaSize, number>;
};

type CartItem = {
  id: number;
  size: PizzaSize;
  title: string;
  price: number;
  quantity: number;
  image: string;
};

type ProductSelections = Record<number, { size: PizzaSize; quantity: number }>;

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        colorScheme?: "light" | "dark";
        themeParams?: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          button_color?: string;
          secondary_bg_color?: string;
        };
        initDataUnsafe?: {
          user?: TelegramUser;
        };
        MainButton?: {
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
      };
    };
  }
}

const categories: Category[] = ["Pizza", "Drinks", "Snacks", "Desserts"];

const categoryLabels: Record<Category, string> = {
  Pizza: "Пицца",
  Drinks: "Напитки",
  Snacks: "Закуски",
  Desserts: "Десерты"
};

const products: Product[] = [
  {
    id: 1,
    category: "Pizza",
    title: "Пепперони",
    description: "Острые ломтики пепперони, моцарелла и насыщенный томатный соус.",
    image: "https://images.pexels.com/photos/803290/pexels-photo-803290.jpeg?auto=compress&cs=tinysrgb&w=900",
    sizes: { S: 8, M: 10, L: 12 }
  },
  {
    id: 2,
    category: "Pizza",
    title: "Мексиканская",
    description: "Халапеньо, кукуруза, сладкий перец и яркий пикантный вкус.",
    image: "https://images.pexels.com/photos/10578835/pexels-photo-10578835.jpeg?auto=compress&cs=tinysrgb&w=900",
    sizes: { S: 9, M: 11, L: 13 }
  },
  {
    id: 3,
    category: "Pizza",
    title: "Четыре сыра",
    description: "Моцарелла, пармезан, дорблю и чеддер.",
    image: "https://images.pexels.com/photos/13214436/pexels-photo-13214436.jpeg?auto=compress&cs=tinysrgb&w=900",
    sizes: { S: 10, M: 12, L: 14 }
  },
  {
    id: 4,
    category: "Pizza",
    title: "Маргарита",
    description: "Свежий базилик, томатный соус и нежная моцарелла.",
    image: "https://images.pexels.com/photos/14590497/pexels-photo-14590497.jpeg?auto=compress&cs=tinysrgb&w=900",
    sizes: { S: 7, M: 9, L: 11 }
  }
];

const fallbackUser: TelegramUser = {
  first_name: "Гость",
  username: "pizza_lover"
};

const iconClassName = "h-5 w-5";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 9.5V21h13V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={iconClassName} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="m12 20.5-1.2-1.1C5.9 15 3 12.3 3 8.9 3 6.1 5.2 4 8 4c1.6 0 3.2.7 4 2 0.8-1.3 2.4-2 4-2 2.8 0 5 2.1 5 4.9 0 3.4-2.9 6.1-7.8 10.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21a8 8 0 1 0-16 0" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L21 7H7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="19" r="1.5" />
      <circle cx="18" cy="19" r="1.5" />
    </svg>
  );
}

function App() {
  const tg = window.Telegram?.WebApp;
  const mainButtonHandlerRef = useRef<(() => void) | null>(null);
  const lastScrollYRef = useRef(0);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [activeCategory, setActiveCategory] = useState<Category>("Pizza");
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const [headerHidden, setHeaderHidden] = useState(false);
  const [user] = useState<TelegramUser>(tg?.initDataUnsafe?.user || fallbackUser);
  const [theme] = useState(() => {
    const isDark = tg?.colorScheme === "dark";
    return {
      isDark,
      bg: tg?.themeParams?.bg_color || (isDark ? "#21130d" : "#fff7f0"),
      text: tg?.themeParams?.text_color || (isDark ? "#fff7ed" : "#2b1608"),
      hint: tg?.themeParams?.hint_color || (isDark ? "#f3bb91" : "#9a5a2d"),
      secondary: tg?.themeParams?.secondary_bg_color || (isDark ? "#341d10" : "#fff1e6"),
      accent: tg?.themeParams?.button_color || "#ff6900"
    };
  });
  const [selections, setSelections] = useState<ProductSelections>(() =>
    products.reduce((accumulator, product) => {
      accumulator[product.id] = { size: "M", quantity: 1 };
      return accumulator;
    }, {} as ProductSelections)
  );

  useEffect(() => {
    document.body.style.overscrollBehavior = "none";
    tg?.ready();
    tg?.expand();
  }, [tg]);

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollYRef.current;
      const passedThreshold = currentScrollY > 24;

      if (isScrollingDown && passedThreshold) {
        setHeaderHidden(true);
      } else {
        setHeaderHidden(false);
      }

      lastScrollYRef.current = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const storedCart = localStorage.getItem("pizza-mini-cart");
    const storedFavorites = localStorage.getItem("pizza-mini-favorites");

    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      } catch (error) {
        setCart([]);
      }
    }

    if (storedFavorites) {
      try {
        const parsedFavorites = JSON.parse(storedFavorites);
        if (Array.isArray(parsedFavorites)) {
          setFavorites(parsedFavorites);
        }
      } catch (error) {
        setFavorites([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pizza-mini-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("pizza-mini-favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const timer = notice ? window.setTimeout(() => setNotice(""), 2000) : null;
    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [notice]);

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  useEffect(() => {
    if (!tg?.MainButton) {
      return;
    }

    const handler = () => {
      window.alert("Заказ оформлен");
      setCart([]);
      setCartOpen(false);
      setNotice("Заказ успешно оформлен");
    };

    if (mainButtonHandlerRef.current) {
      tg.MainButton.offClick(mainButtonHandlerRef.current);
    }

    mainButtonHandlerRef.current = handler;

    if (cartOpen && totalItems > 0) {
      tg.MainButton.setText(`Оплатить ${totalPrice}$`);
      tg.MainButton.show();
      tg.MainButton.onClick(handler);
    } else {
      tg.MainButton.hide();
    }

    return () => {
      tg.MainButton?.offClick(handler);
    };
  }, [cartOpen, tg, totalItems, totalPrice]);

  const filteredProducts = useMemo(() => {
    if (activeTab === "favorites") {
      return products.filter((product) => favorites.includes(product.id));
    }

    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, activeTab, favorites]);

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "Гость";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function updateSelection(productId: number, nextSelection: Partial<{ size: PizzaSize; quantity: number }>) {
    setSelections((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        ...nextSelection
      }
    }));
  }

  function toggleFavorite(productId: number) {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }

  function addToCart(product: Product) {
    const selection = selections[product.id];
    const itemKey = `${product.id}-${selection.size}`;
    const nextPrice = product.sizes[selection.size];

    setCart((prev) => {
      const existingItem = prev.find((item) => `${item.id}-${item.size}` === itemKey);

      if (existingItem) {
        return prev.map((item) =>
          `${item.id}-${item.size}` === itemKey
            ? { ...item, quantity: item.quantity + selection.quantity }
            : item
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          size: selection.size,
          title: product.title,
          price: nextPrice,
          quantity: selection.quantity,
          image: product.image
        }
      ];
    });

    setNotice("Добавлено в корзину");
  }

  function changeCartQuantity(id: number, size: PizzaSize, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id || item.size !== size) {
            return item;
          }

          return {
            ...item,
            quantity: item.quantity + delta
          };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeCartItem(id: number, size: PizzaSize) {
    setCart((prev) => prev.filter((item) => !(item.id === id && item.size === size)));
  }

  function renderProductGrid(productsToRender: Product[]) {
    return (
      <div className="mt-5 grid gap-4 pb-28">
        {productsToRender.map((product) => {
          const selection = selections[product.id];
          const isFavorite = favorites.includes(product.id);
          const currentPrice = product.sizes[selection.size];

          return (
            <article
              key={product.id}
              className="overflow-hidden rounded-[30px] border border-[#ffd7ba] bg-white shadow-[0_18px_38px_rgba(208,117,49,0.12)]"
            >
              <div className="relative">
                <img src={product.image} alt={product.title} className="h-56 w-full object-cover" />
                <div className="absolute left-4 top-4 rounded-full bg-[#fff4eb] px-3 py-1 text-xs font-bold text-[#ff6900]">
                  Хит
                </div>
                <button
                  type="button"
                  onClick={() => toggleFavorite(product.id)}
                  className={`absolute right-4 top-4 rounded-full p-2 transition ${
                    isFavorite ? "bg-[#ff6900] text-white" : "bg-white/95 text-[#7b4b2a]"
                  }`}
                  aria-label="Добавить в избранное"
                >
                  <HeartIcon filled={isFavorite} />
                </button>
              </div>

              <div className="space-y-4 p-4">
                <div>
                  <h2 className="text-xl font-extrabold text-[#2b1608]">{product.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-[#8a5a34]">{product.description}</p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-2">
                    {(["S", "M", "L"] as PizzaSize[]).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => updateSelection(product.id, { size })}
                        className={`h-9 w-9 rounded-full text-sm font-bold transition ${
                          selection.size === size
                            ? "bg-[#2b1608] text-white"
                            : "bg-[#fff1e6] text-[#8e5d36]"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-full bg-[#fff1e6] p-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateSelection(product.id, { quantity: Math.max(1, selection.quantity - 1) })}
                        className="h-8 w-8 rounded-full bg-white text-lg font-semibold text-[#7b4b2a] shadow-sm"
                      >
                        -
                      </button>
                      <span className="min-w-5 text-center text-sm font-bold text-[#2b1608]">{selection.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateSelection(product.id, { quantity: selection.quantity + 1 })}
                        className="h-8 w-8 rounded-full bg-white text-lg font-semibold text-[#7b4b2a] shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-2xl font-extrabold text-[#2b1608]">${currentPrice}</div>
                    <div className="text-xs text-[#b06a3e]">Цена зависит от размера</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    className="rounded-2xl bg-[#ff6900] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(255,105,0,0.28)] transition active:scale-[0.98]"
                  >
                    В корзину
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {!productsToRender.length && (
          <div className="rounded-[28px] bg-white p-6 text-center text-sm text-[#8a5a34] shadow-[0_16px_34px_rgba(208,117,49,0.12)]">
            Здесь пока ничего нет.
          </div>
        )}
      </div>
    );
  }

  function renderHomeContent() {
    return (
      <>
        <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setActiveTab("home");
                setActiveCategory(category);
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeCategory === category && activeTab === "home"
                  ? "bg-[#ff6900] text-white shadow-[0_12px_24px_rgba(255,105,0,0.28)]"
                  : "bg-white text-[#8e4d23] shadow-[0_8px_18px_rgba(255,105,0,0.08)]"
              }`}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>
        {renderProductGrid(filteredProducts)}
      </>
    );
  }

  function renderFavoritesContent() {
    return (
      <div className="pt-4">
        <div className="mb-4 text-sm font-medium text-[#9a5a2d]">Сохранённые пиццы для быстрого заказа</div>
        {favorites.length ? renderProductGrid(filteredProducts) : (
          <div className="rounded-[28px] bg-white p-6 text-center text-sm text-[#8a5a34] shadow-[0_16px_34px_rgba(208,117,49,0.12)]">
            Добавьте пиццы в избранное через иконку сердца.
          </div>
        )}
      </div>
    );
  }

  function renderProfileContent() {
    return (
      <div className="space-y-4 pb-28 pt-4">
        <section className="rounded-[28px] border border-[#ffd7ba] bg-white p-5 shadow-[0_16px_34px_rgba(208,117,49,0.12)]">
          <div className="flex items-center gap-4">
            {user.photo_url ? (
              <img src={user.photo_url} alt={displayName} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1e6] text-lg font-bold text-[#ff6900]">
                {initials}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-[#2b1608]">{displayName}</h2>
              <p className="text-sm text-[#8a5a34]">@{user.username || "telegram_user"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#ffd7ba] bg-white p-5 shadow-[0_16px_34px_rgba(208,117,49,0.12)]">
          <h3 className="text-base font-semibold text-[#2b1608]">Telegram Web App</h3>
          <div className="mt-3 space-y-2 text-sm text-[#8a5a34]">
            <p>Тема: {theme.isDark ? "Тёмная" : "Светлая"}</p>
            <p>Фон: {theme.bg}</p>
            <p>Цвет текста: {theme.text}</p>
            <p>Сохранено в избранном: {favorites.length}</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(180deg, ${theme.bg} 0%, ${theme.isDark ? "#2f1b11" : "#fff4e7"} 58%, ${theme.isDark ? "#1b120d" : "#fffaf5"} 100%)`,
        color: theme.text
      }}
    >
      <div className="mx-auto max-w-md px-4 pb-28 pt-[calc(env(safe-area-inset-top)+14px)]">
        <header
          className={`sticky top-0 z-20 mb-4 overflow-hidden rounded-[30px] border px-5 py-5 shadow-[0_18px_40px_rgba(255,105,0,0.18)] backdrop-blur transition-all duration-300 ${
            headerHidden ? "pointer-events-none -translate-y-[140%] opacity-0" : "translate-y-0 opacity-100"
          }`}
          style={{
            background: "linear-gradient(135deg, #ffb347 0%, #ff8a1f 58%, #ff6900 100%)",
            borderColor: "rgba(255,255,255,0.35)"
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">Мини-приложение</p>
              <h1 className="mt-1 text-2xl font-extrabold text-white">Доставка пиццы</h1>
              <p className="mt-1 text-sm text-white/85">Горячо и быстро для тебя, {displayName}</p>
            </div>
            {user.photo_url ? (
              <img src={user.photo_url} alt={displayName} className="h-12 w-12 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sm font-bold text-[#ff6900] shadow-lg">
                {initials}
              </div>
            )}
          </div>
        </header>

        {activeTab === "home" && renderHomeContent()}
        {activeTab === "favorites" && renderFavoritesContent()}
        {activeTab === "profile" && renderProfileContent()}
      </div>

      {notice && (
        <div className="pointer-events-none fixed left-1/2 top-5 z-40 -translate-x-1/2 animate-fade-in rounded-full bg-[#34a853] px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {notice}
        </div>
      )}

      {totalItems > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed bottom-24 left-1/2 z-30 flex w-max -translate-x-[calc(-50%+9.5rem)] items-center gap-3 rounded-full bg-[#ff6900] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(255,105,0,0.32)] sm:-translate-x-[calc(-50%+10.5rem)]"
        >
          <CartIcon />
          <span>{totalItems} шт.</span>
        </button>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 p-4" onClick={() => setCartOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-[32px] bg-[#fffaf5] p-5 shadow-[0_-18px_40px_rgba(144,77,24,0.12)] animate-slide-up"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[#ffd3b2]"></div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#2b1608]">Корзина</h2>
              <button type="button" onClick={() => setCartOpen(false)} className="text-sm font-medium text-[#9a5a2d]">Закрыть</button>
            </div>

            <div className="mt-5 max-h-[52vh] space-y-3 overflow-y-auto pb-3">
              {cart.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex gap-3 rounded-3xl bg-white p-3 shadow-[0_10px_24px_rgba(208,117,49,0.10)]">
                  <img src={item.image} alt={item.title} className="h-20 w-20 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-[#2b1608]">{item.title}</h3>
                        <p className="text-sm text-[#8a5a34]">Размер {item.size}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCartItem(item.id, item.size)}
                        className="text-sm font-medium text-[#ff6900]"
                      >
                        Удалить
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-base font-bold text-[#2b1608]">${item.price * item.quantity}</span>
                      <div className="flex items-center gap-2 rounded-full bg-[#fff1e6] px-2 py-1">
                        <button
                          type="button"
                          onClick={() => changeCartQuantity(item.id, item.size, -1)}
                          className="h-8 w-8 rounded-full bg-white text-[#7b4b2a]"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-sm font-semibold text-[#2b1608]">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => changeCartQuantity(item.id, item.size, 1)}
                          className="h-8 w-8 rounded-full bg-white text-[#7b4b2a]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-3xl bg-[#2b1608] p-4 text-white">
              <div className="flex items-center justify-between text-sm text-[#f8c8a2]">
                <span>Итого</span>
                <span>{totalItems} шт.</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-semibold">К оплате</span>
                <span className="text-2xl font-bold">${totalPrice}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!totalItems) {
                    return;
                  }

                  setCartOpen(false);
                  window.location.href = "./order.html";
                }}
                className="mt-4 w-full rounded-2xl bg-[#ff6900] py-3 text-sm font-semibold text-white"
              >
                Оформить заказ
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#ffd7ba] bg-[rgba(255,248,240,0.94)] px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-3 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          {[
            { id: "home", label: "Главная", icon: <HomeIcon /> },
            { id: "favorites", label: "Избранное", icon: <HeartIcon /> },
            { id: "profile", label: "Профиль", icon: <ProfileIcon /> }
          ].map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                  isActive ? "bg-[#fff1e6] text-[#ff6900]" : "text-[#8a5a34]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />);
}
