(function () {
  "use strict";

  var siteInitialized = false;
  var siteInitializing = false;
  var mainJsLoaded = false;

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
    if (mainJsLoaded) {
      return Promise.resolve();
    }
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        mainJsLoaded = true;
        resolve();
        return;
      }
      var script = document.createElement("script");
      script.src = src;
      script.onload = function () {
        mainJsLoaded = true;
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function revealSectionsIfReady() {
    if (typeof window.revealPageSections === "function") {
      window.revealPageSections();
    }
  }

  function siteContentMissing() {
    return !document.getElementById("about") || !document.getElementById("research");
  }

  function preloadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = src;
    });
  }

  function waitForHomeReady() {
    return Promise.race([
      preloadImage("images/background/sky.png"),
      new Promise(function (resolve) {
        setTimeout(resolve, 6000);
      }),
    ]);
  }

  async function loadPortfolioPartial() {
    if (document.getElementById("portfolio")) {
      scheduleTravelImageWarm(document.getElementById("portfolio"));
      return;
    }
    await replacePartial("partial-portfolio", "partials/portfolio.html");
    initPortfolioTabs();
    if (window.jQuery && $.fn.isotope && $(".portfolio-items").length) {
      $(".portfolio-items").isotope({ filter: ".robot" });
    }
    revealSectionsIfReady();
    observeLazyMedia(document.getElementById("portfolio"));
    scheduleTravelImageWarm(document.getElementById("portfolio"));
  }

  async function initSite() {
    if (siteInitialized || siteInitializing) {
      return;
    }
    siteInitializing = true;

    try {
      await loadScript("js/main.js");
      revealSectionsIfReady();

      await replacePartial("partial-about", "partials/about.html", false);
      initAboutEmail();

      await replacePartial("partial-research", "partials/research.html");
      await injectInto("#main-pub-card-container", "partials/publications.html");

      initPublications();
      initHiddenAbstracts();

      await loadPortfolioPartial();
      revealSectionsIfReady();
      siteInitialized = true;
    } finally {
      siteInitializing = false;
    }
  }

  function showLoadError(err) {
    console.error(err);
    var msg = document.createElement("div");
    msg.style.cssText =
      "position:fixed;top:0;left:0;right:0;padding:12px 16px;background:#fff3cd;color:#664d03;z-index:99999;font-family:sans-serif;";
    msg.textContent =
      "Page failed to load. Refresh the page or check your connection — " + err.message;
    document.body.appendChild(msg);
  }

  function bootSite() {
    waitForHomeReady()
      .then(function () {
        return initSite();
      })
      .catch(showLoadError);
  }

  window.addEventListener("pageshow", function (event) {
    if (event.persisted && siteContentMissing()) {
      siteInitialized = false;
      bootSite();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootSite);
  } else {
    bootSite();
  }
})();
