(function () {
  "use strict";

  var siteInitialized = false;
  var siteInitializing = false;
  var homeFirstDone = false;
  var portfolioHtmlPromise = null;
  var portfolioWarmStarted = false;
  var HOME_BG = "images/background/sky.png";
  var HOME_MIN_DISPLAY_MS = 400;

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
    html = deferImagesInHtml(html);
    var target = document.querySelector(selector);
    if (!target) {
      throw new Error("Missing target: " + selector);
    }

    await preserveScroll(function () {
      target.innerHTML = html;
      observeLazyMedia(target);
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

  function finishHomeFirstPhase() {
    if (homeFirstDone) {
      return Promise.resolve();
    }
    homeFirstDone = true;

    var home = document.getElementById("home");
    if (home) {
      home.style.minHeight = window.innerHeight + "px";
    }

    return new Promise(function (resolve) {
      setTimeout(function () {
        document.documentElement.classList.remove("site-loading");
        revealSectionsIfReady();
        resolve();
      }, HOME_MIN_DISPLAY_MS);
    });
  }

  function waitForHomeReady() {
    return new Promise(function (resolve) {
      var settled = false;
      var timeoutId = setTimeout(function () {
        if (settled) {
          return;
        }
        settled = true;
        finishHomeFirstPhase().then(resolve);
      }, 8000);

      preloadImage(HOME_BG)
        .then(waitForNextFrame)
        .then(function () {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(timeoutId);
          return finishHomeFirstPhase();
        })
        .then(resolve);
    });
  }

  function extractTravelImageSources(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var images = doc.querySelectorAll(".portfolio-group.robot img[src]");
    return Array.prototype.slice.call(images)
      .map(function (img) {
        return img.getAttribute("src");
      })
      .filter(Boolean);
  }

  function preloadImageUrls(urls) {
    var index = 0;
    var batchSize = 2;

    function loadBatch() {
      var count = 0;
      while (index < urls.length && count < batchSize) {
        var img = new Image();
        img.decoding = "async";
        img.src = urls[index];
        index += 1;
        count += 1;
      }

      if (index < urls.length) {
        if ("requestIdleCallback" in window) {
          requestIdleCallback(loadBatch, { timeout: 1200 });
        } else {
          setTimeout(loadBatch, 350);
        }
      }
    }

    loadBatch();
  }

  function startPortfolioWarmup() {
    if (portfolioWarmStarted) {
      return;
    }
    portfolioWarmStarted = true;

    setTimeout(function () {
      getPortfolioHtml()
        .then(function (html) {
          preloadImageUrls(extractTravelImageSources(html));
        })
        .catch(function (err) {
          console.error(err);
        });
    }, 1500);
  }

  async function loadPortfolioPartial() {
    if (document.getElementById("portfolio")) {
      scheduleTravelImageWarm(document.getElementById("portfolio"));
      return;
    }
    var html = await getPortfolioHtml();
    await replacePartialHtml("partial-portfolio", html);
    initPortfolioTabs();
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

      getPortfolioHtml().catch(function (err) {
        console.error(err);
      });

      await replacePartial("partial-research", "partials/research.html");
      await injectInto("#main-pub-card-container", "partials/publications.html");
      schedulePublicationImageWarm(
        document.getElementById("main-pub-card-container"),
        true
      );

      initPublications();
      initHiddenAbstracts();
      startPortfolioWarmup();

      await loadPortfolioPartial();
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
    if (siteInitialized || siteInitializing) {
      return;
    }
    waitForHomeReady()
      .then(function () {
        return initSite();
      })
      .catch(showLoadError);
  }

  window.addEventListener("pageshow", function (event) {
    if (event.persisted && siteContentMissing()) {
      siteInitialized = false;
      homeFirstDone = false;
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
