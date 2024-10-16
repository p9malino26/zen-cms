document.addEventListener("DOMContentLoaded", () => {
  /** @type {HTMLAnchorElement} */
  const redirect = document.getElementById("redirect");
  redirect.href = new URLSearchParams(location.search).get("redirect") ?? "#";
});
