(function () {
  "use strict";

  var portfolioLoaded = false;
  var portfolioLoading = false;

  async function fetchPartial(url) {
    var response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to load partial: " + url);
    }
    var buffer = await response.arrayBuffer();
    return new TextDecoder("utf-8").decode(buffer);
  }

  async function replacePartial(placeholderId, url, deferImages) {
    var html = await fetchPartial(url);
    if (deferImages !== false) {
      html = deferImagesInHtml(html);
    }
    var placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
      throw new Error("Missing placeholder: " + placeholderId);
    }
    placeholder.outerHTML = html;
    var root = document.getElementById(placeholderId.replace("partial-", ""));
    if (root) {
      observeLazyMedia(root);
    }
  }

  async function injectInto(selector, url) {
    var html = await fetchPartial(url);
    html = deferImagesInHtml(html);
    var target = document.querySelector(selector);
    if (!target) {
      throw new Error("Missing target: " + selector);
    }
    target.innerHTML = html;
    observeLazyMedia(target);
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

  async function loadPortfolio() {
    if (portfolioLoaded || portfolioLoading) {
      return;
    }
    portfolioLoading = true;
    try {
      await replacePartial("partial-portfolio", "partials/portfolio.html");
      initPortfolioTabs();
      portfolioLoaded = true;
      if (window.jQuery && $.fn.isotope && $(".portfolio-items").length) {
        $(".portfolio-items").isotope({ filter: ".robot" });
      }
    } finally {
      portfolioLoading = false;
    }
  }

  function schedulePortfolioLoad() {
    var run = function () {
      loadPortfolio().catch(function (err) {
        console.error(err);
      });
    };
    if ("requestIdleCallback" in window) {
      requestIdleCallback(run, { timeout: 3000 });
    } else {
      setTimeout(run, 1500);
    }
  }

  function watchPortfolioNav() {
    document.addEventListener(
      "click",
      function (event) {
        var link = event.target.closest('[data-scroll-nav="3"]');
        if (link) {
          loadPortfolio();
        }
      },
      true
    );

    if ("IntersectionObserver" in window) {
      var placeholder = document.getElementById("partial-portfolio");
      if (!placeholder) {
        return;
      }
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              loadPortfolio();
              observer.disconnect();
            }
          });
        },
        { rootMargin: "600px 0px" }
      );
      observer.observe(placeholder);
    }
  }

  async function initSite() {
    await replacePartial("partial-about", "partials/about.html", false);

    initAboutEmail();

    await replacePartial("partial-research", "partials/research.html");
    await injectInto("#main-pub-card-container", "partials/publications.html");

    initPublications();
    initHiddenAbstracts();
    await loadScript("js/main.js");

    schedulePortfolioLoad();
    watchPortfolioNav();
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
