(function () {
  "use strict";

  var siteInitialized = false;
  var siteInitializing = false;
  var HOME_BG = "images/background/sky.png";
  var HOME_MIN_DISPLAY_MS = 600;

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

  function revealSectionsIfReady() {
    if (typeof window.revealPageSections === "function") {
      window.revealPageSections();
    }
  }

  function siteContentMissing() {
    return !document.getElementById("about") || !document.getElementById("research");
  }

  function waitForNextFrame() {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });
  }

  function preloadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = src;
    });
  }

  function showHomeFirst() {
    var home = document.getElementById("home");
    if (home) {
      home.style.backgroundImage = "url('" + HOME_BG + "')";
      home.style.minHeight = window.innerHeight + "px";
    }
    window.scrollTo(0, 0);
  }

  function finishHomeFirstPhase(startedAt) {
    var elapsed = Date.now() - startedAt;
    var remaining = Math.max(0, HOME_MIN_DISPLAY_MS - elapsed);

    return new Promise(function (resolve) {
      setTimeout(function () {
        document.documentElement.classList.remove("site-loading");
        window.scrollTo(0, 0);
        revealSectionsIfReady();
        resolve();
      }, remaining);
    });
  }

  function waitForHomeReady() {
    var startedAt = Date.now();
    showHomeFirst();

    return Promise.race([
      preloadImage(HOME_BG)
        .then(waitForNextFrame)
        .then(function () {
          return finishHomeFirstPhase(startedAt);
        }),
      new Promise(function (resolve) {
        setTimeout(function () {
          finishHomeFirstPhase(startedAt).then(resolve);
        }, 8000);
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
    observeLazyMedia(document.getElementById("portfolio"));
    scheduleTravelImageWarm(document.getElementById("portfolio"));
  }

  async function initSite() {
    if (siteInitialized || siteInitializing) {
      return;
    }
    siteInitializing = true;

    try {
      await replacePartial("partial-about", "partials/about.html", false);
      initAboutEmail();

      await replacePartial("partial-research", "partials/research.html");
      await injectInto("#main-pub-card-container", "partials/publications.html");
      schedulePublicationImageWarm(
        document.getElementById("main-pub-card-container"),
        true
      );

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
    document.documentElement.classList.remove("site-loading");
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
