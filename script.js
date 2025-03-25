// 🔹 Memberstack progress tracking — FULL VERSION

// Główna logika: działa po załadowaniu strony i Memberstacka
window.addEventListener("memberstack.ready", async function () {
  const memberData = await window.$memberstackDom.getCurrentMember();
  const member = memberData.data?.member;

  if (!member) {
    console.warn("⚠️ Użytkownik niezalogowany lub brak danych Memberstack");
    return;
  }

  const playlistSlug = new URLSearchParams(window.location.search).get("playlist");
  const currentLessonSlug = window.location.pathname.split("/").pop();

  let completedLessons = {};

  try {
    completedLessons = JSON.parse(member.customFields.completedLessons || "{}");
  } catch (e) {
    console.warn("❌ Błąd parsowania completedLessons JSON");
  }

  if (!completedLessons[playlistSlug]) {
    completedLessons[playlistSlug] = [];
  }

  // 🔹 ZAZNACZ ukończone lekcje w menu
  completedLessons[playlistSlug].forEach(slug => {
    console.log("➡️ Szukam lekcji do oznaczenia jako complete:", slug);
    const el = document.querySelector(`[data-lesson-slug="${slug}"] .dash-lesson--complete-mark`);
    if (el) {
      el.classList.add("is-complete");
      console.log("✅ Zaznaczono jako complete:", slug);
    } else {
      console.warn("❌ Nie znaleziono elementu dla sluga:", slug);
    }
  });

  // 🔹 Klikanie w checkbox
  document.querySelectorAll(".dash-lesson--complete-mark").forEach(mark => {
    mark.addEventListener("click", async function (e) {
      e.preventDefault();
      e.stopPropagation();

      const lessonLink = mark.closest("[data-lesson-slug]");
      if (!lessonLink) return;

      const slug = lessonLink.getAttribute("data-lesson-slug");
      const list = completedLessons[playlistSlug];

      if (mark.classList.contains("is-complete")) {
        mark.classList.remove("is-complete");
        completedLessons[playlistSlug] = list.filter(s => s !== slug);
      } else {
        mark.classList.add("is-complete");
        if (!list.includes(slug)) {
          list.push(slug);
        }
      }

      console.log("💾 ZAPISUJĘ completedLessons:", completedLessons);

      await window.$memberstackDom.updateMember({
        customFields: {
          completedLessons: JSON.stringify(completedLessons)
        }
      });
    });
  });

  // 🔹 Przycisk Next
  const nextBtn = document.getElementById("nextLessonBtn");

  if (nextBtn) {
    nextBtn.addEventListener("click", async function (e) {
      e.preventDefault();

      const currentLesson = document.querySelector(".dash-chapter-lesson.w--current");
      if (!currentLesson) return;

      const slug = currentLesson.getAttribute("data-lesson-slug");
      const mark = currentLesson.querySelector(".dash-lesson--complete-mark");

      if (!slug || !mark) return;

      if (!completedLessons[playlistSlug].includes(slug)) {
        mark.classList.add("is-complete");
        completedLessons[playlistSlug].push(slug);

        console.log("💾 ZAPISUJĘ (z Next):", completedLessons);

        await window.$memberstackDom.updateMember({
          customFields: {
            completedLessons: JSON.stringify(completedLessons)
          }
        });
      }

      // 🔹 Przejdź dalej (jeśli to nie ostatnia lekcja)
      const lessonLinks = Array.from(document.querySelectorAll('[data-lesson-slug]'))
        .filter(el => el.closest('[data-playlist-slug]')?.getAttribute('data-playlist-slug') === playlistSlug);

      const slugs = lessonLinks.map(link => link.getAttribute('data-lesson-slug'));
      const currentIndex = slugs.indexOf(slug);

      if (currentIndex < slugs.length - 1) {
        const nextSlug = slugs[currentIndex + 1];
        window.location.href = `/lessons/${nextSlug}?playlist=${playlistSlug}`;
      } else {
        console.log("🏁 Ostatnia lekcja — nie przechodzę dalej");
        const btnText = nextBtn.querySelector(".btn--text");
        if (btnText) btnText.textContent = "Complete";
      }
    });
  }
});

// 🔹 Nawigacja prev/next (tworzy linki do poprzedniej/następnej lekcji)
document.addEventListener("DOMContentLoaded", function () {
  const currentSlug = window.location.pathname.split("/").pop().split("?")[0];
  const playlistSlug = new URLSearchParams(window.location.search).get("playlist");

  const lessonLinks = Array.from(document.querySelectorAll('[data-lesson-slug]'))
    .filter(el => el.closest('[data-playlist-slug]')?.getAttribute('data-playlist-slug') === playlistSlug);

  const slugs = lessonLinks.map(link => link.getAttribute('data-lesson-slug'));
  const currentIndex = slugs.indexOf(currentSlug);

  const prevBtn = document.querySelector("#prevLessonBtn");
  const nextBtn = document.querySelector("#nextLessonBtn");

  if (prevBtn && currentIndex > 0) {
    const prevSlug = slugs[currentIndex - 1];
    prevBtn.href = `/lessons/${prevSlug}?playlist=${playlistSlug}`;
  } else if (prevBtn) {
    prevBtn.style.display = "none";
  }

  if (nextBtn && currentIndex < slugs.length - 1) {
    const nextSlug = slugs[currentIndex + 1];
    nextBtn.href = `/lessons/${nextSlug}?playlist=${playlistSlug}`;
  } else if (nextBtn) {
    nextBtn.href = "#";
    const btnText = nextBtn.querySelector(".btn--text");
    if (btnText) btnText.textContent = "Complete";
  }
});
