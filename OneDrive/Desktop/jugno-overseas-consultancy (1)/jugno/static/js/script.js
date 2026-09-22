(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Sticky header shadow on scroll
     --------------------------------------------------------------------- */
  const header = document.getElementById("siteHeader");
  const onScroll = () => {
    if (window.scrollY > 12) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------------
     Mobile menu toggle
     --------------------------------------------------------------------- */
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");

  function closeMenu() {
    hamburger.classList.remove("active");
    hamburger.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("open");
    document.body.style.overflow = "";
  }

  function toggleMenu() {
    const isOpen = mobileMenu.classList.toggle("open");
    hamburger.classList.toggle("active", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  }

  hamburger.addEventListener("click", toggleMenu);
  mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

  /* ---------------------------------------------------------------------
     Smooth-scroll for in-page nav links (also closes mobile menu)
     --------------------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (targetId.length <= 1) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const navH = header.offsetHeight;
      const top = target.getBoundingClientRect().top + window.scrollY - (navH - 1);
      window.scrollTo({ top, behavior: "smooth" });
      closeMenu();
    });
  });

  /* ---------------------------------------------------------------------
     Scroll-reveal animations
     --------------------------------------------------------------------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            if (el.classList.contains("stagger")) {
              Array.from(el.children).forEach((child, i) => child.style.setProperty("--i", i));
            }
            el.classList.add("in-view");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------------------------------------------------------------------
     File upload — show selected filename, click/drag affordance
     --------------------------------------------------------------------- */
  const fileInput = document.getElementById("document");
  const fileDrop = document.getElementById("fileDrop");
  const fileNameEl = document.getElementById("fileName");

  if (fileInput && fileDrop) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files[0]) {
        fileNameEl.textContent = "Selected: " + fileInput.files[0].name;
      } else {
        fileNameEl.textContent = "";
      }
    });

    ["dragover", "dragenter"].forEach((evt) =>
      fileDrop.addEventListener(evt, (e) => {
        e.preventDefault();
        fileDrop.classList.add("drag");
      })
    );
    ["dragleave", "dragend", "drop"].forEach((evt) =>
      fileDrop.addEventListener(evt, (e) => {
        e.preventDefault();
        fileDrop.classList.remove("drag");
      })
    );
    fileDrop.addEventListener("drop", (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files[0]) {
        fileInput.files = dt.files;
        fileNameEl.textContent = "Selected: " + dt.files[0].name;
      }
    });
  }

  /* ---------------------------------------------------------------------
     Application form — client-side validation + async submit
     --------------------------------------------------------------------- */
  const form = document.getElementById("applyForm");
  const formMsg = document.getElementById("formMsg");
  const submitBtn = document.getElementById("submitBtn");
  const toast = document.getElementById("toast");

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;

  function setFieldError(name, message) {
    const wrap = form.querySelector(`[data-field="${name}"]`);
    if (!wrap) return;
    wrap.classList.add("has-error");
    if (message) {
      const errEl = wrap.querySelector(".field-error");
      if (errEl) errEl.textContent = message;
    }
  }

  function clearFieldError(name) {
    const wrap = form.querySelector(`[data-field="${name}"]`);
    if (wrap) wrap.classList.remove("has-error");
  }

  function clearAllErrors() {
    form.querySelectorAll(".field").forEach((f) => f.classList.remove("has-error"));
  }

  function validateClientSide() {
    let valid = true;
    clearAllErrors();

    const fullName = form.full_name.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();
    const service = form.service.value;
    const destination = form.destination.value;

    if (fullName.length < 2) {
      setFieldError("full_name");
      valid = false;
    }
    if (!PHONE_RE.test(phone)) {
      setFieldError("phone");
      valid = false;
    }
    if (!EMAIL_RE.test(email)) {
      setFieldError("email");
      valid = false;
    }
    if (!service) {
      setFieldError("service");
      valid = false;
    }
    if (!destination) {
      setFieldError("destination");
      valid = false;
    }

    return valid;
  }

  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 4200);
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      formMsg.className = "form-msg";
      formMsg.textContent = "";

      if (!validateClientSide()) {
        formMsg.className = "form-msg error";
        formMsg.textContent = "Please correct the highlighted fields and try again.";
        return;
      }

      const originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";

      try {
        const formData = new FormData(form);
        const res = await fetch("/api/apply", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (res.ok && data.success) {
          formMsg.className = "form-msg success";
          formMsg.textContent = "Thank you! Your request has been received. Jugno Overseas Consultancy will contact you soon.";
          showToast("Application submitted successfully.");
          form.reset();
          if (fileNameEl) fileNameEl.textContent = "";
        } else if (data.errors) {
          Object.keys(data.errors).forEach((key) => setFieldError(key, data.errors[key]));
          formMsg.className = "form-msg error";
          formMsg.textContent = "Please correct the highlighted fields and try again.";
        } else {
          throw new Error("Unexpected response");
        }
      } catch (err) {
        formMsg.className = "form-msg error";
        formMsg.textContent = "Something went wrong while submitting. Please try again or contact us via WhatsApp.";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    });

    // Clear individual field errors as the user types/selects.
    ["full_name", "phone", "email", "service", "destination"].forEach((name) => {
      const el = form.elements[name];
      if (el) el.addEventListener("input", () => clearFieldError(name));
    });
  }
})();
