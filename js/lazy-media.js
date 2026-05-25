var lazyMediaObserver = null;

function initLazyMedia() {
  if (!("IntersectionObserver" in window)) {
    return;
  }
  if (lazyMediaObserver) {
    return;
  }
  lazyMediaObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        activateLazyImage(entry.target);
      });
    },
    { rootMargin: "300px 0px", threshold: 0.01 }
  );
}

function activateLazyImage(img) {
  var src = img.getAttribute("data-src");
  if (!src) {
    return;
  }
  img.src = src;
  img.removeAttribute("data-src");
  if (lazyMediaObserver) {
    lazyMediaObserver.unobserve(img);
  }
}

function deferImagesInHtml(html) {
  return html.replace(/(<img\b[^>]*?\s)src=(["'])/gi, "$1data-src=$2");
}

function observeLazyMedia(root) {
  initLazyMedia();
  var scope = root && root.querySelectorAll ? root : document;
  var images = scope.querySelectorAll
    ? scope.querySelectorAll("img[data-src]")
    : document.querySelectorAll("img[data-src]");
  if (!lazyMediaObserver) {
    images.forEach(function (img) {
      activateLazyImage(img);
    });
    return;
  }
  images.forEach(function (img) {
    lazyMediaObserver.observe(img);
  });
}
