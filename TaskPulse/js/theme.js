const tema = localStorage.getItem("theme") ?? "light";
const temaFinal = tema === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : tema;

document.documentElement.classList.remove("light", "dark");
document.documentElement.classList.add(temaFinal);
