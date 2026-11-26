(function(){
  var KEY = "e-lektioner-tema";
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  if (stored === "light" || stored === "dark") root.setAttribute("data-theme", stored);

  var dark = window.matchMedia("(prefers-color-scheme: dark)");
  function current(){
    var t = root.getAttribute("data-theme");
    return t === "light" || t === "dark" ? t : (dark.matches ? "dark" : "light");
  }
  function label(btn){
    btn.textContent = current() === "dark" ? "Ljust läge" : "Mörkt läge";
  }
  document.addEventListener("DOMContentLoaded", function(){
    var btn = document.querySelector(".theme-toggle");
    if (!btn) return;
    label(btn);
    btn.addEventListener("click", function(){
      var next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      label(btn);
    });
    dark.addEventListener("change", function(){ label(btn); });
  });
})();
