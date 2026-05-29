const { useEffect, useMemo, useRef, useState } = React;

type Category = "Pizza" | "Drinks" | "Snacks" | "Desserts";
type Tab = "home" | "favorites" | "profile";
type PizzaSize = "S" | "M" | "L";
type Screen = "shop" | "order" | "payment";
type OrderField = "name" | "phone" | "address" | "comment";
type PaymentField = "cardNumber" | "cardHolder" | "expiry" | "cvv";

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
type OrderFormData = Record<OrderField, string>;
type OrderErrors = Partial<Record<OrderField, string>>;
type PaymentFormData = Record<PaymentField, string>;
type PaymentErrors = Partial<Record<PaymentField, string>>;
type OrderNotificationPayload = {
  customer: string;
  phone: string;
  items: Array<{
    name: string;
    size: PizzaSize;
    quantity: number;
    price: number;
  }>;
  total: number;
  deliveryFee: number;
  address: string;
  comment: string;
};

declare global {
  interface Window {
    Motion?: any;
    FramerMotion?: any;
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
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy") => void;
          notificationOccurred?: (type: "error" | "success" | "warning") => void;
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
const motionLibrary = window.Motion || window.FramerMotion || {};
const motion = motionLibrary.motion || {
  div: "div",
  section: "section",
  article: "article",
  button: "button"
};
const AnimatePresence = motionLibrary.AnimatePresence || (({ children }: { children: React.ReactNode }) => <>{children}</>);
const initialOrderForm: OrderFormData = {
  name: "",
  phone: "",
  address: "",
  comment: ""
};
const initialPaymentForm: PaymentFormData = {
  cardNumber: "",
  cardHolder: "",
  expiry: "",
  cvv: ""
};

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
  const lastScrollYRef = useRef(0);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [screen, setScreen] = useState<Screen>("shop");
  const [activeCategory, setActiveCategory] = useState<Category>("Pizza");
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const [headerHidden, setHeaderHidden] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderFormData>(initialOrderForm);
  const [orderErrors, setOrderErrors] = useState<OrderErrors>({});
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>(initialPaymentForm);
  const [paymentErrors, setPaymentErrors] = useState<PaymentErrors>({});
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
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

  const deliveryFee = totalItems > 0 ? 3 : 0;
  const finalTotal = totalPrice + deliveryFee;

  useEffect(() => {
    tg?.MainButton?.hide();
  }, [screen, tg]);

  useEffect(() => {
    if (!paymentSuccess) {
      return;
    }

    const timer = window.setTimeout(returnToHomeAfterPayment, 1800);

    return () => {
      window.clearTimeout(timer);
    };
  }, [paymentSuccess]);

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

  function triggerHaptic(style: "light" | "medium" | "heavy" = "light") {
    tg?.HapticFeedback?.impactOccurred(style);
  }

  function extractPhoneDigits(value: string) {
    var digits = String(value || "").replace(/\D/g, "");

    if (digits.startsWith("7")) {
      digits = digits.slice(1);
    }

    return digits.slice(0, 10);
  }

  function formatPhoneValue(value: string) {
    const digits = extractPhoneDigits(value);
    let result = "+7";

    if (digits.length > 0) {
      result += " (" + digits.slice(0, 3);
    }

    if (digits.length >= 4) {
      result += ") " + digits.slice(3, 6);
    }

    if (digits.length >= 7) {
      result += "-" + digits.slice(6, 8);
    }

    if (digits.length >= 9) {
      result += "-" + digits.slice(8, 10);
    }

    return result;
  }

  function updateOrderField(field: OrderField, value: string) {
    const nextValue = field === "phone" ? formatPhoneValue(value) : value;

    setOrderForm((prev) => ({
      ...prev,
      [field]: nextValue
    }));

    setOrderErrors((prev) => ({
      ...prev,
      [field]: ""
    }));
  }

  function validateOrderForm() {
    const nextErrors: OrderErrors = {};

    if (orderForm.name.trim().length < 2) {
      nextErrors.name = "Введите имя не короче 2 символов";
    }

    if (extractPhoneDigits(orderForm.phone).length !== 10) {
      nextErrors.phone = "Введите полный номер телефона";
    }

    if (orderForm.address.trim().length < 10) {
      nextErrors.address = "Введите адрес не короче 10 символов";
    }

    setOrderErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function openOrderScreen() {
    if (!totalItems) {
      return;
    }

    triggerHaptic("light");
    setCartOpen(false);
    setOrderForm((prev) => ({
      ...prev,
      name: prev.name || displayName
    }));
    setOrderErrors({});
    setScreen("order");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function formatCardNumber(value: string) {
    return value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);

    if (digits.length <= 2) {
      return digits;
    }

    return digits.slice(0, 2) + "/" + digits.slice(2);
  }

  function formatCardHolder(value: string) {
    return value
      .replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, "")
      .replace(/\s+/g, " ")
      .slice(0, 28)
      .toUpperCase();
  }

  function getCardBrand(cardNumber: string) {
    const digits = cardNumber.replace(/\D/g, "");

    if (digits.startsWith("4")) {
      return "VISA";
    }

    if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) {
      return "MASTERCARD";
    }

    return "BANK";
  }

  function updatePaymentField(field: PaymentField, value: string) {
    const nextValue = field === "cardNumber"
      ? formatCardNumber(value)
      : field === "cardHolder"
        ? formatCardHolder(value)
        : field === "expiry"
          ? formatExpiry(value)
          : value.replace(/\D/g, "").slice(0, 3);

    setPaymentForm((prev) => ({
      ...prev,
      [field]: nextValue
    }));

    setPaymentErrors((prev) => ({
      ...prev,
      [field]: ""
    }));
  }

  function validatePaymentForm() {
    const nextErrors: PaymentErrors = {};
    const cardDigits = paymentForm.cardNumber.replace(/\D/g, "");
    const expiryMatch = paymentForm.expiry.match(/^(\d{2})\/(\d{2})$/);

    if (cardDigits.length !== 16) {
      nextErrors.cardNumber = "Enter a valid 16-digit card number";
    }

    if (paymentForm.cardHolder.trim().length < 3) {
      nextErrors.cardHolder = "Card holder name is required";
    }

    if (!expiryMatch) {
      nextErrors.expiry = "Use MM/YY format";
    } else {
      const month = Number(expiryMatch[1]);
      const year = Number("20" + expiryMatch[2]);
      const now = new Date();
      const expiryDate = new Date(year, month);

      if (month < 1 || month > 12 || expiryDate <= now) {
        nextErrors.expiry = "Enter a valid future date";
      }
    }

    if (paymentForm.cvv.length !== 3) {
      nextErrors.cvv = "CVV must be 3 digits";
    }

    setPaymentErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function buildOrderNotificationPayload(): OrderNotificationPayload {
    return {
      customer: orderForm.name.trim() || displayName,
      phone: orderForm.phone.trim(),
      items: cart.map((item) => ({
        name: item.title,
        size: item.size,
        quantity: item.quantity,
        price: item.price * item.quantity
      })),
      total: finalTotal,
      deliveryFee: deliveryFee,
      address: orderForm.address.trim(),
      comment: orderForm.comment.trim()
    };
  }

  async function sendOrderNotification() {
    const response = await fetch("http://localhost:3001/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildOrderNotificationPayload())
    });

    if (!response.ok) {
      throw new Error("Order notification failed with status " + response.status);
    }
  }

  function openPaymentScreen() {
    if (!totalItems) {
      return;
    }

    if (!validateOrderForm()) {
      tg?.HapticFeedback?.notificationOccurred?.("error");
      return;
    }

    triggerHaptic("medium");
    setCartOpen(false);
    setPaymentForm(initialPaymentForm);
    setPaymentErrors({});
    setPaymentSuccess(false);
    setIsPaymentProcessing(false);
    setScreen("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function returnToHomeAfterPayment() {
    setCart([]);
    setPaymentSuccess(false);
    setIsPaymentProcessing(false);
    setPaymentForm(initialPaymentForm);
    setPaymentErrors({});
    setOrderForm(initialOrderForm);
    setOrderErrors({});
    setActiveTab("home");
    setScreen("shop");
    setNotice("Payment completed");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePaymentSubmit() {
    triggerHaptic("medium");

    if (!validatePaymentForm()) {
      tg?.HapticFeedback?.notificationOccurred?.("error");
      return;
    }

    setIsPaymentProcessing(true);

    window.setTimeout(async function () {
      try {
        await sendOrderNotification();
      } catch (error) {
        console.error("Failed to send Telegram order notification:", error);
      }

      setIsPaymentProcessing(false);
      setPaymentSuccess(true);
      tg?.HapticFeedback?.notificationOccurred?.("success");
    }, 2300);
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

  function renderOrderScreen() {
    const orderSurface = theme.isDark ? "#16110f" : "#fffaf5";
    const mutedText = theme.isDark ? "#d7b89e" : "#8a5a34";

    return (
      <div
        className="min-h-screen pb-36"
        style={{
          background: `linear-gradient(180deg, ${theme.isDark ? "#120f14" : "#fff7f0"} 0%, ${theme.isDark ? "#1f1714" : "#fffaf5"} 100%)`,
          color: theme.text
        }}
      >
        <div className="mx-auto max-w-md px-4 pt-[calc(env(safe-area-inset-top)+14px)]">
          <header className="mb-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setScreen("order");
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#2b1608] shadow-[0_10px_26px_rgba(20,20,20,0.10)] active:scale-95"
              aria-label="Back"
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl font-extrabold">Оформление заказа</h1>
              <p className="text-sm" style={{ color: mutedText }}>Проверьте доставку перед оплатой</p>
            </div>
          </header>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-4 rounded-[24px] border p-4 shadow-[0_16px_34px_rgba(15,23,42,0.08)]"
            style={{ background: orderSurface, borderColor: theme.isDark ? "rgba(255,255,255,0.08)" : "#ffd7ba" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Ваш заказ</h2>
              <span className="text-sm font-semibold" style={{ color: mutedText }}>{totalItems} шт.</span>
            </div>

            <div className="space-y-3">
              {cart.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex items-center gap-3">
                  <img src={item.image} alt={item.title} className="h-14 w-14 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{item.title}</p>
                    <p className="text-xs" style={{ color: mutedText }}>Размер {item.size} • {item.quantity} шт.</p>
                  </div>
                  <span className="text-sm font-bold">${item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t pt-4 text-sm" style={{ borderColor: theme.isDark ? "rgba(255,255,255,0.08)" : "#ffe1c7" }}>
              <div className="flex justify-between" style={{ color: mutedText }}>
                <span>Пицца</span>
                <span>${totalPrice}</span>
              </div>
              <div className="flex justify-between" style={{ color: mutedText }}>
                <span>Доставка</span>
                <span>${deliveryFee}</span>
              </div>
              <div className="flex justify-between text-lg font-extrabold">
                <span>Итого</span>
                <span>${finalTotal}</span>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="rounded-[24px] border p-4 shadow-[0_16px_34px_rgba(15,23,42,0.08)]"
            style={{ background: orderSurface, borderColor: theme.isDark ? "rgba(255,255,255,0.08)" : "#ffd7ba" }}
          >
            <h2 className="mb-4 text-lg font-bold">Данные доставки</h2>

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: mutedText }}>Имя</span>
                <input
                  value={orderForm.name}
                  onChange={(event) => updateOrderField("name", event.target.value)}
                  placeholder="Ваше имя"
                  autoComplete="name"
                  className="mt-2 w-full rounded-2xl border border-transparent bg-[#f3eee9] px-4 py-3 text-base text-[#1f1714] outline-none transition focus:border-[#ff6900] focus:bg-white"
                />
                {orderErrors.name && <p className="mt-1 text-xs font-semibold text-red-500">{orderErrors.name}</p>}
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: mutedText }}>Телефон</span>
                <input
                  value={orderForm.phone}
                  onChange={(event) => updateOrderField("phone", event.target.value)}
                  inputMode="tel"
                  placeholder="+7 (___) ___-__-__"
                  autoComplete="tel"
                  className="mt-2 w-full rounded-2xl border border-transparent bg-[#f3eee9] px-4 py-3 text-base text-[#1f1714] outline-none transition focus:border-[#ff6900] focus:bg-white"
                />
                {orderErrors.phone && <p className="mt-1 text-xs font-semibold text-red-500">{orderErrors.phone}</p>}
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: mutedText }}>Адрес доставки</span>
                <input
                  value={orderForm.address}
                  onChange={(event) => updateOrderField("address", event.target.value)}
                  placeholder="Улица, дом, квартира"
                  autoComplete="street-address"
                  className="mt-2 w-full rounded-2xl border border-transparent bg-[#f3eee9] px-4 py-3 text-base text-[#1f1714] outline-none transition focus:border-[#ff6900] focus:bg-white"
                />
                {orderErrors.address && <p className="mt-1 text-xs font-semibold text-red-500">{orderErrors.address}</p>}
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: mutedText }}>Комментарий</span>
                <textarea
                  value={orderForm.comment}
                  onChange={(event) => updateOrderField("comment", event.target.value)}
                  rows={3}
                  placeholder="Домофон, подъезд или пожелания"
                  className="mt-2 w-full resize-none rounded-2xl border border-transparent bg-[#f3eee9] px-4 py-3 text-base text-[#1f1714] outline-none transition focus:border-[#ff6900] focus:bg-white"
                ></textarea>
              </label>
            </div>
          </motion.section>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/20 bg-white/90 px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3 shadow-[0_-16px_30px_rgba(15,23,42,0.10)] backdrop-blur">
          <div className="mx-auto max-w-md">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={openPaymentScreen}
              className="flex w-full items-center justify-center rounded-2xl bg-[#ff6900] py-4 text-base font-extrabold text-white shadow-[0_16px_32px_rgba(255,105,0,0.24)]"
            >
              Continue to Payment
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  function renderPaymentScreen() {
    const cardNumberPreview = paymentForm.cardNumber || "1234 5678 9012 3456";
    const cardHolderPreview = paymentForm.cardHolder || "CARD HOLDER";
    const expiryPreview = paymentForm.expiry || "MM/YY";
    const cardBrand = getCardBrand(paymentForm.cardNumber);
    const paymentSurface = theme.isDark ? "#16110f" : "#fffaf5";
    const mutedText = theme.isDark ? "#d7b89e" : "#8a5a34";

    return (
      <div
        className="min-h-screen pb-36"
        style={{
          background: `linear-gradient(180deg, ${theme.isDark ? "#120f14" : "#fff7f0"} 0%, ${theme.isDark ? "#1f1714" : "#fffaf5"} 100%)`,
          color: theme.text
        }}
      >
        <div className="mx-auto max-w-md px-4 pt-[calc(env(safe-area-inset-top)+14px)]">
          <header className="mb-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setScreen("shop");
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#2b1608] shadow-[0_10px_26px_rgba(20,20,20,0.10)] active:scale-95"
              aria-label="Back"
            >
              ←
            </button>
            <h1 className="text-2xl font-extrabold">Card Payment</h1>
          </header>

          <section
            className="mb-4 rounded-[22px] border p-4 text-sm shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
            style={{ background: paymentSurface, borderColor: theme.isDark ? "rgba(255,255,255,0.08)" : "#ffd7ba", color: mutedText }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold" style={{ color: theme.text }}>Delivery details</p>
                <p className="mt-1">{orderForm.name || displayName}</p>
                <p>{orderForm.phone || "Phone not set"}</p>
                <p className="line-clamp-2">{orderForm.address || "Address not set"}</p>
              </div>
              <button
                type="button"
                onClick={() => setScreen("order")}
                className="shrink-0 rounded-full bg-[#fff1e6] px-3 py-1 text-xs font-bold text-[#ff6900]"
              >
                Edit
              </button>
            </div>
          </section>

          <motion.div
            initial={{ opacity: 0, y: 20, rotateX: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.45 }}
            className="relative mb-5 overflow-hidden rounded-[28px] border border-white/20 bg-[#121826] p-5 text-white shadow-[0_24px_50px_rgba(15,23,42,0.32)]"
          >
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/25 blur-2xl"></div>
            <div className="absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-fuchsia-500/20 blur-2xl"></div>
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/55">Demo Card</p>
                  <p className="mt-1 text-sm text-white/75">Pizza Delivery</p>
                </div>
                <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold backdrop-blur">
                  {cardBrand}
                </div>
              </div>

              <div className="mt-9 h-9 w-12 rounded-xl bg-gradient-to-br from-amber-200 to-amber-500 shadow-inner"></div>
              <motion.p
                key={cardNumberPreview}
                initial={{ opacity: 0.45, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 font-mono text-xl font-semibold tracking-[0.12em]"
              >
                {cardNumberPreview}
              </motion.p>

              <div className="mt-6 grid grid-cols-[1fr_auto] gap-4 text-xs uppercase text-white/50">
                <div>
                  <p>Card Holder</p>
                  <p className="mt-1 truncate text-sm font-bold tracking-wide text-white">{cardHolderPreview}</p>
                </div>
                <div className="text-right">
                  <p>Expires</p>
                  <p className="mt-1 text-sm font-bold tracking-wide text-white">{expiryPreview}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <section
            className="mb-4 rounded-[24px] border p-4 shadow-[0_16px_34px_rgba(15,23,42,0.08)]"
            style={{ background: paymentSurface, borderColor: theme.isDark ? "rgba(255,255,255,0.08)" : "#ffd7ba" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Order Summary</h2>
              <span className="text-sm font-semibold" style={{ color: mutedText }}>{totalItems} items</span>
            </div>

            <div className="space-y-3">
              {cart.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex items-center gap-3">
                  <img src={item.image} alt={item.title} className="h-14 w-14 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{item.title}</p>
                    <p className="text-xs" style={{ color: mutedText }}>Size {item.size} • Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-bold">${item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t pt-4 text-sm" style={{ borderColor: theme.isDark ? "rgba(255,255,255,0.08)" : "#ffe1c7" }}>
              <div className="flex justify-between" style={{ color: mutedText }}>
                <span>Subtotal</span>
                <span>${totalPrice}</span>
              </div>
              <div className="flex justify-between" style={{ color: mutedText }}>
                <span>Delivery fee</span>
                <span>${deliveryFee}</span>
              </div>
              <div className="flex justify-between text-lg font-extrabold">
                <span>Final total</span>
                <span>${finalTotal}</span>
              </div>
            </div>
          </section>

          <section
            className="rounded-[24px] border p-4 shadow-[0_16px_34px_rgba(15,23,42,0.08)]"
            style={{ background: paymentSurface, borderColor: theme.isDark ? "rgba(255,255,255,0.08)" : "#ffd7ba" }}
          >
            <h2 className="mb-4 text-lg font-bold">Bank Card</h2>

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: mutedText }}>Card Number</span>
                <input
                  value={paymentForm.cardNumber}
                  onChange={(event) => updatePaymentField("cardNumber", event.target.value)}
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  className="mt-2 w-full rounded-2xl border border-transparent bg-[#f3eee9] px-4 py-3 font-mono text-base text-[#1f1714] outline-none transition focus:border-[#ff6900] focus:bg-white"
                />
                {paymentErrors.cardNumber && <p className="mt-1 text-xs font-semibold text-red-500">{paymentErrors.cardNumber}</p>}
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: mutedText }}>Card Holder Name</span>
                <input
                  value={paymentForm.cardHolder}
                  onChange={(event) => updatePaymentField("cardHolder", event.target.value)}
                  placeholder="ALEX IVANOV"
                  className="mt-2 w-full rounded-2xl border border-transparent bg-[#f3eee9] px-4 py-3 text-base font-bold uppercase tracking-wide text-[#1f1714] outline-none transition focus:border-[#ff6900] focus:bg-white"
                />
                {paymentErrors.cardHolder && <p className="mt-1 text-xs font-semibold text-red-500">{paymentErrors.cardHolder}</p>}
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: mutedText }}>Expiration</span>
                  <input
                    value={paymentForm.expiry}
                    onChange={(event) => updatePaymentField("expiry", event.target.value)}
                    inputMode="numeric"
                    placeholder="MM/YY"
                    className="mt-2 w-full rounded-2xl border border-transparent bg-[#f3eee9] px-4 py-3 font-mono text-base text-[#1f1714] outline-none transition focus:border-[#ff6900] focus:bg-white"
                  />
                  {paymentErrors.expiry && <p className="mt-1 text-xs font-semibold text-red-500">{paymentErrors.expiry}</p>}
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: mutedText }}>CVV</span>
                  <input
                    value={paymentForm.cvv}
                    onChange={(event) => updatePaymentField("cvv", event.target.value)}
                    inputMode="numeric"
                    type="password"
                    placeholder="123"
                    className="mt-2 w-full rounded-2xl border border-transparent bg-[#f3eee9] px-4 py-3 font-mono text-base text-[#1f1714] outline-none transition focus:border-[#ff6900] focus:bg-white"
                  />
                  {paymentErrors.cvv && <p className="mt-1 text-xs font-semibold text-red-500">{paymentErrors.cvv}</p>}
                </label>
              </div>
            </div>
          </section>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/20 bg-white/90 px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3 shadow-[0_-16px_30px_rgba(15,23,42,0.10)] backdrop-blur">
          <div className="mx-auto max-w-md">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={handlePaymentSubmit}
              disabled={isPaymentProcessing || paymentSuccess}
              className="flex w-full items-center justify-center rounded-2xl bg-[#111827] py-4 text-base font-extrabold text-white shadow-[0_16px_32px_rgba(17,24,39,0.24)] disabled:opacity-70"
            >
              {isPaymentProcessing ? "Processing..." : "Pay Now"}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {(isPaymentProcessing || paymentSuccess) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-6 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 18 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-sm rounded-[28px] bg-white p-7 text-center text-[#132015] shadow-[0_28px_70px_rgba(0,0,0,0.24)]"
              >
                {paymentSuccess ? (
                  <>
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#22c55e] text-4xl text-white">✓</div>
                    <h2 className="mt-5 text-2xl font-extrabold">Payment Successful</h2>
                    <p className="mt-2 text-sm leading-6 text-[#5d6b62]">Your order is being prepared</p>
                    <button
                      type="button"
                      onClick={returnToHomeAfterPayment}
                      className="mt-6 w-full rounded-2xl bg-[#22c55e] py-3 text-sm font-bold text-white active:scale-95"
                    >
                      Return Home
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-[#dbeafe] border-t-[#2563eb]"></div>
                    <h2 className="mt-5 text-xl font-extrabold">Processing Payment</h2>
                    <p className="mt-2 text-sm text-[#5d6b62]">Secure demo transaction in progress</p>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (screen === "payment") {
    return renderPaymentScreen();
  }

  if (screen === "order") {
    return renderOrderScreen();
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
              <h1 className="mt-1 text-2xl font-extrabold text-white">Доставка пиццы 🍕</h1>
              <p id="welcome-message" style={{ textAlign: "center", fontSize: "18px", color: "#666" }}>
                Привет, {displayName}! 👋
              </p>
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

                  openOrderScreen();
                }}
                className="mt-4 w-full rounded-2xl bg-[#ff6900] py-3 text-sm font-semibold text-white"
              >
                Checkout
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
