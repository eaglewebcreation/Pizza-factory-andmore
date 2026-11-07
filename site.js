/* The Pizza Factory & More: open-now status and the online ordering switch */
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

  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
