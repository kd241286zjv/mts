// var meter = new FPSMeter(document.body, {
//   position: "fixed",
//   heat: 1,
//   graph: 1,
//   history: 100
// });
var scrollPointerDisabled = false,
  changeElemOnScroll = true,
  scrollOptions = {};
/*
Что бы установить hash при выборе зоны,
необходимо указать в update вызов setSlide
И вызвать setActiveTech в mounted.
*/
Vue.component("zone", {
  template: document.getElementById("zoneTemplate").innerHTML,
  props: ["data", "transition", "index", "slide-index"],
  data: function() {
    return {
      slide: 0,
      activeTech: {},
      lineTranslate: 0,
      imageTranslate: 0,
      zone: data.zones[0],
      zoneInfoExpanded: false
    };
  },
  computed: {
    techLength: function() {
      return this.zone.tech.length;
    },
    itemsWidth: function() {
      return this.techLength * 100;
    },
    itemWidth: function() {
      return 100 / this.techLength;
    },
    itemsTranslate: function() {
      return -(100 / this.techLength) * this.slide;
    }
  },
  methods: {
    nextSlide: function() {
      if (this.slide >= this.zone.tech.length - 1) {
        app.scrollToNextZone();
        return;
      }
      this.setSlide(this.slide + 1);
    },
    prevSlide: function() {
      if (this.slide <= 0) {
        app.scrollToPrevZone();
        return;
      }
      this.setSlide(this.slide - 1);
    },
    setSlide: function(index, noscrollZones) {
      // if (app && app.activeZone && app.activeZone.name != this.data.name) {
      //   return;
      // }
      index = index <= 0 ? 0 : index;
      index = index >= this.techLength ? this.techLength - 1 : index;
      if (isNaN(index)) {
        return;
      }
      this.slide = index;
      this.setActiveTech();
      if (noscrollZones) {
        return;
      }
      scrollZonesInner(this.index, this.slide);
    },
    setActiveTech: function(index) {
      this.activeTech = this.zone.tech[
        typeof index == "undefined" ? this.slide : index
      ];
      // history.pushState(
      //   {},
      //   this.zone.title + "-" + this.activeTech.title,
      //   "#" + (this.slide + 1)
      // );
    },
    getTechByIndex: function(index) {
      return this.zone.tech(index) || null;
    },
    setSlideFromHash: function() {
      var index = +window.location.hash.slice(1);
      if (isNaN(index) || index == 0) {
        return;
      }
      this.setSlide(index - 1);
    },
    updateImagePosition: function() {
      var image = this.$el.querySelector(".zone-image__image"),
        imageWidth = image.offsetWidth,
        windowWidth = window.innerWidth,
        dist = imageWidth - windowWidth;
      this.imageTranslate = -dist * ((1 / (this.techLength - 1)) * this.slide);
      // currentZone.width - window.innerWidth * 1.2
    },
    updateLinePosition: function() {
      var elem = this.$el.querySelectorAll(".zone-pag__item")[this.slide];
      this.lineTranslate = elem.offsetLeft;
    },
    copyData: function(data) {
      if (!data) {
        return;
      }
      this.zone = this.data;
    },
    toCity: hideZones
  },
  watch: {
    zoneInfoExpanded: function(value) {
      if (value) {
        return;
      }
      scrollInfoToTop(this.$el);
    },
    slideIndex: function(index) {
      this.setSlide(index, true);
    },
    slide: function(value) {
      // this.updateImagePosition();
      this.updateLinePosition();
      scrollInfoToTop(this.$el);
    },
    data: function(value) {
      this.copyData(value);
    },
    zone: function() {
      this.setSlide(0, true);
    }
  },
  beforeMount: function() {
    this.copyData(this.data);
    window.addEventListener("load", this.updateLinePosition);
  },
  mounted: function() {
    // window.addEventListener("popstate", this.setSlideFromHash);
    // this.setSlideFromHash();
    if (!this.zone) {
      return;
    }
    this.updateLinePosition();
    this.setSlide(this.slideIndex, true);
    this.$el
      .querySelector(".zone-image__image")
      .addEventListener("load", this.updateImagePosition);
  }
});
/*

КЛИК НА РАЗЪЕЗЖАЮЩЕЙ

При клике на дом/меню в городе, запоминаем таргет и запускаем таймер.
По истичении времени отображаем нужную зону.
При клике выделяем пункт меню и подсвечиваем здание.
Следом раздвигаем и увеличиваем дома.
Потом отображаем лоадер и отображаем зоны.

Зоны просто сдвигаем через transform (?), предварительно наскролив нужную.
Нужно предварительно замерить размеры зоны и сохранить их в элементе.
Потом, когда будем отображать, будут известны размеры и сдвиг скрола.
*/
/*

РАЗЪЕЗД ДОМОВ

Можно забирать размеры и расположение из маски
По воозможности, отображать разъезд в центре, но не оставлять пустое место по бокам


*/
var mustShowSwipe = true;
var app = new Vue({
  el: document.querySelector("#app"),
  data: {
    needUpdateByLocation: false,
    menu_visible: false,
    zones: data.zones,
    cityButtonHidden: true,
    activeZone: null,
    zonesVisible: false,
    hoveredCityName: null,
    techIndex: null,
    cityInView: false,
    mobileDisplay: 0,
    display: 0,
    mustOpen: {
      timestamp: null,
      zone: null,
      requestId: -1,
      delay: 350,
      animationTimeline: null
    },
    share: generateShare()
  },
  computed: {
    zonesReversed: function() {
      var arr = this.zones.slice().reverse();
      return arr;
    }
  },
  methods: {
    getSlideIndex: function(zone) {
      // activeZone && (zone.name == activeZone.name ? techIndex : 0)
      if (!this.activeZone) {
        return 0;
      }
      if (zone.name == this.activeZone.name) {
        return this.techIndex;
      }
      if (this.prevZone && zone.name == this.prevZone.name) {
        return zone.tech.length - 1;
      }
      return 0;
    },
    setZoneByScroll: function(index) {
      this.activeZone = this.zones[index];
    },
    setTechByScroll: function(index) {
      this.setSlide(index);
    },
    cityButtonClick: function() {
      this.closeMenu();
      scrollToCity();
    },
    closeMenu: function(delay) {
      var app = this;
      if (delay) {
        setTimeout(function() {
          app.menu_visible = false;
        }, delay);
      } else {
        this.menu_visible = false;
      }
    },
    cityOver: function(name) {
      this.hoveredCityName = name;
    },
    cityOut: function(name) {
      if (this.hoveredCityName == name) {
        this.hoveredCityName = null;
      }
    },
    toggleMenu: function() {
      this.menu_visible = !this.menu_visible;
    },
    getZoneByName: function(name) {
      for (var i = 0, l = this.zones.length; i < l; i++) {
        if (this.zones[i].name == name) {
          return this.zones[i];
        }
      }
      return null;
    },
    getPrevZone: function() {
      if (!this.activeZone) {
        return;
      }
      var name = this.activeZone.name;
      for (var i = 1, l = this.zones.length; i < l; i++) {
        if (this.zones[i].name == name) {
          return this.zones[i - 1];
        }
      }
      return null;
    },
    setZoneByName: function(name) {
      var zonesInner = document.querySelector(".zones .zones__inner"),
        zonesInnerVisibleCls = "zones__inner_visible",
        zone = name ? this.getZoneByName(name) : null;
      setZonesScroll(name);
      zonesInner.classList.add(zonesInnerVisibleCls);
      this.zonesVisible = true;
      this.activeZone = zone;
      this.display = 1;
      this.mobileDisplay = 1;
      hideTopElem();
      hideFooterElem();
      this.closeMenu();
    },
    moveCityIndicator: function(zone) {
      if (!zone) {
        return;
      }
      var elem = this.$el.querySelector(
          ".city-menu__link[href='" + zone.path + "']"
        ),
        lineElem = this.$el.querySelector(".city__header-line"),
        translateTo = elem.offsetLeft + elem.offsetWidth / 2;
      lineElem.style.transform =
        "translateX(" + translateTo + "px) translateZ(0)";
    },
    cityClick: function(name) {
      var zone = this.getZoneByName(name);
      this.mustOpen.zone = zone;
      this.moveCityIndicator(zone);
      hideTopElem();
      this.display = 1;
      hideFooterElem();
    },
    scrollToInfo: function(fn) {
      scrollToInfo(fn);
    },
    scrollToTop: function(fn) {
      scrollToTop(fn);
    },
    scrollToCity: function() {
      scrollToCity();
    },
    scrollToNextZone: function() {
      var index = this.activeZone.index,
        nextElem = this.zones[index + 1];
      if (!nextElem) {
        return;
      }
      scrollZonesInner(index + 1, 0, true);
    },
    scrollToPrevZone: function() {
      var index = this.activeZone.index,
        prevElem = this.zones[index - 1],
        prevLength;
      if (!prevElem) {
        scrollZonesInner(-1);
        return;
      }
      prevLength = prevElem.tech.length;
      scrollZonesInner(index - 1, prevLength - 1, true);
    },
    setSlide: function(index) {
      if (!this.activeZone) {
        return;
      }
      if (this.techIndex != index) {
        this.techIndex = index;
      }
    },
    checkLink: function(fn) {
      var pathname = location.pathname.replace(/[/]/g, ""),
        zone,
        name,
        index = pathname == data.cityPath ? -1 : +pathname;
      if (!index || typeof index != "number" || isNaN(index)) {
        return;
      }
      zone = this.zones[index - 1];
      if (!zone) {
        this.mobileDisplay = 2;
        return;
      }
      name = zone.name;
      if (!name) {
        return;
      }
      if (fn) {
        fn(name);
      }
    },
    toCity: hideZones
  },
  watch: {
    zonesVisible: function(value) {
      if (!value) {
        showTopElem();
        lottie.play();
        return;
      }
      this.mobileDisplay = 2;
      window.calcZones();
    },
    mobileDisplay: function(value) {
      var cls = "swipe-device_visible";
      if (value < 2 || !mustShowSwipe) {
        return;
      }
      var elem = document.querySelector(".swipe-device");
      mustShowSwipe = false;
      setTimeout(function() {
        elem.classList.add(cls);
        setTimeout(function() {
          elem.classList.remove(cls);
        }, 1500);
      }, 1000);
    },
    activeZone: function(value) {
      // window.zonesUpdate();
      this.mustOpen.zone = null;
      this.techIndex = 0;
      path = value ? value.path : data.cityPath;
      if (this.activeZone && this.prevZone == this.activeZone) {
        this.techIndex = this.prevZone.length - 1;
      }
      this.prevZone = this.getPrevZone();
      if (window.location.pathname.replace(/[/]/g, "") == path) {
        return;
      }
      replacePath(path);
    },
    "mustOpen.zone": function(value) {
      if (!value) {
        return;
      }
      setZonesScroll(value.name);
      this.zonesVisible = true;
      this.mustOpen.timeline = anime.timeline({
        easing: "easeInOutSine",
        duration: 350,
        autoplay: false,
        complete: function() {
          showZones(value.name);
        }
      });
      calcAnimation(value.name, this.mustOpen.timeline);
      setTimeout(this.mustOpen.timeline.play, this.mustOpen.delay);
    }
  },
  mounted: function() {
    var _this = this;
    this.moveCityIndicator(this.activeZone);
    setZoneScrollListener();
    document.body.style.opacity = 1;
    window.addEventListener("load", function() {
      _this.checkLink(function(name) {
        _this.setZoneByName(name);
        lottie.stop();
      });
      // if (!_this.activeZone) {
      setStartScrollListener.bind(_this)();
      // }
    });
  }
});
// Отключение восстановления позиции скрола при событиях истории
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
// Установка слушателя скрола при запуске страницы
function setStartScrollListener() {
  var _this = this;
  if (window.innerWidth < 768) {
    return;
  }
  window.addEventListener("wheel", startScroll, { passive: false });
  window.addEventListener("touchmove", startScroll, { passive: false });
  function startScroll(event) {
    if (window.pageYOffset >= window.innerHeight || app.zonesVisible) {
      return;
    }
    event.preventDefault();
    if (
      (_this.mobileDisplay >= 1 || _this.display == 1) &&
      event.deltaY < 0 &&
      !app.zonesVisible
    ) {
      _this.scrollToTop(function() {
        setTimeout(function() {
          window.removeEventListener("wheel", prevent);
          window.removeEventListener("touchmove", prevent);
        }, 750);
      });
      _this.mobileDisplay = 0;
      _this.display = 0;
      window.addEventListener("wheel", prevent, { passive: false });
      window.addEventListener("touchmove", prevent, { passive: false });
      return;
    }
    if (
      (_this.mobileDisplay != 1 || _this.display != 1) &&
      event.deltaY > 0 &&
      !app.zonesVisible
    ) {
      _this.scrollToInfo(function() {
        setTimeout(function() {
          window.removeEventListener("wheel", prevent);
          window.removeEventListener("touchmove", prevent);
        }, 750);
      });
      window.addEventListener("wheel", prevent, { passive: false });
      window.addEventListener("touchmove", prevent, { passive: false });
      _this.mobileDisplay = 1;
      _this.display = 1;
    }
  }
  function prevent(event) {
    event.preventDefault();
  }
}
// Вычисление анимации
function calcAnimation(name, timeline) {
  var parent = document.querySelector(".city-graphics__image_city"),
    masks = document.querySelectorAll(".city-graphics__svg-mask"),
    imageSvg = document.querySelectorAll(".city-graphics__images"),
    lastElem = document.querySelector("#city_last"),
    parentWidth = parent.offsetWidth,
    sizes = getSizesFromMasks(masks, parentWidth),
    keys = Object.keys(sizes),
    revert = false,
    shift = 0,
    size,
    gap = getGap(),
    shift = getShift(sizes[name], gap),
    translateImage =
      ((sizes[name].leftSide ? 1 : -1) *
        (sizes[name].width - parentWidth * 0.1)) /
      2;
  setLoader({
    timeline: timeline,
    size: sizes[name],
    gap: gap,
    translateImage: translateImage
  });
  for (var i = 0, l = keys.length; i < l; i++) {
    size = sizes[keys[i]];
    // что-то с этим сделать
    if (size.leftSide) {
      if (keys[i] == name) {
        revert = true;
      }
      size.shift = revert ? shift.right : shift.left;
    } else {
      size.shift = revert ? shift.right : shift.left;
      if (keys[i] == name) {
        revert = true;
      }
    }
    // с тем что сверху что-то сделать
    timeline.add(
      {
        targets: size.elem,
        translateX: size.shift
      },
      0
    );
  }
  timeline.add(
    {
      targets: lastElem,
      translateX: sizes[keys[0]].shift
    },
    0
  );
  if (window.innerWidth >= 768) {
    timeline.add(
      {
        targets: imageSvg,
        translateX: translateImage,
        scale: 1.1
      },
      0
    );
  }
}
function getGap() {
  var multiplier = 0.25,
    width = window.innerWidth;
  if (width < 768) {
    multiplier = 1.5;
  } else if (width < 1200) {
    multiplier = 0.6;
  }

  return window.innerWidth * multiplier;
}
// Установка лоадера в нужное место и поодключение анимации
function setLoader(options) {
  var container = document.querySelector(".city-graphics__loader"),
    left = getLeft(container, options);
  container.innerHTML = "";
  // container.style.left = left + "px";
  if (container.innerHTML.length == 0) {
    var anim = addAnim({
      container: container,
      name: "loader"
    });
    anim.play();
  }
  options.timeline.add(
    {
      targets: container,
      duration: 350,
      left: [left, left],
      scale: [0.6, 1],
      opacity: [0, 1]
    },
    350
  );
}
function getLeft(container, options) {
  var left = 0,
    inner = document.querySelector(".city__inner"),
    multiplier = getMultiplier(),
    realGap = options.gap * multiplier;
  if (options.size.leftSide) {
    left =
      options.size.left +
      options.size.width +
      realGap / 2 -
      container.offsetWidth / 2;
  } else {
    left = options.size.left - realGap / 2 - container.offsetWidth / 2;
  }
  return left + inner.scrollLeft;
}
function getMultiplier() {
  var width = window.innerWidth,
    multiplier = 1;
  if (width < 768) {
    multiplier = 3;
  } else if (width < 1024) {
    multiplier = 1.616;
  } else if (width < 1200) {
    multiplier = 1.212;
  }
  return (window.innerWidth / 3000) * multiplier;
}
// Получение значение смещения домов
function getShift(size, gap) {
  return {
    left: size.leftSide ? gap : 0,
    right: size.leftSide ? 0 : -gap
  };
}
// Функция возвращает инфоррмацию о размерах и расположении домов
function getSizesFromMasks(masks, parentWidth) {
  var result = {},
    elem,
    elemName;
  if (window.innerWidth < 992) {
    result["last"] = {
      elem: document.querySelector("#city_last")
    };
  }
  for (var i = 0, l = masks.length; i < l; i++) {
    elem = masks[i].closest(".city-graphics__svg");
    elemName = elem.getAttribute("data-name");
    result[elemName] = getBuildingInfo(masks[i], parentWidth);
    result[elemName].elem = elem;
  }
  return result;
}
// Функция возвращает инфоррмацию о размерах и расположении дома
function getBuildingInfo(elem, parentWidth) {
  var rect = elem.getBoundingClientRect(),
    left = rect.left;
  width = rect.width;
  return {
    width: width,
    left: left,
    leftSide: left - parentWidth / 2 + width / 2 <= 0 ? true : false
  };
}
// Функция устанавливает скролл до элемента
// также записывает  ширину блоков в атрибуты
function setZonesScroll(name) {
  setZoneSizes();
  var zones = document.querySelector(".zones__inner"),
    zone = zones.querySelector(".zone[data-name='" + name + "']");
  zones.scrollLeft = zone.offsetLeft;
}
// Функция устанавливает размеры блоков под размер картинки
function setZoneSizes() {
  var zones = document.querySelectorAll(".zones__zone"),
    image;
  for (var i = 0, l = zones.length; i < l; i++) {
    zone = zones[i];
    image = zone.querySelector(".zone-image__image");
    zone.style.width = image.offsetWidth + "px";
    // zone.style.height = image.offsetHeight - 1 + "px";
  }
}
// Функция возвращает расположение домов
function revertBuilding() {
  // return;
  var image = document.querySelector(".city-graphics__images"),
    elems = image.querySelectorAll(".city-graphics__svg"),
    loader = document.querySelector(".city-graphics__loader");
  for (var i = 0, l = elems.length; i < l; i++) {
    elems[i].style.transform = "translate(0px,0px)";
  }
  image.style.transform = "";
  loader.innerHTML = "";
  loader.style = "";

  lottie.stop();
}
// Функция анимирует появление зон
function showZones(name) {
  var zones = document.querySelector(".zones"),
    zonesInner = zones.querySelector(".zones__inner"),
    zonesInnerVisibleCls = "zones__inner_visible",
    lefta = document.querySelector(".city__inner").scrollLeft;
  anime({
    targets: zonesInner,
    translateX: [window.innerWidth, 0],
    duration: 350,
    delay: 350,
    easing: "easeInOutSine",
    complete: function() {
      var elem = this.animatables[0].target;
      elem.classList.add(zonesInnerVisibleCls);
      app.activeZone = app.getZoneByName(name);
      revertBuilding();
    }
  });
  anime({
    targets: zones,
    opacity: [0, 1],
    left: [lefta, lefta],
    duration: 350,
    delay: 350,
    easing: "easeInOutSine"
  });
}
// Функция анимирует скрытие зон
function hideZones() {
  var zones = document.querySelector(".zones"),
    zonesInner = zones.querySelector(".zones__inner"),
    zonesInnerVisibleCls = "zones__inner_visible";
  anime({
    targets: zonesInner,
    translateX: [0, window.innerWidth],
    duration: 350,
    easing: "easeInOutSine",
    complete: function() {
      var elem = this.animatables[0].target;
      elem.classList.remove(zonesInnerVisibleCls);
      app.activeZone = null;
    }
  });
  anime({
    targets: zones,
    opacity: [1, 0],
    duration: 350,
    easing: "easeInOutSine",
    complete: function() {
      app.zonesVisible = false;
      this.animatables[0].target.style = "";
      // showTopElem();
      showFooterElem();
    }
  });
}
// Функция устанавливает обработчик на .zone__inner
function setZoneScrollListener() {
  var scroller = document.querySelector(".zones__inner"),
    zones = document.querySelectorAll(
      window.innerWidth < 768 ? ".zone,.zones__footer" : ".zone"
    ),
    options = scrollOptions,
    request = {
      id: -1,
      scrollTimestamp: null,
      delay: 100,
      updateDelay: 100,
      lastUpdate: 0
    },
    requestZone = {
      id: -1,
      scrollTimestamp: null,
      delay: 100,
      lastUpdate: 0
    },
    prevZone = zones[0],
    prevZoneIndex = 0,
    prevZoneLeft = prevZone.offsetLeft,
    prevZoneWidth = prevZone.offsetWidth,
    slide,
    oldSlide;
  window.calcZones = calc;
  window.addEventListener("load", function() {
    setTimeout(function() {
      calc();
      scroller.addEventListener("scroll", scroll);
    }, 1000);
  });
  window.addEventListener("resize", calc);
  function calc() {
    options.centeringShift = getCenteringShift();
    options.coords = getCoords();
    if (data.drawCoords) {
      drawCoords(options.coords);
    }
  }
  function getCoords() {
    var coords = [],
      left,
      availiableWidth,
      pathWidth,
      length,
      width;
    for (var i = 0, l = zones.length; i < l; i++) {
      left = zones[i].offsetLeft;
      width = zones[i].classList.contains("zone")
        ? zones[i].querySelector(".zone-image__image").offsetWidth
        : zones[i].offsetWidth;
      availiableWidth = getAvailiableWidth(zones[i], width);
      length = +zones[i].getAttribute("data-length");
      pathWidth = availiableWidth / length;
      shiftLeft = getShift(zones[i], width);
      for (var j = 0, k = length; j < k; j++) {
        coords.push({
          zone: i,
          tech: j,
          width: pathWidth + (j == 0 ? shiftLeft : 0),
          left: pathWidth * j + left + (j > 0 ? shiftLeft : 0)
        });
      }
      if (!length) {
        coords.push({
          zone: i,
          tech: 0,
          width: width,
          left: left
        });
      }
    }
    return coords;
  }
  function getCenteringShift() {
    if (window.innerWidth < 992) {
      return window.innerWidth / 2;
    }
    return scroller.querySelector(".zone__col-content").offsetLeft / 2;
  }
  function getAvailiableWidth(zone, width) {
    var map = {
      city: window.innerWidth < 768 ? 0.21 : 0.245,
      education: 0.12,
      health: 0.155,
      home: 0.18,
      office: 0.18,
      retail: 0.22
    };
    return width - width * map[zone.getAttribute("data-name")];
  }
  function getShift(zone, width) {
    var map = {
      city: 0.01,
      education: 0.01,
      health: 0,
      home: 0.035,
      office: 0,
      retail: 0
    };
    return width * map[zone.getAttribute("data-name")];
  }
  function scroll() {
    request.scrollTimestamp = new Date().getTime();
    requestZone.scrollTimestamp = new Date().getTime();
    if (request.id == -1) {
      request.id = window.requestAnimationFrame(update);
    }
    if (data.stackZones && requestZone.id == -1) {
      requestZone.id = window.requestAnimationFrame(updateZone);
    }
  }
  function updateZone() {
    var currentTime = new Date().getTime(),
      zone = getZoneByScroll(),
      translateX;
    if (requestZone.scrollTimestamp + requestZone.delay < currentTime) {
      window.cancelAnimationFrame(requestZone.id);
      requestZone.id = -1;
      return;
    }
    if (zone.zone != prevZoneIndex || !prevZoneIndex) {
      for (var i = 0, l = zones.length; i < l; i++) {
        setTransformZone(zones[i], 0);
      }
    }
    if (zone.zone == 0) {
      requestZone.id = window.requestAnimationFrame(updateZone);
      return;
    }
    if (zone.zone != prevZoneIndex) {
      prevZone = getZoneByIndex(zone.zone - 1);
      prevZoneIndex = zone.zone;
      prevZoneLeft = prevZone.offsetLeft;
      prevZoneWidth = prevZone.offsetWidth;
    }
    translateX =
      scroller.scrollLeft + window.innerWidth - (prevZoneLeft + prevZoneWidth);
    if (translateX > window.innerWidth) {
      requestZone.id = window.requestAnimationFrame(updateZone);
      return;
    }
    requestZone.id = window.requestAnimationFrame(updateZone);
    setTransformZone(prevZone, translateX);
  }
  function setTransformZone(zone, translateX) {
    var container = zone.querySelector(".zone__container"),
      containerCls = "zone__container_absolute";
    if (!container) {
      return;
    }
    zone.style.transform = "translateX(" + translateX + "px)";
    if (translateX == 0) {
      zone.style.opacity = 1;
      if (container.classList.contains(containerCls)) {
        container.classList.remove(containerCls);
      }
      return;
    }
    if (translateX && !container.classList.contains(containerCls)) {
      container.classList.add(containerCls);
    }
    zone.style.opacity = 1 - translateX / window.innerWidth;
  }
  function getZoneByIndex(index) {
    return zones[index];
  }
  function update() {
    var currentTime = new Date().getTime();
    if (request.scrollTimestamp + request.delay < currentTime) {
      window.cancelAnimationFrame(request.id);
      request.id = -1;
      return;
    }
    if (!changeElemOnScroll) {
      request.id = window.requestAnimationFrame(update);
      return;
    }
    if (request.lastUpdate + request.updateDelay > currentTime) {
      request.id = window.requestAnimationFrame(update);
      return;
    }
    slide = getSlideByScroll();
    if (!oldSlide) {
      oldSlide = {};
    }
    if (slide.zone != oldSlide.zone || slide.tech != oldSlide.tech) {
      oldSlide.zone = slide.zone;
      oldSlide.tech = slide.tech;
      sendInfoToApp({
        zone: slide.zone,
        tech: slide.tech
      });
    }
    request.id = window.requestAnimationFrame(update);
    request.lastUpdate = new Date().getTime();
  }
  function getZoneByScroll() {
    var left = scroller.scrollLeft,
      coord = options.coords[0],
      lastCoord = coord;
    left += window.innerWidth;
    for (var i = 0, l = options.coords.length; i < l; i++) {
      coord = options.coords[i].tech == 0 ? options.coords[i] : coord;
      if (coord.tech != 0) {
        continue;
      }
      if (options.coords[i].left > left) {
        coord = lastCoord;
        break;
      }
      lastCoord = coord;
    }
    return coord;
  }
  function getSlideByScroll() {
    var left = scroller.scrollLeft,
      coord;
    left += options.centeringShift;
    for (var i = 0, l = options.coords.length; i < l; i++) {
      coord = options.coords[i];
      if (!options.coords[i + 1]) {
        break;
      }
      if (options.coords[i + 1].left > left) {
        break;
      }
    }
    return {
      zone: +coord.zone,
      tech: +coord.tech
    };
  }
  function drawCoords(coords) {
    var elems = document.querySelectorAll(".draw-coords"),
      elem;
    for (var i = 0, l = elems.length; i < l; i++) {
      elems[i].parentNode.removeChild(elems[i]);
    }
    for (var i = 0, l = coords.length; i < l; i++) {
      elem = document.createElement("div");
      elem.style.left = coords[i].left + "px";
      elem.style.position = "absolute";
      elem.style.width = coords[i].width + "px";
      elem.style.height = window.innerHeight / 2 + "px";
      elem.style.zIndex = 10;
      elem.style.top = 50 + "%";
      elem.className = "draw-coords";
      elem.style.border = "3px solid #fff";
      elem.style.marginTop = -window.innerHeight / 4 + "px";
      elem.style.backgroundColor = "rgba(255,0,0,.3)";
      scroller.appendChild(elem);
    }
  }
  function sendInfoToApp(info) {
    // Когда меняются параметры надо устанавливать активную зону и активную технололгию
    app.setZoneByScroll(info.zone);
    app.setTechByScroll(info.tech);
  }
}
//Функция, котоорая скролит блок при изменении техноологии
function scrollZonesInner(zoneIndex, techIndex, toEdge) {
  var zones = document.querySelector(".zones__inner"),
    coord = zoneIndex != -1 ? getCoord(zoneIndex, techIndex) : null;
  changeElemOnScroll = false;
  disableScrollPointer();
  anime({
    targets: zones,
    scrollLeft: !coord ? 0 : getScrollLeft(coord),
    duration: 350,
    easing: "easeInOutSine",
    complete: function() {
      changeElemOnScroll = true;
      enableScrollPointer();
    }
  });
  function getCoord(zoneIndex, techIndex) {
    var coords = scrollOptions.coords;
    for (var i = 0, l = coords.length; i < l; i++) {
      if (coords[i].zone == zoneIndex && coords[i].tech == techIndex) {
        return coords[i];
        break;
      }
    }
    return null;
  }
  function getScrollLeft() {
    var nextCoord = getCoord(zoneIndex + 1, 0);
    if (nextCoord) {
      scrollNextCoord = nextCoord.left - window.innerWidth;
    }
    if (toEdge && techIndex == 0) {
      return coord.left;
    }
    var result = coord.left - scrollOptions.centeringShift + coord.width / 2;
    if (toEdge && techIndex > 0 && nextCoord) {
      if (nextCoord && result > scrollNextCoord) {
        return scrollNextCoord;
      }
      return result;
    }
    if (nextCoord && result > scrollNextCoord) {
      result = scrollNextCoord;
    }
    if (coord.tech == 0 && result < coord.left) {
      result = coord.left;
    }
    return result;
  }
}
function scrollInfoToTop(el) {
  var elems = el.querySelectorAll(".zone-info__item");
  for (var i = 0, l = elems.length; i < l; i++) {
    elems[i].scrollTop = 0;
  }
}
// Генерирование sharing
function generateShare() {
  var tw, fb, ok, vk, url, okImageUrl, text;
  ok = "https://connect.ok.ru/offer?url={{url}}?&imageUrl={{imageUrl}}";
  vk = "https://vk.com/share.php?url={{url}}";
  tw = "http://twitter.com/share?text={{text}}&url={{url}}";
  fb = "https://www.facebook.com/sharer/sharer.php?u={{url}}";
  okImageUrl = data.okImage;
  text = data.twitterText;
  url = data.url;
  return {
    tw: tw.replace("{{url}}", url).replace("{{text}}", text),
    fb: fb.replace("{{url}}", url),
    ok: ok.replace("{{url}}", url).replace("{{imageUrl}}", okImageUrl),
    vk: vk.replace("{{url}}", url)
  };
}

// window.requestAnimationFrame(frame);
// function frame() {
//   meter.tick();
//   window.requestAnimationFrame(frame);
// }
