// 🔹 Plyr player setup
$(".plyr_component").each(function () {
  let thisComponent = $(this);

  let player = new Plyr(thisComponent.find(".plyr_video")[0], {
    controls: ["play", "progress", "current-time", "mute", "fullscreen"],
    resetOnEnd: true
  });

  thisComponent.find(".plyr_cover").on("click", function () {
    player.play();
  });

  player.on("ended", () => {
    thisComponent.removeClass("hide-cover");
    if (player.fullscreen.active) {
      player.fullscreen.exit();
    }
  });

  player.on("play", () => {
    $(".plyr_component").removeClass("hide-cover");
    thisComponent.addClass("hide-cover");

    const prevPlaying = $(".plyr--playing").closest(".plyr_component").not(thisComponent);
    if (prevPlaying.length > 0) {
      prevPlaying.find(".plyr_pause-trigger")[0].click();
    }
  });

  thisComponent.find(".plyr_pause-trigger").on("click", () => {
    player.pause();
  });

  player.on("enterfullscreen", () => {
    thisComponent.addClass("contain-video");
  });

  player.on("exitfullscreen", () => {
    thisComponent.removeClass("contain-video");
  });
});


// 🔹 Dropdowns & UI
document.addEventListener("DOMContentLoaded", function () {
  const dropdowns = document.querySelectorAll(".dash-chapter-dropdown");

  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector(".dash-chapter-dropdown-toggle");
    const list = dropdown.querySelector(".dash-chapter-dropdown-list");

    if (toggle && list) {
      toggle.addEventListener("click", () => {
        const isOpen = dropdown.classList.contains("is-open");

        dropdowns.forEach(other => {
          if (other !== dropdown && other.classList.contains("is-open")) {
            const otherList = other.querySelector(".dash-chapter-dropdown-list");
            if (otherList) {
              otherList.style.height = otherList.scrollHeight + "px";
              setTimeout(() => {
                otherList.style.height = "0px";
                other.classList.remove("is-open");
              }, 10);
            }
          }
        });

        if (isOpen) {
          list.style.height = list.scrollHeight + "px";
          setTimeout(() => {
            list.style.height = "0px";
            dropdown.classList.remove("is-open");
          }, 10);
        } else {
          dropdown.classList.add("is-open");
          list.style.height = list.scrollHeight + "px";
          setTimeout(() => {
            list.style.height = "auto";
          }, 300);
        }
      });
    }
  });

  dropdowns.forEach(dropdown => {
    const activeLesson = dropdown.querySelector(".is-active");
    const list = dropdown.querySelector(".dash-chapter-dropdown-list");

    if (activeLesson && list) {
      dropdown.classList.add("is-open");
      list.style.height = "auto";
    }
  });
});


// 🔹 Playlist logic
document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const playlistSlug = urlParams.get("playlist");
  const currentLessonSlug = window.location.pathname.split('/').pop();

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
});


// 🔹 Progress tracking using Memberstack
document.addEventListener("DOMContentLoaded", function () {
  window.addEventListener("memberstack.ready", async function () {
    const memberData = await window.$memberstackDom.getCurrentMember();
    const member = memberData.data?.member;

    if (!member) {
      console.warn("⚠️ Nadal brak użytkownika po memberstack.ready");
      return;
    }

    console.log("✅ Memberstack użytkownik dostępny:", member);

    const urlParams = new URLSearchParams(window.location.search);
    const playlistSlug = urlParams.get("playlist");
    const currentLessonSlug = window.location.pathname.split("/").pop();

    let completedLessons = {};
    try {
      completedLessons = JSON.parse(member.customFields.completedLessons || "{}");
    } catch (e) {
      console.warn("Nieprawidłowy JSON w completedLessons");
    }

    if (!completedLessons[playlistSlug]) {
      completedLessons[playlistSlug] = [];
    }

    // Oznacz jako complete na starcie
    completedLessons[playlistSlug].forEach(slug => {
      const el = document.querySelector(`[data-lesson-slug="${slug}"] .dash-lesson--complete-mark`);
      if (el) el.classList.add("is-complete");
    });

    // Klikanie checkboxa
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

        console.log("ZAPISUJĘ:", JSON.stringify(completedLessons));

        await window.$memberstackDom.updateMember({
          customFields: {
            completedLessons: JSON.stringify(completedLessons)
          }
        });
      });
    });

// Obsługa przycisku "Next"
const nextBtn = document.getElementById("nextLessonBtn");

if (nextBtn) {
  nextBtn.addEventListener("click", async function (e) {
    e.preventDefault(); // ⛔️ zatrzymujemy natychmiastowe przeładowanie strony

    const playlistSlug = new URLSearchParams(window.location.search).get("playlist");
    const currentLesson = document.querySelector(".dash-chapter-lesson.w--current");
    if (!currentLesson) return;

    const slug = currentLesson.getAttribute("data-lesson-slug");
    const mark = currentLesson.querySelector(".dash-lesson--complete-mark");

    if (!slug || !mark) return;

    if (!completedLessons[playlistSlug].includes(slug)) {
      mark.classList.add("is-complete");
      completedLessons[playlistSlug].push(slug);

      console.log("ZAPISUJĘ (z Next):", JSON.stringify(completedLessons));

      await window.$memberstackDom.updateMember({
        customFields: {
          completedLessons: JSON.stringify(completedLessons)
        }
      });
    }

    // teraz przechodzimy do kolejnej lekcji (po zapisie!)
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
