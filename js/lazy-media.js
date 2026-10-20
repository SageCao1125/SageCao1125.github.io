var lazyMediaObserver = null;

function initLazyMedia() {
  if (!("IntersectionObserver" in window) || lazyMediaObserver) return;
  lazyMediaObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.target.tagName === "VIDEO") {
          if (entry.isIntersecting && entry.target.isConnected) {
            activateLazyVideo(entry.target);
          } else {
            entry.target.pause();
          }
        } else if (entry.isIntersecting && entry.target.isConnected) {
          activateLazyImage(entry.target);
        }
      });
    },
    { rootMargin: "400px 0px", threshold: 0.01 }
  );
}

function activateLazyImage(img) {
  var src = img.getAttribute("data-src");
  if (!src) return;
  img.decoding = "async";
  img.src = src;
  img.removeAttribute("data-src");
  img.removeAttribute("loading");
  if (lazyMediaObserver) lazyMediaObserver.unobserve(img);
}

function activateLazyVideo(video) {
  var sources = video.querySelectorAll("source[data-src]");
  sources.forEach(function (source) {
    source.src = source.getAttribute("data-src");
    source.removeAttribute("data-src");
  });
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  if (sources.length) video.load();
  var playing = video.play();
  if (playing && playing.catch) playing.catch(function () {});
}

function deferImagesInHtml(html) {
  // A template keeps media inert while sources are moved off the loading path.
  var template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("img[src]").forEach(function (img) {
    img.setAttribute("data-src", img.getAttribute("src"));
    img.removeAttribute("src");
  });
  template.content.querySelectorAll("video").forEach(function (video) {
    video.removeAttribute("autoplay");
    video.setAttribute("preload", "none");
    video.querySelectorAll("source[src]").forEach(function (source) {
      source.setAttribute("data-src", source.getAttribute("src"));
      source.removeAttribute("src");
    });
  });
  return template.innerHTML;
}

function observeLazyMedia(root) {
  initLazyMedia();
  var scope = root && root.querySelectorAll ? root : document;
  scope.querySelectorAll("img[data-src], video").forEach(function (media) {
    if (lazyMediaObserver) {
      lazyMediaObserver.observe(media);
    } else if (media.tagName === "VIDEO") {
      activateLazyVideo(media);
    } else {
      activateLazyImage(media);
    }
  });
}
