// Dark / Light Theme Toggle with Local Storage Persistence
const body = document.body;
const themeBtn = document.getElementById("themeBtn");
const menu = document.querySelector(".menu");
const nav = document.querySelector(".nav");

if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    body.classList.toggle("light");
    const isLight = body.classList.contains("light");
    themeBtn.textContent = isLight ? "☀" : "☾";
    localStorage.setItem("theme", isLight ? "light" : "dark");
  });

  if (localStorage.getItem("theme") === "light") {
    body.classList.add("light");
    themeBtn.textContent = "☀";
  }
}

// Mobile Navigation Toggle
if (menu && nav) {
  menu.addEventListener("click", () => nav.classList.toggle("open"));
  document.querySelectorAll("nav a").forEach((link) => {
    link.addEventListener("click", () => nav.classList.remove("open"));
  });
}

// Intersection Observer for Smooth Reveal Animations
const observerOptions = {
  threshold: 0.12,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target); // Reveal only once for optimal performance
    }
  });
}, observerOptions);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Dynamic Current Year update in Footer
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}