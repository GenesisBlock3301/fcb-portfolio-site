(() => {
  "use strict";

  /* ---------- Data: business partners (from company profile PDF, pages 14-15) ---------- */
  const PARTNERS = [
    { name: "Zara", file: "zara.jpg" },
    { name: "H&M", file: "hm.jpg" },
    { name: "Puma", file: "puma.jpg" },
    { name: "Primark", file: "primark.jpg" },
    { name: "LC Waikiki", file: "lcwaikiki.jpg" },
    { name: "Matalan", file: "matalan.jpg" },
    { name: "Max", file: "max.jpg" },
    { name: "Mothercare", file: "mothercare.jpg" },
    { name: "ALDI", file: "aldi.jpg" },
    { name: "U.S. Polo Assn.", file: "uspolo.jpg" },
    { name: "Lefties", file: "lefties.jpg" },
    { name: "Fashion UK", file: "fashionuk.jpg" },
    { name: "Original Marines", file: "originalmarines.jpg" },
    { name: "Etam", file: "etam.jpg" },
    { name: "After Eden", file: "aftereden.jpg" },
    { name: "Triumph", file: "triumph.jpg" },
    { name: "Lounge", file: "lounge.jpg" },
    { name: "Esotiq", file: "esotiq.jpg" },
    { name: "ten Cate", file: "tencate.jpg" },
    { name: "Hunkemöller", file: "hunkemoller.jpg" },
    { name: "Sloggi", file: "sloggi.jpg" },
    { name: "Naturana", file: "naturana.jpg" }
  ];

  /* Small helper so one broken feature can never take the rest of the page down again. */
  function safe(label, fn) {
    try { fn(); } catch (err) { console.error(`[FCB site] "${label}" failed:`, err); }
  }

  /* ---------- Fail-safe: force all reveal content visible no matter what ----------
     If any script below throws, or IntersectionObserver isn't available, this guarantees
     text is never left permanently invisible (the exact bug that hid copy across the site). */
  function forceRevealVisible() {
    document.querySelectorAll(".reveal").forEach(el => el.classList.add("is-visible"));
  }
  const revealFailSafe = setTimeout(forceRevealVisible, 2500);

  /* ================= Active nav link tracking (declared first: onScroll below depends on it) ================= */
  const navLinks = Array.from(document.querySelectorAll("[data-nav]"));
  const navSections = navLinks
    .map(a => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  function updateActiveNav() {
    if (!navSections.length) return;
    const scrollPos = window.scrollY + 140;
    let current = navSections[0];
    for (const sec of navSections) {
      if (sec.offsetTop <= scrollPos) current = sec;
    }
    navLinks.forEach(a => {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + current.id);
    });
  }

  /* ================= Header: scroll state + progress bar + mobile nav ================= */
  const header = document.getElementById("siteHeader");
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  const progressBar = document.getElementById("progressBar");
  const backToTop = document.getElementById("backToTop");

  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle("is-scrolled", y > 8);
    backToTop.classList.toggle("is-visible", y > 600);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (y / docHeight) * 100 : 0;
    progressBar.style.width = pct + "%";

    updateActiveNav();
  }

  safe("header scroll binding", () => {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  });

  safe("mobile nav toggle", () => {
    navToggle.addEventListener("click", () => {
      navToggle.classList.toggle("is-open");
      mainNav.classList.toggle("is-open");
    });
    mainNav.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        navToggle.classList.remove("is-open");
        mainNav.classList.remove("is-open");
      });
    });
  });

  safe("back to top button", () => {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  /* ================= Marquee: inject partner logos (duplicated for seamless loop) ================= */
  safe("logo marquee", () => {
    const marqueeTrack = document.getElementById("marqueeTrack");
    function buildLogoSet() {
      const frag = document.createDocumentFragment();
      PARTNERS.forEach(p => {
        const img = document.createElement("img");
        img.src = `images/partners/${p.file}`;
        img.alt = p.name;
        // eager: these live in an off-screen, transform-animated track where
        // lazy-loading never triggers, leaving most logos as raw alt text.
        img.loading = "eager";
        img.decoding = "async";
        frag.appendChild(img);
      });
      return frag;
    }
    marqueeTrack.appendChild(buildLogoSet());
    marqueeTrack.appendChild(buildLogoSet());
  });

  /* ================= Clients grid ================= */
  safe("clients grid", () => {
    const clientsGrid = document.getElementById("clientsGrid");
    PARTNERS.forEach(p => {
      const cell = document.createElement("div");
      cell.className = "client-logo";
      cell.innerHTML = `<img src="images/partners/${p.file}" alt="${p.name}" loading="lazy">`;
      clientsGrid.appendChild(cell);
    });
  });

  /* ================= Scroll reveal ================= */
  safe("scroll reveal", () => {
    const revealEls = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { forceRevealVisible(); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(el => io.observe(el));
    clearTimeout(revealFailSafe); // observer is working, no need for the blunt fallback
  });

  /* ================= Stat counters ================= */
  safe("stat counters", () => {
    const statEls = document.querySelectorAll(".stat-num");

    function animateCount(el) {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || "";
      const isYear = el.dataset.format === "year";
      const duration = 1400;
      const start = performance.now();

      function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        el.textContent = (isYear ? value : value.toLocaleString());
        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          el.textContent = (isYear ? target : target.toLocaleString()) + suffix;
        }
      }
      requestAnimationFrame(frame);
    }

    if (!("IntersectionObserver" in window)) {
      statEls.forEach(animateCount);
      return;
    }
    const statIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        statIo.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    statEls.forEach(el => statIo.observe(el));
  });

  /* ================= Product filter ================= */
  safe("product filter", () => {
    const filterButtons = document.querySelectorAll(".filter-btn");
    const productCards = document.querySelectorAll(".product-card");
    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const filter = btn.dataset.filter;
        productCards.forEach(card => {
          const show = filter === "all" || card.dataset.cat === filter;
          card.classList.toggle("is-hidden", !show);
        });
      });
    });
  });

  /* ================= Contact form (static demo submit — no backend wired up) ================= */
  safe("contact form", () => {
    const contactForm = document.getElementById("contactForm");
    const formNote = document.getElementById("formNote");
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      formNote.textContent = "Thanks — your inquiry has been noted. Our team will reach out via email shortly.";
      contactForm.reset();
    });
  });

  /* ================= Footer year ================= */
  safe("footer year", () => {
    document.getElementById("year").textContent = new Date().getFullYear();
  });

})();
