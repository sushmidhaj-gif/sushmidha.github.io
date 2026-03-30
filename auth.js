/**
 * Portfolio password gate (client-side).
 *
 * Change your password:
 *   printf 'YOUR_NEW_PASSWORD' | shasum -a 256
 * Copy the 64-character hex into PORTFOLIO_PASSWORD_SHA256 below.
 *
 * Current password set in repo: update PORTFOLIO_PASSWORD_SHA256 if you change it.
 *
 * Limitations: Anyone can read this file and brute-force a short password.
 * For real protection, use hosting password protection (Netlify / Vercel / Cloudflare) or HTTP basic auth.
 *
 * sessionStorage is shared across pages on the same origin (e.g. https://yoursite.com).
 * Opening HTML files directly (file://) uses a different storage scope per file — use a local server instead:
 *   python3 -m http.server 8080
 */
(function () {
  "use strict";

  var PORTFOLIO_PASSWORD_SHA256 =
    "cf7be57aaff113fc096822a8db44f41e14fa3a110d920db9a6e92b4f2848a962";

  var STORAGE_KEY = "portfolio_auth";

  function unlock() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {}
    document.documentElement.removeAttribute("data-portfolio-gate");
    var g = document.getElementById("portfolio-auth-gate");
    if (g) g.remove();
    document.body.style.overflow = "";
  }

  if (document.documentElement.getAttribute("data-portfolio-gate") !== "on") {
    return;
  }

  document.body.style.overflow = "hidden";

  function sha256Hex(text) {
    var enc = new TextEncoder();
    return crypto.subtle.digest("SHA-256", enc.encode(text)).then(function (buf) {
      var bytes = new Uint8Array(buf);
      var hex = "";
      for (var i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, "0");
      }
      return hex;
    });
  }

  function buildGate() {
    var gate = document.createElement("div");
    gate.id = "portfolio-auth-gate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "portfolio-auth-title");

    gate.innerHTML =
      '<div class="portfolio-auth-panel">' +
      '<h1 class="portfolio-auth-title" id="portfolio-auth-title">This portfolio is private</h1>' +
      '<p class="portfolio-auth-lede">Enter the password to continue.</p>' +
      '<form class="portfolio-auth-form" id="portfolio-auth-form" novalidate>' +
      '<label class="portfolio-auth-label" for="portfolio-auth-input">Password</label>' +
      '<input class="portfolio-auth-input" type="password" id="portfolio-auth-input" name="password" autocomplete="current-password" required />' +
      '<p class="portfolio-auth-error" id="portfolio-auth-error" hidden>That password is not correct.</p>' +
      '<button type="submit" class="portfolio-auth-submit" id="portfolio-auth-submit">Enter</button>' +
      "</form>" +
      "</div>";

    document.body.insertBefore(gate, document.body.firstChild);

    var form = document.getElementById("portfolio-auth-form");
    var input = document.getElementById("portfolio-auth-input");
    var err = document.getElementById("portfolio-auth-error");
    var btn = document.getElementById("portfolio-auth-submit");

    input.focus();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      err.hidden = true;
      var value = (input.value || "").trim();
      if (!value) return;

      if (!window.crypto || !window.crypto.subtle) {
        err.textContent = "Password check needs a secure context (https or localhost).";
        err.hidden = false;
        return;
      }

      btn.disabled = true;
      sha256Hex(value)
        .then(function (hash) {
          if (hash === PORTFOLIO_PASSWORD_SHA256) {
            unlock();
          } else {
            err.textContent = "That password is not correct.";
            err.hidden = false;
            input.value = "";
            input.focus();
          }
        })
        .catch(function () {
          err.textContent = "Something went wrong. Try again.";
          err.hidden = false;
        })
        .finally(function () {
          btn.disabled = false;
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildGate);
  } else {
    buildGate();
  }
})();
