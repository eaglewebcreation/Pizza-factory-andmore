/* The Pizza Factory & More: open-now status, the online ordering switch, today's pick and the carousels */
(function () {
  // Paste the online ordering link here once it's set up (for example the Square Online ordering page).
  // Every "Order online" button then goes straight to it.
  var ORDER_URL = "";

  // Hours in shop time (America/Denver). Day numbers: 0 = Sunday ... 6 = Saturday. Times are 24h decimals.
  var HOURS = { 0: [], 1: [[16, 20]], 2: [[11, 14], [16, 20]], 3: [[11, 14], [16, 20]], 4: [[11, 14], [16, 20]], 5: [[11, 14], [16, 20]], 6: [[16, 20]] };
  var DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function fmt(h) {
    var hr = Math.floor(h), m = Math.round((h - hr) * 60), ap = hr >= 12 ? "PM" : "AM", d = hr % 12 || 12;
    return d + (m ? ":" + (m < 10 ? "0" : "") + m : "") + " " + ap;
  }

  function shopNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(o.weekday);
      var hour = (parseInt(o.hour, 10) % 24) + parseInt(o.minute, 10) / 60;
      return day < 0 ? null : { day: day, hour: hour };
    } catch (err) { return null; }
  }

  function status(now) {
    var today = HOURS[now.day];
    for (var i = 0; i < today.length; i++) {
      if (now.hour >= today[i][0] && now.hour < today[i][1]) return { state: "open", text: "Open now until " + fmt(today[i][1]) };
      if (now.hour < today[i][0]) return { state: "closed", text: (i === 0 ? "Opens today at " : "Back at ") + fmt(today[i][0]) };
    }
    for (var k = 1; k <= 7; k++) {
      var d = (now.day + k) % 7;
      if (HOURS[d].length) return { state: "closed", text: "Closed now · Opens " + (k === 1 ? "tomorrow" : DAY[d]) + " at " + fmt(HOURS[d][0][0]) };
    }
    return null;
  }

  var now = shopNow();
  if (now) {
    var s = status(now);
    if (s) document.querySelectorAll("[data-open-status]").forEach(function (el) { el.textContent = s.text; el.setAttribute("data-state", s.state); });
    document.querySelectorAll(".hours tr[data-days]").forEach(function (tr) {
      if (tr.getAttribute("data-days").split(",").indexOf(String(now.day)) > -1) tr.className = "today";
    });
  }

  if (ORDER_URL) {
    document.querySelectorAll("[data-order]").forEach(function (a) { a.href = ORDER_URL; a.target = "_blank"; a.rel = "noopener"; });
    document.querySelectorAll("[data-order-url]").forEach(function (a) { a.href = ORDER_URL; });
    document.querySelectorAll("[data-order-live]").forEach(function (el) { el.hidden = false; });
    document.querySelectorAll("[data-order-soon]").forEach(function (el) { el.hidden = true; });
  }

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var arrow = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; };

  // Today's pick: one menu item per weekday, shop time. Names, prices and photos all come from the menu.
  // Sunday the shop is closed, so it shows Monday's pick as tomorrow's.
  var PICKS = {
    1: { name: "The Monster", price: "From $15.49", img: "monster", alt: "The Monster", link: "#menu-ultimate", desc: "The local favorite, loaded with everything but the kitchen sink." },
    2: { name: "Green Chile, Chicken & Cheese Rolled Tacos", price: "$6.99", img: "rolled-tacos", alt: "Green chile, chicken and cheese rolled tacos", link: "#menu-extras", desc: "Served with your choice of dipping sauce." },
    3: { name: "Wings", price: "From $10.99", img: "garlic-parmesan-wings", alt: "Wings in homemade garlic parmesan", link: "#menu-wings", desc: "Bone-in or boneless, tossed in one of 11 sauces, including our homemade garlic parmesan." },
    4: { name: "Chef Salad", price: "Small $8.99 · Large $13.49", img: "chef-salad", alt: "Chef salad with homemade ranch", link: "#menu-salads", desc: "Crisp greens with sliced turkey and ham, shredded cheddar, fresh tomatoes and cucumbers." },
    5: { name: "Factory Fries", price: "$11.49", img: "factory-fries", alt: "Factory Fries", link: "#menu-extras", desc: "A pound of fries smothered in homemade garlic parmesan with a habanero drizzle." },
    6: { name: "Funnel Cake Fries", price: "$5.99", img: "funnel-cake-fries", alt: "Funnel cake fries", link: "#menu-sweets", desc: "A sweet finish, made right here." }
  };
  var pickBox = document.querySelector("[data-pick]");
  if (pickBox && now) {
    var tomorrow = now.day === 0, p = PICKS[tomorrow ? 1 : now.day];
    var set = function (sel, fn) { var el = pickBox.querySelector(sel); if (el) fn(el); };
    set("[data-pick-label]", function (el) { el.textContent = (tomorrow ? "Tomorrow's pick · " + DAY[1] : "Today's pick · " + DAY[now.day]); });
    set("[data-pick-name]", function (el) { el.textContent = p.name; });
    set("[data-pick-desc]", function (el) { el.textContent = p.desc; });
    set("[data-pick-price]", function (el) { el.textContent = p.price; });
    set("[data-pick-img]", function (el) { el.src = "/images/" + p.img + ".jpg"; el.alt = p.alt; });
    set("[data-pick-link]", function (el) { el.href = "/menu" + p.link; });
  }

  // Coverflow carousel: current slide front and center, previous and next set back to the sides. Rotates every 6 seconds,
  // pauses on hover, focus or touch, swipes on phones. People who ask for reduced motion keep the plain grid.
  // data-carousel-item picks the slides (reviews by default), data-carousel-noun names them for screen readers,
  // and data-carousel-max turns the carousel on only at or below that width (phones), keeping the grid above it.
  function carousel(box) {
    var slides = Array.prototype.slice.call(box.querySelectorAll(box.getAttribute("data-carousel-item") || ".quote"));
    if (slides.length < 2) return null;
    var noun = box.getAttribute("data-carousel-noun") || "review";
    var DELAY = 6000, i = 0, timer = null, hold = 0, stopped = false, seen = true, io = null, offs = [];
    function on(el, ev, fn, opt) { el.addEventListener(ev, fn, opt); offs.push(function () { el.removeEventListener(ev, fn, opt); }); }

    var viewport = document.createElement("div"); viewport.className = "carousel-viewport";
    var track = document.createElement("div"); track.className = "carousel-track"; track.setAttribute("aria-live", "off");
    slides.forEach(function (s, n) {
      s.setAttribute("role", "group");
      s.setAttribute("aria-roledescription", "slide");
      s.setAttribute("aria-label", (n + 1) + " of " + slides.length);
      track.appendChild(s);
    });
    viewport.appendChild(track);
    box.appendChild(viewport);
    box.classList.add("is-carousel");
    box.setAttribute("role", "region");
    box.setAttribute("aria-roledescription", "carousel");

    var controls = document.createElement("div"); controls.className = "carousel-controls";
    var prev = document.createElement("button"); prev.type = "button"; prev.className = "carousel-btn"; prev.setAttribute("aria-label", "Previous " + noun); prev.innerHTML = arrow("M15 18l-6-6 6-6");
    var next = document.createElement("button"); next.type = "button"; next.className = "carousel-btn"; next.setAttribute("aria-label", "Next " + noun); next.innerHTML = arrow("M9 18l6-6-6-6");
    var dots = document.createElement("div"); dots.className = "carousel-dots";
    var dotBtns = slides.map(function (s, n) {
      var b = document.createElement("button"); b.type = "button"; b.className = "carousel-dot";
      b.setAttribute("aria-label", "Show " + noun + " " + (n + 1));
      b.addEventListener("click", function () { go(n, true); });
      dots.appendChild(b); return b;
    });
    var pause = document.createElement("button"); pause.type = "button"; pause.className = "carousel-btn carousel-pause";
    controls.appendChild(prev); controls.appendChild(dots); controls.appendChild(next); controls.appendChild(pause);
    box.appendChild(controls);

    function paintPause() {
      pause.setAttribute("aria-label", stopped ? "Play " + noun + "s" : "Pause " + noun + "s");
      pause.innerHTML = stopped ? arrow("M8 5l11 7-11 7z") : arrow("M9 5v14M15 5v14");
    }
    function go(n, byUser) {
      var len = slides.length;
      i = (n + len) % len;
      slides.forEach(function (s, k) {
        var cur = k === i;
        s.classList.toggle("is-active", cur);
        s.classList.toggle("is-prev", k === (i - 1 + len) % len);
        s.classList.toggle("is-next", k === (i + 1) % len);
        s.setAttribute("aria-hidden", cur ? "false" : "true");
        if (s.tagName === "A") { if (cur) s.removeAttribute("tabindex"); else s.setAttribute("tabindex", "-1"); }
      });
      dotBtns.forEach(function (b, k) { b.setAttribute("aria-current", k === i ? "true" : "false"); });
      if (byUser) { track.setAttribute("aria-live", "polite"); restart(); }
    }
    function tick() { if (!hold && !stopped && seen && !document.hidden) go(i + 1, false); }
    function restart() { clearInterval(timer); timer = setInterval(tick, DELAY); }

    // A tap on a side slide brings it to the front instead of following its link.
    slides.forEach(function (s, k) { on(s, "click", function (e) { if (k !== i) { e.preventDefault(); go(k, true); } }); });
    prev.addEventListener("click", function () { go(i - 1, true); });
    next.addEventListener("click", function () { go(i + 1, true); });
    pause.addEventListener("click", function () { stopped = !stopped; paintPause(); restart(); });

    on(box, "mouseenter", function () { hold++; });
    on(box, "mouseleave", function () { hold = Math.max(0, hold - 1); restart(); });
    on(box, "focusin", function () { if (!box.dataset.focus) { hold++; box.dataset.focus = "1"; } });
    on(box, "focusout", function (e) {
      if (!box.contains(e.relatedTarget) && box.dataset.focus) { hold = Math.max(0, hold - 1); delete box.dataset.focus; restart(); }
    });

    var x0 = null, y0 = 0;
    viewport.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; hold++; }, { passive: true });
    viewport.addEventListener("touchend", function (e) {
      hold = Math.max(0, hold - 1);
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(i + (dx < 0 ? 1 : -1), true); else restart();
    }, { passive: true });
    viewport.addEventListener("touchcancel", function () { x0 = null; hold = Math.max(0, hold - 1); });

    if ("IntersectionObserver" in window) { io = new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }); io.observe(box); }
    paintPause();
    go(0, false);
    restart();

    // Undo everything, for when a phone-only carousel is turned back into the grid (a rotated tablet or a resized window).
    return function () {
      clearInterval(timer);
      if (io) io.disconnect();
      offs.forEach(function (f) { f(); });
      slides.forEach(function (s) {
        ["role", "aria-roledescription", "aria-label", "aria-hidden", "tabindex"].forEach(function (a) { s.removeAttribute(a); });
        s.classList.remove("is-active", "is-prev", "is-next");
        box.insertBefore(s, viewport);
      });
      viewport.remove(); controls.remove();
      box.classList.remove("is-carousel");
      box.removeAttribute("role"); box.removeAttribute("aria-roledescription");
      delete box.dataset.focus;
    };
  }

  if (!reduce) document.querySelectorAll("[data-carousel]").forEach(function (box) {
    var max = box.getAttribute("data-carousel-max");
    if (!max || !window.matchMedia) { carousel(box); return; }
    var mq = window.matchMedia("(max-width: " + max + "px)"), undo = null;
    function apply() {
      if (mq.matches && !undo) undo = carousel(box);
      else if (!mq.matches && undo) { undo(); undo = null; }
    }
    if (mq.addEventListener) mq.addEventListener("change", apply); else if (mq.addListener) mq.addListener(apply);
    apply();
  });

  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
