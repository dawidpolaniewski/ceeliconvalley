document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const playlistSlug = urlParams.get("playlist");
  const currentLessonSlug = window.location.pathname.split("/").pop().split("?")[0];

  // Pokaż/ukryj playlisty i chaptery
  document.querySelectorAll("[data-playlist-slug]").forEach(item => {
    item.style.display = item.getAttribute("data-playlist-slug") === playlistSlug ? "block" : "none";
  });

  document.querySelectorAll("[data-chapter-list] [data-playlist-slug]").forEach(chapter => {
    chapter.style.display = chapter.getAttribute("data-playlist-slug") === playlistSlug ? "block" : "none";
  });

  // Ustaw href dla lekcji i aktywną lekcję
  document.querySelectorAll("[data-lesson-slug]").forEach(link => {
    const slug = link.getAttribute("data-lesson-slug");
    link.setAttribute("href", `/lessons/${slug}?playlist=${playlistSlug}`);
    if (slug === currentLessonSlug) {
      link.classList.add("is-active");
    }
  });

  // Ukryj menu jeśli brak playlisty
  const playlistMenu = document.querySelector("[playlist-menu]");
  if (!playlistSlug && playlistMenu) {
    playlistMenu.style.display = "none";
  }

  // Główna logika Memberstack
  window.addEventListener("memberstack.ready", async function () {
    const memberData = await window.$memberstackDom.getCurrentMember();
    const member = memberData?.data?.member;

    if (!member) {
      console.warn("⚠️ Brak zalogowanego użytkownika.");
      return;
    }

    let completedLessons = {};
    try {
      completedLessons = JSON.parse(member.customFields.completedLessons || "{}");
    } catch (e) {
      console.warn("❌ Błędny JSON w completedLessons");
    }

    if (!completedLessons[playlistSlug]) {
      completedLessons[playlistSlug] = [];
    }

    // Podświetl ukończone lekcje
    completedLessons[playlistSlug].forEach(slug => {
      const el = document.querySelector(`[data-lesson-slug="${slug}"] .dash-lesson--complete-mark`);
      if (el) el.classList.add("is-complete");
    });

    // Obsługa checkboxa
    document.querySelectorAll(".dash-lesson--complete-mark").forEach(mark => {
      mark.addEventListener("click", async function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

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

        await window.$memberstackDom.updateMember({
          customFields: {
            completedLessons: JSON.stringify(completedLessons),
          },
        });

        console.log("✅ Zapisano postęp:", completedLessons);
      });
    });

    // Obsługa przycisku NEXT
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

          await window.$memberstackDom.updateMember({
            customFields: {
              completedLessons: JSON.stringify(completedLessons),
            },
          });

          console.log("✅ Zapisano (Next):", completedLessons);
        }

        // Przejście do następnej lekcji
        const lessonLinks = Array.from(document.querySelectorAll("[data-lesson-slug]"))
          .filter(el => el.closest("[data-playlist-slug]")?.getAttribute("data-playlist-slug") === playlistSlug);

        const slugs = lessonLinks.map(link => link.getAttribute("data-lesson-slug"));
        const currentIndex = slugs.indexOf(slug);

        if (currentIndex < slugs.length - 1) {
          const nextSlug = slugs[currentIndex + 1];
          window.location.href = `/lessons/${nextSlug}?playlist=${playlistSlug}`;
        } else {
          console.log("✅ Ostatnia lekcja – brak kolejnej.");
        }
      });
    }

    // Prev/Next przy załadowaniu strony
    const currentSlug = window.location.pathname.split("/").pop().split("?")[0];

    const lessonLinks = Array.from(document.querySelectorAll("[data-lesson-slug]"))
      .filter(el => el.closest("[data-playlist-slug]")?.getAttribute("data-playlist-slug") === playlistSlug);

    const slugs = lessonLinks.map(link => link.getAttribute("data-lesson-slug"));
    const currentIndex = slugs.indexOf(currentSlug);

    const prevBtn = document.getElementById("prevLessonBtn");
    const nextBtnStatic = document.getElementById("nextLessonBtn");

    if (prevBtn && currentIndex > 0) {
      const prevSlug = slugs[currentIndex - 1];
      prevBtn.href = `/lessons/${prevSlug}?playlist=${playlistSlug}`;
    } else if (prevBtn) {
      prevBtn.style.display = "none";
    }

    if (nextBtnStatic && currentIndex < slugs.length - 1) {
      const nextSlug = slugs[currentIndex + 1];
      nextBtnStatic.href = `/lessons/${nextSlug}?playlist=${playlistSlug}`;
    } else if (nextBtnStatic) {
      nextBtnStatic.href = "#";
      const btnText = nextBtnStatic.querySelector(".btn--text");
      if (btnText) btnText.textContent = "Complete";
    }
  });
});
