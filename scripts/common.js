window.addEventListener("load", function() {
  document.body.style.opacity = 1;
});
/*
Скрыть/Отобразить футер.
Изначально футер скрыт, он появляется незаметно,
когда мы останоовили скролл в конце страницы
*/
(function() {
  var footer = document.querySelector(".page__footer"),
    zones = document.querySelector(".zones"),
    cityElem = document.querySelector(".city"),
    cityFooterCls = "city_footer-visible",
    zonesVisibleCls = "zones_visible",
    hiddenCls = "footer_hidden",
    precision = 0.003,
    delay = 750,
    timestamp = 0,
    requestId = -1,
    limit = 0;

  updateLimit();
  onScroll();

  window.addEventListener("scroll", onScroll);
  window.addEventListener("resize", updateLimit);

  function onScroll(event) {
    timestamp = new Date().getTime();
    window.cancelAnimationFrame(requestId);
    requestId = window.requestAnimationFrame(frame);
  }
  function frame() {
    if (timestamp + delay >= new Date().getTime()) {
      requestId = window.requestAnimationFrame(frame);
      return;
    }
    if (zones && zones.classList.contains(zonesVisibleCls)) {
      removeListeners();
    }
    if (window.pageYOffset >= limit) {
      showFooter();
      if (window.innerWidth >= 768) {
        // hideTopElem();
      }
      if (window.innerWidth >= 768) {
        replacePath(data.cityPath);
        app.cityInView = true;
      }
    }
  }
  function updateLimit() {
    limit = document.body.scrollHeight - window.innerHeight;
    limit = Math.floor(limit * (1 - precision));
  }
  function showFooter() {
    footer.classList.remove(hiddenCls);
    cityElem.classList.add(cityFooterCls);
    removeListeners();
  }
  function removeListeners() {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", updateLimit);
  }
})();
/*
Анимация при скроле:
.top - .info (window vertical)
.zones (self horizontal)
.city - появление из темного
*/
(function() {
  var laxWinY = new Lax(),
    laxZonesX = new Lax(),
    zones = document.querySelector(".zones__inner"),
    info = document.querySelector(".top__info"),
    infoVisibleCls = "info_visible";
  laxWinY.addPreset("topZoomIn", function() {
    return {
      "data-lax-scale_medium": "0 1, (vh/2) 1.05"
    };
  });
  laxWinY.addPreset("topFadeOut", function() {
    return {
      "data-lax-opacity_medium": "0 1, (vh/2) 0"
    };
  });
  laxWinY.addPreset("topSlideOut", function() {
    return {
      "data-lax-translate-x_medium": "0 0, (vh/2) (-elw)"
    };
  });
  laxWinY.addPreset("infoFadeIn", function() {
    return {
      "data-lax-opacity_medium": "(vh/3) 0, (vh/1.5) 1"
    };
  });
  // laxWinY.addPreset("cityMaskFadeOut", function() {
  //   return {
  //     "data-lax-opacity_medium": "(-vh) 1, 0 0, (vh) 1"
  //   };
  // });
  laxWinY.addPreset("cityMaskFadeOut", function() {
    return {
      "data-lax-opacity_medium": "0 0, (vh) 1, (vh*2) 0 | loop=(vh*2)"
    };
  });
  laxWinY.addPreset("cityMaskFadeIn", function() {
    return {
      "data-lax-opacity_medium": "0 0, (-vh) 1"
    };
  });
  laxZonesX.addPreset("zones", function() {
    return {
      "data-lax-opacity_medium": "0 0,(vw) 1"
    };
  });
  laxWinY.setup({ selector: "[data-lax-winY]", breakpoints: { medium: 768 } });
  laxZonesX.setup({
    selector: "[data-lax-zones]",
    breakpoints: { medium: 768 }
  });

  window.requestAnimationFrame(updateLax);
  window.addEventListener("resize", function() {
    laxWinY.updateElements();
    laxZonesX.updateElements();
  });

  function updateLax() {
    laxWinY.update(window.scrollY);
    if (zones) {
      laxZonesX.update(zones.scrollLeft);
    }
    window.requestAnimationFrame(updateLax);
    // if (window.scrollY > window.innerHeight * 0.01) {
    //   info.classList.add(infoVisibleCls);
    //   return;
    // }
    // info.classList.remove(infoVisibleCls);
  }
})();
/*
Отслеживание скрола .zones и при нуле - скрытие
Скрытие .top при переходе в зоны
Отображение .top при возврате в город
*/
(function() {
  var zones = document.querySelector(".zones"),
    zonesInner = document.querySelector(".zones__inner"),
    zonesInnerNoBgCls = "zones__inner_no-background",
    footerHidden = true;
  zonesInner.addEventListener("scroll", function() {
    if (zonesInner.scrollLeft <= 0) {
      app.zonesVisible = false;
      app.activeZone = null;
      zonesInner.classList.remove("zones__inner_visible");
      // showTopElem();
      showFooterElem();
      footerHidden = false;
      return;
    }
    if (
      zonesInner.scrollLeft <= window.innerWidth &&
      !zonesInner.classList.contains(zonesInnerNoBgCls)
    ) {
      zonesInner.classList.add(zonesInnerNoBgCls);
    }
    if (
      zonesInner.scrollLeft > window.innerWidth &&
      zonesInner.classList.contains(zonesInnerNoBgCls)
    ) {
      zonesInner.classList.remove(zonesInnerNoBgCls);
    }
    if (
      zonesInner.scrollLeft >= zonesInner.scrollWidth - window.innerWidth &&
      window.pageYOffset < window.innerHeight / 10
    ) {
      showFooterElem();
      footerHidden = false;
    } else if (!footerHidden) {
      hideFooterElem();
      footerHidden = true;
    }
  });
})();
/*
Горизонтальный скролл для .zones
Вертикальное прокручивание колесика превращается в горизонтальное
Условия:
app.zonesVisible,
window.pageYOffset > 0
![data-wheel-ignore]
scrollLeft > 0
scrollLeft < scrollWidth - clientWidth
*/
(function() {
  var zonesInner = document.querySelector(".zones__inner"),
    limit,
    left,
    delta;
  window.addEventListener(
    "wheel",
    function(event) {
      var ignore =
        event.target.closest(".mb-content") ||
        event.target.closest("[data-wheel-ignore]");
      delta = getDelta(event);
      if (ignore) {
        if (!needPreventIgnore(ignore, delta)) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
      }
      if (!app.zonesVisible) {
        return;
      }
      limit = zonesInner.scrollWidth - zonesInner.offsetWidth;
      left = zonesInner.scrollLeft;
      if (left >= limit && delta >= 0) {
        return;
      }
      if (left >= limit && window.pageYOffset > 0) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      zonesInner.scrollLeft += delta;
    },
    { passive: false }
  );
  function getDelta(event) {
    return Math.abs(event.deltaY) > Math.abs(event.deltaX)
      ? event.deltaY
      : event.deltaX;
  }
  function needPreventIgnore(ignore, delta) {
    var limit = ignore.scrollHeight - ignore.clientHeight;
    if (
      (delta < 0 && ignore.scrollTop <= 0) ||
      (ignore.scrollTop >= limit && delta > 0)
    ) {
      return true;
    }
    return false;
  }
})();
/*
Scrollize
Доскроливание элементов.
Если мы поскролили и недоскролили N пикселей, то скрипт сделает это за нас
*/
(function() {
  var elemSelector = "[data-scrollize-elem]",
    parentSelector = "[data-scrollize-parent]",
    limit = 0.25,
    requestId = -1,
    timestamp = 0,
    delay = 1000;

  window.addEventListener("scroll", onScroll);
  for (
    var i = 0,
      parentElems = document.querySelectorAll(parentSelector),
      l = parentElems.length;
    i < l;
    i++
  ) {
    parentElems[i].addEventListener("scroll", onScroll);
  }

  function onScroll() {
    timestamp = new Date().getTime();
    if (requestId == -1) {
      requestId = window.requestAnimationFrame(frame);
    }
  }
  function frame() {
    if (timestamp + delay < new Date().getTime()) {
      window.cancelAnimationFrame(frame);
      requestId = -1;
      scrollEnd();
      return;
    }
    requestId = window.requestAnimationFrame(frame);
  }
  function scrollEnd() {
    var elems = document.querySelectorAll(elemSelector),
      parents = document.querySelectorAll(parentSelector),
      elemsCoord = getCoord(elems);
    if (typeof elemsCoord == "number" && !app.zonesVisible) {
      disableScrollPointer();
      anime({
        targets: "html,body",
        scrollTop: elemsCoord,
        duration: 350,
        easing: "easeInOutQuad",
        complete: enableScrollPointer
      });
    }
    if (!parents || !parents.length) {
      return;
    }
    for (var i = 0, l = parents.length, parentCoord; i < l; i++) {
      parentCoord = getParentCoord(parents[i]);
      if (typeof parentCoord != "number") {
        continue;
      }
      if (parentCoord == parents[i].scrollLeft) {
        continue;
      }
      if (!app.zonesVisible) {
        disableScrollPointer();
        anime({
          targets: parents[i],
          scrollLeft: parentCoord,
          duration: 350,
          easing: "easeInOutQuad",
          complete: enableScrollPointer
        });
      }
    }
  }
  function getParentCoord(elem) {
    var limitNow = window.innerWidth * limit,
      scrollEnd = elem.scrollWidth - window.innerWidth;
    if (elem.scrollLeft <= limitNow) {
      return 0;
    }
    if (elem.scrollLeft + limitNow > scrollEnd) {
      return scrollEnd;
    }
  }
  function getCoord(elems) {
    var limitNow = parseInt(limit * window.innerHeight),
      tops = [],
      top = null,
      result = Infinity;
    for (var i = 0, l = elems.length; i < l; i++) {
      rect = elems[i].getBoundingClientRect();
      top = Math.abs(rect.top);
      if (top <= limitNow && top > 0) {
        tops.push(rect.top);
      }
    }
    if (!tops.length) {
      return null;
    }
    for (var i = 0, l = tops.length; i < l; i++) {
      if (Math.abs(tops[i]) < result) {
        result = tops[i];
      }
    }
    return window.pageYOffset + result;
  }
})();
/*
Подключение анимации Lottie для .city
*/
(function() {
  var container = document.querySelector(".city-graphics__animations"),
    bgContainer = document.querySelector(".city-graphics__animations_bg");

  // addAnim({
  //   name: "traffic_light",
  //   container: container,
  //   zIndex: 0
  // });
  // addAnim({
  //   name: "car",
  //   container: container,
  //   zIndex: 2
  // });
  // addAnim({
  //   name: "bus",
  //   container: container,
  //   zIndex: 1
  // });
  // addAnim({
  //   ratio: "xMinYMin slice",
  //   name: "dron2",
  //   container: container,
  //   zIndex: 3
  // });
  // addAnim({
  //   name: "bushs",
  //   container: container,
  //   zIndex: 4
  // });
  // addAnim({
  //   name: "new_clouds",
  //   container: bgContainer,
  //   zIndex: 1
  // });
  if (window.innerWidth > 768) {
    addAnim({
      name: "full",
      container: container,
      zIndex: 1
    });
    addAnim({
      name: "clouds_old",
      container: bgContainer,
      zIndex: 1
    });
  }
})();
/*
При ресайзе окна, устанавливается правильный отступ для картинок внутри .city
Проблема: У картинок разный размер, поэтому по высоте они съезжают.
Этот код восстанавливает правильно расположение
*/
(function() {
  var elem = document.querySelector(".city-graphics__images"),
    bg = document.querySelector(".city-graphics"),
    ew = 3000,
    eh = 1686,
    b = 0.125;

  resize();
  window.addEventListener("resize", resize);

  function resize() {
    var ww = window.innerWidth,
      wh = window.innerHeight,
      ch = elem.offsetHeight,
      k = Math.max(ww / ew, wh / eh);
    // elem.style.bottom = (eh * k - ch) * b + "px";
    bg.style.backgroundPosition = "center bottom " + -(eh * k - ch) * b + "px";
  }
})();
/*
Установка времени на часах школы в .city
*/
(function() {
  var hourElem = document.querySelector(".city-graphics__svg-path_hour"),
    minuteElem = document.querySelector(".city-graphics__svg-path_minute"),
    hourDegree = 30,
    minuteDegree = 6,
    calcError = -90,
    hourTranslate = "2553px, 1121px",
    hourOrigin = "-0.45% 0.67%",
    minuteTranslate = "2539px,1132px";

  if (!hourElem || !minuteElem) {
    return;
  }

  hourElem.style.transformOrigin = hourOrigin;
  updateWatches();

  function updateWatches() {
    var date = new Date(),
      hours = date.getHours() % 12,
      minutes = date.getMinutes(),
      hourAngle = hours * hourDegree + calcError + (hourDegree / 60) * minutes,
      minuteAngle = minutes * minuteDegree + calcError;
    hourElem.style.transform =
      "translate(" + hourTranslate + ") rotate(" + hourAngle + "deg)";
    minuteElem.style.transform =
      "translate(" + minuteTranslate + ") rotate(" + minuteAngle + "deg)";
    setTimeout(updateWatches, 5000);
  }
})();

