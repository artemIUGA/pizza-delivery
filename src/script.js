document.addEventListener("DOMContentLoaded", function () {
  var buttons = document.querySelectorAll(".add-to-cart");

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      alert("Пицца добавлена!");
    });
  });
});
