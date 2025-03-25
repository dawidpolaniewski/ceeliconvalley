// 🔹 Playlist logic + progress tracking + Next/Prev nav
document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const playlistSlug = urlParams.get("playlist");
  const currentLessonSlug = window.location.pathname.split('/').pop();

  // 🔹 Ukrywanie/pokazywanie elementów zależnie od playlisty
  document.querySelectorAll('[data-playlist-slug]').forEach(item => {
    item.style.display = "none";
    if (item.getAttribute("data-playlist-slug") === playlistSlug) {
      item.style.display = "block";
    }
  });

  document.querySelectorAll('[data-chapter-list] [data-playlist-slug]').forEach(chapter => {
    chapter.style.display = "none";
    if (chapter.getAttribute("data-playlist-slug") === playlistSlug) {
      chapter.style.display = "block";
    }
  });

  document.querySelectorAll('[data-lesson-slug]').forEach(link => {
    const lessonSlug = link.getAttribute('data-lesson-slug');
    link.setAttribute('href', `/lessons/${lessonSlug}?playlist=${playlistSlug}`);
  });

  document.querySelectorAll('[data-lesson-slug]').forEach(link => {
    const lessonSlug = link.getAttribute('data-lesson-slug');
    if (lessonSlug === currentLessonSlug) {
      link.classList.add('is-active');
    }
  });

  const playlistMenu = document.querySelector('[playlist-menu]');
  if (!playlistSlug && playlistMenu) {
    playlistMenu.style.display = "none";
  }

  // 🔹 Memberstack progress tracking
  window.addEventListener("memberstack.ready", async function () {
    const memberData = await window.$memberstackDom.getCurrentMember();
    const member = memberData.data?.member;

    if (!member) {
      console.warn("⚠️ Nadal brak użytkownika po memberstack.ready");
      return;
    }

    console.log("✅ Memberstack użytkownik dostępny:", member);

    let completedLessons = {};
    try {
      completedLessons = JSON.parse(member.customFields.completedLessons || "{}");
    } catch (e) {
      console.warn("Nieprawidłowy JSON w completedLessons");
    }

    if (!completedLessons[playlistSlug]) {
      completedLessons[playlistSlug] = [];
    }

    // 🔹 Oznacz jako complete na starcie
    completedLessons[playlistSlug].forEach(slug => {
      const el = document.querySelector(`[data-lesson-slug="${slug}"] .dash-lesson--complete-mark`);
      if (el) el.classList.add("is-complete");
    });

    // 🔹 Klikanie checkboxa
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

        console.log("💾 ZAPISUJĘ:", JSON.stringify(completedLessons));

        await window.$memberstackDom.updateMember({
          customFields: {
            completedLessons: JSON.stringify(completedLessons)
          }
        });
      });
    });

    // 🔹 Obsługa przycisku NEXT
    const nextBtn = document.getElementById("nextLessonBtn");

    if (nextBtn) {
      nextBtn.addEventListener("click", async function (e) {
        e.preventDefault(); // Zatrzymujemy przejście zanim zapis się zakończy

        const currentLesson = document.querySelector(".dash-chapter-lesson.w--current");
        if (!currentLesson) return;

        const slug = currentLesson.getAttribute("data-lesson-slug");
        const mark = currentLesson.querySelector(".dash-lesson--complete-mark");

        if (!slug || !mark) return;

        if (!completedLessons[playlistSlug].includes(slug)) {
          mark.classList.add("is-complete");
          completedLessons[playlistSlug].push(slug);

          console.log("💾 ZAPISUJĘ (z Next):", JSON.stringify(completedLessons));

          await window.$memberstackDom.updateMember({
            customFields: {
              completedLessons: JSON.stringify(completedLessons)
            }
          });
        }

        // 🔁 przejście do kolejnej lekcji (po zapisie!)
        const lessonLinks = Array.from(document.querySelectorAll('[data-lesson-slug]'))
          .filter(el => el.closest('[data-playlist-slug]')?.getAttribute('data-playlist-slug') === playlistSlug);

        const slugs = lessonLinks.map(link => link.getAttribute('data-lesson-slug'));
        const currentIndex = slugs.indexOf(slug);

        if (currentIndex < slugs.length - 1) {
          const nextSlug = slugs[currentIndex + 1];
          window.location.href = `/lessons/${nextSlug}?playlist=${playlistSlug}`;
        } else {
          console.log("✅ Ostatnia lekcja – brak kolejnej.");
        }
      });
    }

    // 🔹 Obsługa Prev/Next przy ładowaniu strony
    const currentSlug = window.location.pathname.split("/").pop().split("?")[0];
    const lessonLinks = Array.from(document.querySelectorAll('[data-lesson-slug]'))
      .filter(el => el.closest('[data-playlist-slug]')?.getAttribute('data-playlist-slug') === playlistSlug);

    const slugs = lessonLinks.map(link => link.getAttribute('data-lesson-slug'));
    const currentIndex = slugs.indexOf(currentSlug);

    const prevBtn = document.querySelector("#prevLessonBtn");
    const nextBtn2 = document.querySelector("#nextLessonBtn");

    if (prevBtn && currentIndex > 0) {
      const prevSlug = slugs[currentIndex - 1];
      prevBtn.href = `/lessons/${prevSlug}?playlist=${playlistSlug}`;
    } else if (prevBtn) {
      prevBtn.style.display = "none";
    }

    if (nextBtn2 && currentIndex < slugs.length - 1) {
      const nextSlug = slugs[currentIndex + 1];
      nextBtn2.href = `/lessons/${nextSlug}?playlist=${playlistSlug}`;
    } else if (nextBtn2) {
      nextBtn2.href = "#";
      const btnText = nextBtn2.querySelector(".btn--text");
      if (btnText) btnText.textContent = "Complete";
    }
  });
});
