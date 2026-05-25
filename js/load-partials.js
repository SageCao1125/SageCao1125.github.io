(function () {
  "use strict";

  async function fetchPartial(url) {
    var response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to load partial: " + url);
    }
    return response.text();
  }

  async function replacePartial(placeholderId, url) {
    var html = await fetchPartial(url);
    var placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
      throw new Error("Missing placeholder: " + placeholderId);
    }
    placeholder.outerHTML = html;
  }

  async function injectInto(selector, url) {
    var html = await fetchPartial(url);
    var target = document.querySelector(selector);
    if (!target) {
      throw new Error("Missing target: " + selector);
    }
    target.innerHTML = html;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  async function initSite() {
    await Promise.all([
      replacePartial("partial-about", "partials/about.html"),
      replacePartial("partial-research", "partials/research.html"),
      replacePartial("partial-portfolio", "partials/portfolio.html"),
    ]);

    await injectInto("#main-pub-card-container", "partials/publications.html");

    initAboutEmail();
    initPublications();
    initPortfolioTabs();
    initHiddenAbstracts();
    await loadScript("js/main.js");
  }

  function showLoadError(err) {
    console.error(err);
    var msg = document.createElement("div");
    msg.style.cssText =
      "position:fixed;top:0;left:0;right:0;padding:12px 16px;background:#fff3cd;color:#664d03;z-index:99999;font-family:sans-serif;";
    msg.textContent =
      "Page failed to load. Use a local server (py -m http.server 8765) and open http://127.0.0.1:8765/ — " +
      err.message;
    document.body.appendChild(msg);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initSite().catch(showLoadError);
    });
  } else {
    initSite().catch(showLoadError);
  }
})();