// Функция отключает события мыши на странице
function disableScrollPointer() {
  document.body.style.pointerEvents = "none";
  window.addEventListener("wheel", preventDefault, { passive: false });
  scrollPointerDisabled = true;
}
// Функция включает события мыши на странице
function enableScrollPointer() {
  document.body.style.pointerEvents = "auto";
  window.removeEventListener("wheel", preventDefault);
  scrollPointerDisabled = false;
}
// Функция предотвращает событие
function preventDefault(event) {
  event.preventDefault();
}
// Функция скролит к элементу .city
function scrollToCity() {
  var city = document.querySelector(".city"),
    top = city ? city.getBoundingClientRect().top : 0,
    windowTop = window.pageYOffset;
  anime({
    targets: "html, body",
    scrollTop: top + windowTop,
    duration: 350,
    easing: "easeInOutSine"
  });
}
// Функция скролит к элементу .info
function scrollToInfo(fn) {
  var info = document.querySelector(".top"),
    top = info ? info.getBoundingClientRect().top : 0;
  anime({
    targets: "html, body",
    scrollTop: top + window.pageYOffset + window.innerHeight,
    duration: 350,
    easing: "easeInOutSine",
    complete: fn ? fn : function() {}
  });
}
// Функция скролит к элементу .top
function scrollToTop(fn) {
  var info = document.querySelector(".top"),
    top = info ? info.getBoundingClientRect().top : 0;
  anime({
    targets: "html, body",
    scrollTop: top + window.pageYOffset,
    duration: 350,
    easing: "easeInOutSine",
    complete: fn ? fn : function() {}
  });
}
// Функция для подключения анимаций Lottie
function addAnim(options) {
  var name = typeof options != "object" ? options : "",
    pathFolder = "./animation/",
    anim,
    cls;

  if (!options.container) {
    return;
  }

  if (options.className) {
    cls = options.className;
  } else {
    cls =
      "city-graphics__anim" +
      (options.name ? " city-graphics__anim_" + options.name : "");
  }

  anim = lottie.loadAnimation({
    container: options.container,
    renderer: "canvas",
    loop: true,
    autoplay: true,
    path: pathFolder + (options.file || (options.name || name) + ".json"),
    rendererSettings: {
      preserveAspectRatio: options.ratio || "xMidYMax slice",
      className: cls
    }
  });

  anim.addEventListener("DOMLoaded", function() {
    anim.container.style.zIndex =
      typeof options.zIndex == "number" ? options.zIndex : 1;
  });
  return anim;
}
// Функция скрывает элемент .top
function hideTopElem() {
  var topElem = document.querySelector(".top"),
    topHiddenCls = "top_hidden",
    scroll = window.pageYOffset - (topElem ? topElem.offsetHeight : 0),
    cityElem = document.querySelector(".city"),
    cityTopCls = "city_top-hidden";
  requestAnimationFrame(function() {
    topElem.classList.add(topHiddenCls);
    cityElem.classList.add(cityTopCls);
    window.scrollTo(window.pageXOffset, scroll);
  });
}
// Функция отображает элемент .top
function showTopElem() {
  var topElem = document.querySelector(".top"),
    topHiddenCls = "top_hidden",
    cityElem = document.querySelector(".city"),
    cityTopCls = "city_top-hidden",
    scroll;
  topElem.classList.remove(topHiddenCls);
  scroll = window.pageYOffset + topElem.offsetHeight;
  requestAnimationFrame(function() {
    window.scrollTo(window.pageXOffset, scroll);
    requestAnimationFrame(function() {
      cityElem.classList.remove(cityTopCls);
    });
  });
}
// Функция отображает элемент .footer
function showFooterElem() {
  var footerElem = document.querySelector(".page__footer"),
    footerHiddenCls = "footer_hidden",
    cityElem = document.querySelector(".city"),
    cityFooterCls = "city_footer-visible",
    scroll = window.pageYOffset + cityElem.getBoundingClientRect().top;
  footerElem.classList.remove(footerHiddenCls);
  requestAnimationFrame(function() {
    cityElem.classList.add(cityFooterCls);
    window.scrollTo(window.pageXOffset, scroll);
  });
}
// Функция скрывает элемент .footer
function hideFooterElem() {
  var footerElem = document.querySelector(".page__footer"),
    footerHiddenCls = "footer_hidden",
    cityElem = document.querySelector(".city"),
    cityFooterCls = "city_footer-visible",
    scroll = window.pageYOffset + cityElem.getBoundingClientRect().top;
  requestAnimationFrame(function() {
    footerElem.classList.add(footerHiddenCls);
    cityElem.classList.remove(cityFooterCls);
    window.scrollTo(window.pageXOffset, scroll);
  });
}
// Скролл в 0 при ресайзе мобилки
// и изменение размеров зон
(function() {
  var zones = document.querySelector(".zones"),
    timestamp = 0,
    requestId = -1,
    delay = 500;
  window.addEventListener("resize", function(event) {
    timestamp = new Date().getTime();
    if (requestId == -1) {
      requestId = window.requestAnimationFrame(frame);
    }
  });
  function frame() {
    if (window.innerWidth >= 768) {
      return;
    }
    zones.style.height = window.innerHeight + "px";
    if (app && app.zonesVisible) {
      window.scrollTo(window.pageXOffset, 0);
    }
    if (timestamp + delay < new Date().getTime()) {
      window.cancelAnimationFrame(requestId);
      requestId = -1;
      return;
    }
    requestId = window.requestAnimationFrame(frame);
  }
})();

(function() {
  var lastY = null,
    startY = null,
    delay = 50,
    timestamp = null;
  window.addEventListener("touchstart", touchstart);
  function touchstart(event) {
    startY = event.touches[0].screenY;
    timestamp = new Date().getTime();
    window.addEventListener("touchmove", touchmove);
    if (app && app.mobileDisplay == 2) {
      window.removeEventListener("touchstart", touchstart);
      window.removeEventListener("touchmove", touchmove);
      return;
    }
  }
  function touchmove() {
    var lastY = event.touches[0].screenY;
    if (new Date().getTime() - delay > timestamp) {
      if (startY > lastY) {
        app.mobileDisplay += 1;
      } else if (startY < lastY) {
        app.mobileDisplay -= 1;
      }
      window.removeEventListener("touchmove", touchmove);
      return;
    }
  }
})();
function replacePath(path) {
  path = "/" + path;
  // if (!location.search) {
  path += "/";
  // }
  requestAnimationFrame(function() {
    history.replaceState({}, document.title, path + location.search);
  });
}
