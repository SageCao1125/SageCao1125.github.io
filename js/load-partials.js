(function () {
  "use strict";

  var siteInitialized = false;
  var siteInitializing = false;
  var portfolioHtmlPromise = null;

  function fetchPartial(url, retries) {
    var attempts = retries == null ? 3 : retries;

    function attemptFetch(remaining) {
      return new Promise(function (resolve, reject) {
        var settled = false;
        var timer = setTimeout(function () {
          if (settled) {
            return;
          }
          settled = true;
          if (remaining > 1) {
            attemptFetch(remaining - 1).then(resolve).catch(reject);
            return;
          }
          reject(new Error("Timed out loading partial: " + url));
        }, 15000);

        fetch(url)
          .then(function (response) {
            if (settled) {
              return null;
            }
            if (!response.ok) {
              throw new Error("Failed to load partial: " + url + " (" + response.status + ")");
            }
            return response.arrayBuffer();
          })
          .then(function (buffer) {
            if (settled || buffer == null) {
              return;
            }
            settled = true;
            clearTimeout(timer);
            resolve(new TextDecoder("utf-8").decode(buffer));
          })
          .catch(function (err) {
            if (settled) {
              return;
            }
            settled = true;
            clearTimeout(timer);
            if (remaining > 1) {
              attemptFetch(remaining - 1).then(resolve).catch(reject);
              return;
            }
            reject(err);
          });
      });
    }

    return attemptFetch(attempts);
  }

  function preserveScroll(run) {
    var scrollY = window.scrollY || window.pageYOffset || 0;
    return Promise.resolve(run()).then(function (result) {
      if (scrollY > 0) {
        window.scrollTo(0, scrollY);
      }
      return result;
    });
  }

  async function replacePartial(placeholderId, url, deferImages) {
    var html = await fetchPartial(url);
    if (deferImages !== false) {
      html = deferImagesInHtml(html);
    }
    await replacePartialHtml(placeholderId, html);
  }

  async function injectHtmlInto(selector, html, deferImages) {
    if (deferImages !== false) {
      html = deferImagesInHtml(html);
    }
    var target = document.querySelector(selector);
    if (!target) {
      throw new Error("Missing target: " + selector);
    }

    await preserveScroll(function () {
      target.innerHTML = html;
      observeLazyMedia(target);
      if (window.siteNavigation) {
        window.siteNavigation.refresh();
      }
    });
  }

  async function replacePartialHtml(placeholderId, html) {
    var placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
      throw new Error("Missing placeholder: " + placeholderId);
    }

    await preserveScroll(function () {
      placeholder.outerHTML = html;
      var root = document.getElementById(placeholderId.replace("partial-", ""));
      if (root) {
        observeLazyMedia(root);
      }
      if (window.siteNavigation) {
        window.siteNavigation.refresh();
      }
    });
  }

  function getPortfolioHtml() {
    if (!portfolioHtmlPromise) {
      portfolioHtmlPromise = fetchPartial("partials/portfolio.html");
    }
    return portfolioHtmlPromise;
  }

  async function injectInto(selector, url) {
    var html = await fetchPartial(url);
    await injectHtmlInto(selector, html);
  }

  function revealSectionsIfReady() {
    if (typeof window.revealPageSections === "function") {
      window.revealPageSections();
    }
  }

  function revealLoadedSections() {
    document.documentElement.classList.remove("site-loading");
    revealSectionsIfReady();
  }

  function scrollToInitialHash() {
    var hash = (window.location.hash || "").toLowerCase();
    var sectionIndexByHash = {
      "#home": "0",
      "#about": "1",
      "#research": "2",
      "#portfolio": "3",
    };
    var index = sectionIndexByHash[hash];

    if (index == null || !window.siteNavigation) {
      return;
    }

    setTimeout(function () {
      window.siteNavigation.scrollTo(index);
    }, 80);
  }

  function siteContentMissing() {
    return !document.getElementById("about") || !document.getElementById("research");
  }
  function runWhenIdle(fn, timeout) {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(fn, { timeout: timeout || 1000 });
    } else {
      setTimeout(fn, Math.min(timeout || 1000, 300));
    }
  }

  function loadFooterExtras() {
    runWhenIdle(function () {
      Array.prototype.slice
        .call(document.querySelectorAll("img[data-footer-src]"))
        .forEach(function (img) {
          img.src = img.getAttribute("data-footer-src");
          img.removeAttribute("data-footer-src");
        });

      var globe = document.getElementById("visitor-globe");
      if (!globe || globe.getAttribute("data-loaded") === "true") {
        return;
      }

      var src = globe.getAttribute("data-script-src");
      if (!src) {
        return;
      }

      var iframe = document.createElement("iframe");
      iframe.title = "Visitor map";
      iframe.loading = "lazy";
      iframe.style.cssText = "border:0;width:100%;height:100%;overflow:hidden;";
      iframe.srcdoc =
        '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;}</style></head><body><script src="' +
        src.replace(/"/g, "%22") +
        '"><\/script></body></html>';
      globe.setAttribute("data-loaded", "true");
      globe.appendChild(iframe);
    }, 2500);
  }
  async function loadPortfolioPartial() {
    if (document.getElementById("portfolio")) {
      return;
    }
    var html = deferImagesInHtml(await getPortfolioHtml());
    await replacePartialHtml("partial-portfolio", html);
    initPortfolioTabs();
    observeLazyMedia(document.getElementById("portfolio"));
  }

  async function initSite() {
    if (siteInitialized || siteInitializing) {
      return;
    }
    siteInitializing = true;

    try {
      var aboutHtmlPromise = fetchPartial("partials/about.html");
      var researchHtmlPromise = fetchPartial("partials/research.html");
      var publicationsHtmlPromise = fetchPartial("partials/publications.html");

      await replacePartialHtml("partial-about", await aboutHtmlPromise);
      initAboutEmail();

      await replacePartialHtml(
        "partial-research",
        deferImagesInHtml(await researchHtmlPromise)
      );
      await injectHtmlInto("#main-pub-card-container", await publicationsHtmlPromise);

      initPublications();
      initHiddenAbstracts();

      revealLoadedSections();
      siteInitialized = true;
      if (window.location.hash.toLowerCase() !== "#portfolio") {
        scrollToInitialHash();
      }

      loadFooterExtras();
      loadPortfolioPartial().then(function () {
        if (window.location.hash.toLowerCase() === "#portfolio") {
          scrollToInitialHash();
        }
      }).catch(function (err) {
        console.error(err);
      });
    } finally {
      siteInitializing = false;
    }
  }

  function showLoadError(err) {
    console.error(err);
    document.documentElement.classList.remove("site-loading");
    var msg = document.createElement("div");
    msg.style.cssText =
      "position:fixed;top:0;left:0;right:0;padding:12px 16px;background:#fff3cd;color:#664d03;z-index:99999;font-family:sans-serif;";
    msg.textContent =
      "Page failed to load. Refresh the page or check your connection — " + err.message;
    document.body.appendChild(msg);
  }

  function bootSite() {
    if (siteInitialized || siteInitializing) {
      return;
    }
    initSite().catch(showLoadError);
  }

  window.addEventListener("pageshow", function (event) {
    if (event.persisted && siteContentMissing()) {
      siteInitialized = false;
      document.documentElement.classList.add("site-loading");
      bootSite();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootSite);
  } else {
    bootSite();
  }
})();
