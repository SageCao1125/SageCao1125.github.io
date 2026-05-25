$.fn.isInViewport = function () {
  var elementTop = $(this).offset().top;
  var elementBottom = elementTop + $(this).outerHeight();
  var viewportTop = $(window).scrollTop();
  var viewportBottom = viewportTop + $(window).height();
  return elementBottom > viewportTop && elementTop < viewportBottom;
};

var allPublications = null;
var allTopicsLink = null;
var allTopics = [];

function publicationBySelected() {
  document.getElementById("publication-by-selected").classList.add("selected-btn");
  document.getElementById("publication-by-date").classList.remove("selected-btn");
  document.getElementById("publication-by-topic").classList.remove("selected-btn");

  var a = $("#publication-by-selected");
  if (a.hasClass("activated")) {
    return;
  }

  $("#main-pub-container .subtitle a").removeClass("activated");
  $("#main-pub-container .subtitle-aux a").removeClass("activated");
  a.addClass("activated");

  $("#main-pub-card-container").html("");
  for (var pubId = 0; pubId < allPublications.length; pubId++) {
    var pub = $(allPublications[pubId]);
    if (pub.data("selected") == true) {
      $("#main-pub-card-container").append(pub);
    }
  }
}

function publicationByDate() {
  document.getElementById("publication-by-selected").classList.remove("selected-btn");
  document.getElementById("publication-by-date").classList.add("selected-btn");
  document.getElementById("publication-by-topic").classList.remove("selected-btn");

  var a = $("#publication-by-date");
  if (a.hasClass("activated")) {
    return;
  }

  $("#main-pub-container .subtitle a").removeClass("activated");
  $("#main-pub-container .subtitle-aux a").removeClass("activated");
  a.addClass("activated");

  $("#main-pub-card-container").html("");
  for (var pubId = 0; pubId < allPublications.length; pubId++) {
    if (
      pubId == 0 ||
      $(allPublications[pubId - 1]).data("year") != $(allPublications[pubId]).data("year")
    ) {
      var year = $(allPublications[pubId]).data("year");
      $("#main-pub-card-container").append(
        $("<h5 id='year-" + year.toString() + "'>" + year.toString() + "</h5>")
      );
    }
    $("#main-pub-card-container").append(allPublications[pubId]);
  }
}

function publicationByTopicInner() {
  var a = $("#publication-by-topic");
  if (a.hasClass("activated")) {
    return;
  }
  $("#main-pub-container .subtitle a").removeClass("activated");
  a.addClass("activated");

  $("#main-pub-card-container").html("");
  for (var topicId in allTopics) {
    var topic = allTopics[topicId].name;
    var topicTitle = allTopics[topicId].title;
    $("#main-pub-card-container").append(
      $("<h5 id='topic-" + topic + "'>" + topicTitle + "</h5>")
    );
    for (var pubId = 0; pubId < allPublications.length; pubId++) {
      var pub = $(allPublications[pubId]);
      if (pub.data("topic").indexOf(topic) != -1) {
        $("#main-pub-card-container").append(pub);
      }
    }
  }
}

function publicationByTopicSpecificInner(a) {
  if ($(a).hasClass("activated")) {
    return false;
  }

  $("#main-pub-container .subtitle-aux a").removeClass("activated");
  $(a).addClass("activated");
}

function publicationByTopic() {
  document.getElementById("publication-by-selected").classList.remove("selected-btn");
  document.getElementById("publication-by-date").classList.remove("selected-btn");
  document.getElementById("publication-by-topic").classList.add("selected-btn");

  publicationByTopicInner();
  publicationByTopicSpecificInner($("#main-pub-container .subtitle-aux a:first"));
  return true;
}

function publicationByTopicSpecific(a) {
  if (!$("#publication-by-topic").hasClass("activated")) {
    publicationByTopic();
  } else {
    publicationByTopicInner();
    document.getElementById("publication-by-selected").classList.remove("selected-btn");
    document.getElementById("publication-by-date").classList.remove("selected-btn");
    document.getElementById("publication-by-topic").classList.add("selected-btn");
  }

  publicationByTopicSpecificInner(a);

  var hash = a.hash;
  $(hash).prop("id", hash.substr(1) + "-noscroll");
  window.location.hash = hash;
  $(hash + "-noscroll").prop("id", hash.substr(1));

  if (!$(hash).isInViewport()) {
    $("html, body").animate({ scrollTop: $(hash).offset().top }, 1000);
  }
  return false;
}

function initPublications() {
  allPublications = $("#main-pub-card-container .pub-card");
  allTopicsLink = $("#main-pub-container .subtitle-aux a");
  allTopics = [];
  for (var topicId = 0; topicId < allTopicsLink.length; topicId++) {
    allTopics.push({
      name: $(allTopicsLink[topicId]).data("topic"),
      title: $(allTopicsLink[topicId]).html(),
    });
  }
  $("#publication-by-selected").click();
  $("#main-pub-card-container").removeClass("hide");
}
