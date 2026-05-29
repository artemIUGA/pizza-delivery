// Инициализируем Telegram WebApp SDK и безопасно работаем вне Telegram.
var telegramWebApp = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
var user = telegramWebApp && telegramWebApp.initDataUnsafe ? telegramWebApp.initDataUnsafe.user : null;
var userName = user && user.first_name ? user.first_name : "Гость";
var userId = user && user.id ? user.id : null;

if (telegramWebApp) {
  telegramWebApp.ready();
  telegramWebApp.expand();
}

console.log("Telegram WebApp SDK initialized");
console.log("User:", user);
console.log("Theme:", telegramWebApp ? telegramWebApp.themeParams : undefined);

document.addEventListener("DOMContentLoaded", function () {
  var welcomeMessageElement = document.getElementById("welcome-message");

  if (welcomeMessageElement) {
    welcomeMessageElement.textContent = "Привет, " + userName + "! 👋";
  }

  // Поддерживаем и старый ключ корзины, и новый ключ мини-приложения.
  var STORAGE_KEYS = ["cart", "pizza-mini-cart"];
  var cartPage = document.querySelector("[data-page='cart']");
  var successPage = document.querySelector("[data-page='success']");
  var orderPage = document.querySelector("[data-page='order']");
  var mainButton = telegramWebApp && telegramWebApp.MainButton ? telegramWebApp.MainButton : null;

  if (successPage) {
    hideMainButton();
    initSuccessPage();
    return;
  }

  if (orderPage) {
    initOrderPage();
    return;
  }

  if (!cartPage) {
    return;
  }

  var cart = loadCart();

  var cartItemsElement = document.getElementById("cart-items");
  var cartEmptyElement = document.getElementById("cart-empty");
  var cartTotalElement = document.getElementById("cart-total");
  var checkoutButton = document.getElementById("checkout-button");
  var clearCartButton = document.getElementById("clear-cart-button");
  var backToHomeButton = document.getElementById("back-to-home");
  var backToMenuButton = document.getElementById("back-to-menu");

  if (backToHomeButton) {
    backToHomeButton.addEventListener("click", function () {
      window.location.href = "./index.html";
    });
  }

  if (backToMenuButton) {
    backToMenuButton.addEventListener("click", function () {
      window.location.href = "./index.html";
    });
  }

  if (checkoutButton) {
    checkoutButton.addEventListener("click", function () {
      if (!cart.length) {
        return;
      }

      goToOrderPage("light");
    });
  }

  if (clearCartButton) {
    clearCartButton.addEventListener("click", function () {
      clearCartAnimated();
    });
  }

  if (cartItemsElement) {
    cartItemsElement.addEventListener("click", function (event) {
      var target = event.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      var actionButton = target.closest("[data-action]");

      if (!actionButton) {
        return;
      }

      var itemId = Number(actionButton.getAttribute("data-id"));
      var itemSize = actionButton.getAttribute("data-size") || "";
      var action = actionButton.getAttribute("data-action");

      if (action === "increase") {
        changeQuantity(itemId, itemSize, 1);
      }

      if (action === "decrease") {
        changeQuantity(itemId, itemSize, -1);
      }

      if (action === "remove") {
        removeItem(itemId, itemSize, actionButton.closest(".cart-item"));
      }
    });
  }

  renderCart();

  // Настраиваем главную кнопку Telegram, если она доступна.
  function configureMainButton(text, color) {
    if (!mainButton) {
      return;
    }

    if (typeof mainButton.setParams === "function") {
      mainButton.setParams({
        text: text,
        color: color
      });
      return;
    }

    if (typeof mainButton.setText === "function") {
      mainButton.setText(text);
    } else {
      mainButton.text = text;
    }

    mainButton.color = color;
  }

  // Показываем главную кнопку Telegram.
  function showMainButton() {
    if (mainButton && typeof mainButton.show === "function") {
      mainButton.show();
    }
  }

  // Скрываем главную кнопку Telegram.
  function hideMainButton() {
    if (mainButton && typeof mainButton.hide === "function") {
      mainButton.hide();
    }
  }

  // Активируем главную кнопку Telegram.
  function enableMainButton() {
    if (mainButton && typeof mainButton.enable === "function") {
      mainButton.enable();
    }
  }

  // Деактивируем главную кнопку Telegram.
  function disableMainButton() {
    if (mainButton && typeof mainButton.disable === "function") {
      mainButton.disable();
    }
  }

  // Показываем loader в главной кнопке Telegram.
  function showMainButtonProgress() {
    if (mainButton && typeof mainButton.showProgress === "function") {
      mainButton.showProgress();
    }
  }

  // Скрываем loader в главной кнопке Telegram.
  function hideMainButtonProgress() {
    if (mainButton && typeof mainButton.hideProgress === "function") {
      mainButton.hideProgress();
    }
  }

  // Подключаем обработчик клика к главной кнопке Telegram.
  function onMainButtonClick(handler) {
    if (mainButton && typeof mainButton.onClick === "function") {
      mainButton.onClick(handler);
    }
  }

  // Запускаем тактильный отклик Telegram.
  function triggerHapticFeedback(style) {
    var hapticFeedback = telegramWebApp && telegramWebApp.HapticFeedback ? telegramWebApp.HapticFeedback : null;

    if (hapticFeedback && typeof hapticFeedback.impactOccurred === "function") {
      hapticFeedback.impactOccurred(style);
    }
  }

  // Переходим к оформлению заказа из корзины.
  function goToOrderPage(hapticStyle) {
    triggerHapticFeedback(hapticStyle || "light");
    window.location.href = "./order.html";
  }

  // Обновляем главную кнопку Telegram на странице корзины.
  function updateCartMainButton() {
    if (!mainButton) {
      return;
    }

    if (!cart.length) {
      hideMainButton();
      return;
    }

    configureMainButton("Оформить заказ • " + calculateTotal() + "₽", "#28a745");
    showMainButton();
  }

  if (cartPage) {
    onMainButtonClick(function () {
      if (!cart.length) {
        hideMainButton();
        return;
      }

      goToOrderPage("light");
    });
  }

  // Загружаем корзину из LocalStorage.
  function loadCart() {
    var savedCart = null;

    STORAGE_KEYS.some(function (key) {
      var value = localStorage.getItem(key);

      if (value) {
        savedCart = value;
        return true;
      }

      return false;
    });

    if (!savedCart) {
      return [];
    }

    try {
      var parsedCart = JSON.parse(savedCart);
      return Array.isArray(parsedCart) ? parsedCart : [];
    } catch (error) {
      return [];
    }
  }

  // Сохраняем корзину сразу в оба ключа для совместимости экранов.
  function saveCart() {
    var serializedCart = JSON.stringify(cart);

    STORAGE_KEYS.forEach(function (key) {
      localStorage.setItem(key, serializedCart);
    });
  }

  // Полностью очищаем корзину в LocalStorage.
  function clearCartStorage() {
    STORAGE_KEYS.forEach(function (key) {
      localStorage.removeItem(key);
    });
  }

  // Универсально меняем количество товара.
  function changeQuantity(id, size, delta) {
    cart = cart
      .map(function (item) {
        if (!isSameItem(item, id, size)) {
          return item;
        }

        return {
          id: item.id,
          name: item.name || item.title,
          title: item.title || item.name,
          price: Number(item.price) || 0,
          quantity: (Number(item.quantity) || 0) + delta,
          size: item.size || ""
        };
      })
      .filter(function (item) {
        return item.quantity > 0;
      });

    syncStorageAfterChange();
    renderCart({
      animatedItemId: id,
      animatedItemSize: size,
      animateTotal: true
    });
  }

  // Удаляем товар с анимацией.
  function removeItem(id, size, itemElement) {
    if (itemElement) {
      itemElement.classList.add("is-removing");

      window.setTimeout(function () {
        cart = cart.filter(function (item) {
          return !isSameItem(item, id, size);
        });

        syncStorageAfterChange();
        renderCart({ animateTotal: true });
      }, 300);

      return;
    }

    cart = cart.filter(function (item) {
      return !isSameItem(item, id, size);
    });

    syncStorageAfterChange();
    renderCart({ animateTotal: true });
  }

  // Очищаем корзину с каскадной анимацией карточек.
  function clearCartAnimated() {
    if (!cartItemsElement) {
      cart = [];
      clearCartStorage();
      renderCart();
      return;
    }

    var cards = Array.from(cartItemsElement.querySelectorAll(".cart-item"));

    if (!cards.length) {
      cart = [];
      clearCartStorage();
      renderCart();
      return;
    }

    cards.forEach(function (card, index) {
      window.setTimeout(function () {
        card.classList.add("is-removing");
      }, index * 90);
    });

    window.setTimeout(function () {
      cart = [];
      clearCartStorage();
      renderCart({ animateEmpty: true });
    }, cards.length * 90 + 320);
  }

  // После любого изменения либо сохраняем корзину, либо очищаем ключ.
  function syncStorageAfterChange() {
    if (cart.length) {
      saveCart();
    } else {
      clearCartStorage();
    }
  }

  // Сравниваем товары по id и размеру.
  function isSameItem(item, id, size) {
    var itemSize = item.size || "";
    return Number(item.id) === id && String(itemSize) === String(size);
  }

  // Считаем итоговую сумму по корзине.
  function calculateTotal() {
    return cart.reduce(function (sum, item) {
      return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
    }, 0);
  }

  // Получаем читаемое имя товара независимо от структуры данных.
  function getItemTitle(item) {
    return item.title || item.name || "Пицца";
  }

  // Отрисовываем корзину целиком.
  function renderCart(options) {
    options = options || {};

    if (!cartItemsElement || !cartEmptyElement || !cartTotalElement || !checkoutButton || !clearCartButton) {
      return;
    }

    if (!cart.length) {
      cartItemsElement.innerHTML = "";
      cartEmptyElement.hidden = false;
      cartEmptyElement.classList.toggle("is-visible", Boolean(options.animateEmpty));
      cartItemsElement.hidden = true;
      cartTotalElement.textContent = "0 ₽";
      cartTotalElement.classList.toggle("value-updated", Boolean(options.animateTotal));
      checkoutButton.disabled = true;
      clearCartButton.disabled = true;
      updateCartMainButton();
      return;
    }

    cartEmptyElement.hidden = true;
    cartEmptyElement.classList.remove("is-visible");
    cartItemsElement.hidden = false;
    checkoutButton.disabled = false;
    clearCartButton.disabled = false;

    cartItemsElement.innerHTML = cart.map(function (item) {
      var title = getItemTitle(item);
      var unitPrice = Number(item.price) || 0;
      var quantity = Number(item.quantity) || 0;
      var sum = unitPrice * quantity;
      var sizeLabel = item.size ? " · Размер " + item.size : "";
      var image = item.image || "https://placehold.co/100x100/FCE7D6/9A5A2D?text=%F0%9F%8D%95";
      var animateItem = options.animatedItemId === Number(item.id) && String(options.animatedItemSize || "") === String(item.size || "");

      return [
        '<article class="cart-item' + (animateItem ? " is-updating" : "") + '">',
        '  <img class="cart-item__image" src="' + escapeHtml(image) + '" alt="' + escapeHtml(title) + '" loading="lazy">',
        '  <div class="cart-item__main">',
        '    <div class="cart-item__top">',
        "      <div>",
        '        <h2 class="cart-item__title">' + escapeHtml(title) + "</h2>",
        '        <p class="cart-item__meta">' + unitPrice + " ₽ за штуку" + escapeHtml(sizeLabel) + "</p>",
        "      </div>",
        '      <div class="item-sum' + (animateItem ? " value-updated" : "") + '">' + sum + " ₽</div>",
        "    </div>",
        '    <div class="cart-item__controls">',
        '      <div class="quantity-control">',
        '        <button class="quantity-button" type="button" data-action="decrease" data-id="' + item.id + '" data-size="' + escapeHtml(item.size || "") + '" aria-label="Уменьшить количество">−</button>',
        '        <span class="quantity-value' + (animateItem ? " value-updated" : "") + '">' + quantity + "</span>",
        '        <button class="quantity-button" type="button" data-action="increase" data-id="' + item.id + '" data-size="' + escapeHtml(item.size || "") + '" aria-label="Увеличить количество">+</button>',
        "      </div>",
        '      <button class="remove-button" type="button" data-action="remove" data-id="' + item.id + '" data-size="' + escapeHtml(item.size || "") + '">✕ Удалить</button>',
        "    </div>",
        "  </div>",
        "</article>"
      ].join("");
    }).join("");

    cartTotalElement.textContent = calculateTotal() + " ₽";
    cartTotalElement.classList.toggle("value-updated", Boolean(options.animateTotal));
    updateCartMainButton();

    if (options.animateTotal) {
      window.setTimeout(function () {
        cartTotalElement.classList.remove("value-updated");
      }, 320);
    }
  }

  // Простая защита от вставки HTML в текстовые значения.
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initSuccessPage() {
    var lastOrderRaw = localStorage.getItem("lastOrder");
    var expiresAt = Number(localStorage.getItem("lastOrderExpiresAt") || 0);

    if (!lastOrderRaw || (expiresAt && Date.now() > expiresAt)) {
      clearLastOrderStorage();
      window.location.href = "./index.html";
      return;
    }

    var lastOrder = null;

    try {
      lastOrder = JSON.parse(lastOrderRaw);
    } catch (error) {
      window.location.href = "./index.html";
      return;
    }

    if (!lastOrder || typeof lastOrder !== "object") {
      window.location.href = "./index.html";
      return;
    }

    var orderNumberElement = document.getElementById("success-order-number");
    var orderDatetimeElement = document.getElementById("success-order-datetime");
    var orderTotalElement = document.getElementById("success-order-total");
    var orderItemsElement = document.getElementById("success-order-items");
    var customerNameElement = document.getElementById("success-customer-name");
    var customerPhoneElement = document.getElementById("success-customer-phone");
    var customerAddressElement = document.getElementById("success-customer-address");
    var customerCommentElement = document.getElementById("success-customer-comment");
    var homeButton = document.getElementById("success-home-button");
    var menuButton = document.getElementById("success-menu-button");

    var orderNumber = generateOrderNumber();
    var formattedDateTime = formatCurrentDateTime();
    var orderItems = Array.isArray(lastOrder.items) ? lastOrder.items : [];
    var total = Number(lastOrder.total) || calculateOrderTotal(orderItems);
    var name = lastOrder.name || lastOrder.customerName || "Не указано";
    var phone = lastOrder.phone || lastOrder.customerPhone || "Не указано";
    var address = lastOrder.address || lastOrder.deliveryAddress || "Не указано";
    var comment = lastOrder.comment || "Без комментария";

    if (orderNumberElement) {
      orderNumberElement.textContent = "#" + orderNumber;
    }

    if (orderDatetimeElement) {
      orderDatetimeElement.textContent = formattedDateTime;
    }

    if (orderTotalElement) {
      orderTotalElement.textContent = total + " ₽";
    }

    if (orderItemsElement) {
      orderItemsElement.innerHTML = orderItems.length
        ? orderItems.map(function (item) {
            var title = item.title || item.name || "Пицца";
            var quantity = Number(item.quantity) || 1;
            return '<li class="success-order-list__item">' + escapeHtml(title) + " × " + quantity + "</li>";
          }).join("")
        : '<li class="success-order-list__item">Состав заказа недоступен</li>';
    }

    if (customerNameElement) {
      customerNameElement.textContent = name;
    }

    if (customerPhoneElement) {
      customerPhoneElement.textContent = phone;
    }

    if (customerAddressElement) {
      customerAddressElement.textContent = address;
    }

    if (customerCommentElement) {
      customerCommentElement.textContent = comment;
    }

    STORAGE_KEYS.forEach(function (key) {
      localStorage.removeItem(key);
    });

    localStorage.removeItem("cart");
    localStorage.setItem("lastOrderExpiresAt", String(Date.now() + 5 * 60 * 1000));

    window.setTimeout(function () {
      clearLastOrderStorage();
    }, 5 * 60 * 1000);

    if (homeButton) {
      homeButton.addEventListener("click", function () {
        window.location.href = "./index.html";
      });
    }

    if (menuButton) {
      menuButton.addEventListener("click", function () {
        window.location.href = "./index.html";
      });
    }
  }

  function clearLastOrderStorage() {
    localStorage.removeItem("lastOrder");
    localStorage.removeItem("lastOrderExpiresAt");
  }

  function generateOrderNumber() {
    return Math.floor(10000 + Math.random() * 90000);
  }

  function formatCurrentDateTime() {
    var now = new Date();
    var day = String(now.getDate()).padStart(2, "0");
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var year = now.getFullYear();
    var hours = String(now.getHours()).padStart(2, "0");
    var minutes = String(now.getMinutes()).padStart(2, "0");

    return day + "." + month + "." + year + ", " + hours + ":" + minutes;
  }

  function calculateOrderTotal(items) {
    return items.reduce(function (sum, item) {
      return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
    }, 0);
  }

  function initOrderPage() {
    var orderCart = loadCart();

    if (!orderCart.length) {
      window.location.href = "./cart.html";
      return;
    }

    var backToCartButton = document.getElementById("back-to-cart");
    var orderItemsElement = document.getElementById("order-items");
    var orderTotalElement = document.getElementById("order-total");
    var orderForm = document.getElementById("order-form");
    var nameInput = document.getElementById("customer-name");
    var phoneInput = document.getElementById("customer-phone");
    var addressInput = document.getElementById("customer-address");
    var commentInput = document.getElementById("customer-comment");

    configureMainButton("Оформить заказ", "#28a745");
    disableMainButton();
    showMainButton();

    // Автоматически подставляем имя из Telegram в форму заказа.
    if (nameInput && userName) {
      nameInput.value = userName;
    }

    if (backToCartButton) {
      backToCartButton.addEventListener("click", function () {
        window.location.href = "./cart.html";
      });
    }

    if (orderItemsElement) {
      orderItemsElement.innerHTML = orderCart.map(function (item) {
        var title = item.title || item.name || "Пицца";
        var quantity = Number(item.quantity) || 0;
        var price = Number(item.price) || 0;
        var sum = quantity * price;

        return [
          '<div class="order-item">',
          '  <div>',
          '    <h3>' + escapeHtml(title) + "</h3>",
          '    <p>' + quantity + " шт. × " + price + " ₽</p>",
          "  </div>",
          '  <strong>' + sum + " ₽</strong>",
          "</div>"
        ].join("");
      }).join("");
    }

    if (orderTotalElement) {
      orderTotalElement.textContent = calculateOrderTotal(orderCart) + " ₽";
    }

    if (phoneInput) {
      phoneInput.addEventListener("input", function () {
        phoneInput.value = formatPhoneValue(phoneInput.value);
        clearFieldError(phoneInput, "phone");
        updateOrderMainButtonState();
      });
    }

    if (nameInput) {
      nameInput.addEventListener("input", function () {
        clearFieldError(nameInput, "name");
        updateOrderMainButtonState();
      });
    }

    if (addressInput) {
      addressInput.addEventListener("input", function () {
        clearFieldError(addressInput, "address");
        updateOrderMainButtonState();
      });
    }

    if (commentInput) {
      commentInput.addEventListener("input", function () {
        clearFieldError(commentInput, "comment");
        updateOrderMainButtonState();
      });
    }

    if (orderForm) {
      orderForm.addEventListener("submit", function (event) {
        event.preventDefault();
        submitOrder(false);
      });
    }

    onMainButtonClick(function () {
      submitOrder(true);
    });

    updateOrderMainButtonState();

    // Получаем актуальные данные формы заказа.
    function getOrderFormData() {
      return {
        name: nameInput ? nameInput.value.trim() : "",
        phone: phoneInput ? phoneInput.value.trim() : "",
        address: addressInput ? addressInput.value.trim() : "",
        comment: commentInput ? commentInput.value.trim() : ""
      };
    }

    // Проверяем форму без показа ошибок, чтобы обновлять состояние MainButton.
    function isOrderFormReady() {
      var formData = getOrderFormData();

      return formData.name.length >= 2 &&
        extractPhoneDigits(formData.phone).length === 10 &&
        formData.address.length >= 10;
    }

    // Активируем или деактивируем главную кнопку Telegram по состоянию формы.
    function updateOrderMainButtonState() {
      if (isOrderFormReady()) {
        enableMainButton();
      } else {
        disableMainButton();
      }
    }

    // Сохраняем заказ и переходим на экран успеха.
    function saveOrderAndRedirect() {
      var formData = getOrderFormData();
      var order = {
        id: Math.floor(Math.random() * 1000000000),
        date: new Date().toISOString(),
        items: orderCart,
        total: calculateOrderTotal(orderCart),
        customer: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          comment: formData.comment
        },
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        comment: formData.comment
      };

      localStorage.setItem("lastOrder", JSON.stringify(order));
      localStorage.removeItem("lastOrderExpiresAt");
      window.location.href = "./success.html";
    }

    // Обрабатываем оформление заказа из формы или Telegram MainButton.
    function submitOrder(fromMainButton) {
      if (fromMainButton) {
        triggerHapticFeedback("medium");
        showMainButtonProgress();
      }

      var isValid = validateOrderForm(getOrderFormData(), {
        nameInput: nameInput,
        phoneInput: phoneInput,
        addressInput: addressInput
      });

      updateOrderMainButtonState();

      if (!isValid) {
        hideMainButtonProgress();
        return;
      }

      if (fromMainButton) {
        window.setTimeout(function () {
          hideMainButtonProgress();
          saveOrderAndRedirect();
        }, 500);
        return;
      }

      saveOrderAndRedirect();
    }
  }

  function validateOrderForm(formData, fields) {
    var hasError = false;
    var phoneDigits = extractPhoneDigits(formData.phone);

    clearAllOrderErrors();

    if (formData.name.length < 2) {
      setFieldError(fields.nameInput, "name", "Введите имя не короче 2 символов");
      hasError = true;
    }

    if (phoneDigits.length !== 10) {
      setFieldError(fields.phoneInput, "phone", "Введите полный номер телефона");
      hasError = true;
    }

    if (formData.address.length < 10) {
      setFieldError(fields.addressInput, "address", "Введите адрес не короче 10 символов");
      hasError = true;
    }

    return !hasError;
  }

  function setFieldError(input, fieldName, message) {
    if (input) {
      input.classList.add("is-invalid");
    }

    var errorElement = document.getElementById("error-" + fieldName);

    if (errorElement) {
      errorElement.textContent = message;
    }
  }

  function clearFieldError(input, fieldName) {
    if (input) {
      input.classList.remove("is-invalid");
    }

    var errorElement = document.getElementById("error-" + fieldName);

    if (errorElement) {
      errorElement.textContent = "";
    }
  }

  function clearAllOrderErrors() {
    ["name", "phone", "address", "comment"].forEach(function (fieldName) {
      var errorElement = document.getElementById("error-" + fieldName);

      if (errorElement) {
        errorElement.textContent = "";
      }
    });

    document.querySelectorAll(".form-input.is-invalid").forEach(function (input) {
      input.classList.remove("is-invalid");
    });
  }

  function extractPhoneDigits(value) {
    var digits = String(value || "").replace(/\D/g, "");

    if (digits.startsWith("7")) {
      digits = digits.slice(1);
    }

    return digits.slice(0, 10);
  }

  function formatPhoneValue(value) {
    var digits = extractPhoneDigits(value);
    var result = "+7";

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
});
