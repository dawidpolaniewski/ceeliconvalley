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
(async function () {
  const memberData = await window.$memberstackDom.getCurrentMember();
  const member = memberData.data?.member;

  if (!member) {
    console.warn("Brak zalogowanego użytkownika – Memberstack");
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const playlistSlug = urlParams.get("playlist");
  const currentLessonSlug = window.location.pathname.split("/").pop();

  // Przygotuj obiekt progressu
  let completedLessons = {};
  try {
    completedLessons = JSON.parse(member.customFields.completedLessons || "{}");
  } catch (e) {
    console.warn("Nieprawidłowy JSON w completedLessons");
  }

  // Upewnij się, że jest lista dla playlisty
  if (!completedLessons[playlistSlug]) {
    completedLessons[playlistSlug] = [];
  }

  // 🔹 Oznacz lekcje jako ukończone na wejściu
  completedLessons[playlistSlug].forEach(slug => {
    const el = document.querySelector(`[data-lesson-slug="${slug}"] .dash-lesson--complete-mark`);
    if (el) el.classList.add("is-complete");
  });

  // 🔹 Obsługa kliknięcia w checkbox
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

  // 🔹 Obsługa przycisku "Next"
  const nextBtn = document.getElementById("nextLessonBtn");

  if (nextBtn) {
    nextBtn.addEventListener("click", async function () {
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
    });
  }
})();
