// 🔹 Plyr player setup
$(".plyr_component").each(function (index) {
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

// 🔹 Playlist logic + Memberstack progress + Next/Prev

document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const playlistSlug = urlParams.get("playlist");
  const currentLessonSlug = window.location.pathname.split("/").pop().split("?")[0];

  document.querySelectorAll("[data-playlist-slug]").forEach(item => {
    item.style.display = item.getAttribute("data-playlist-slug") === playlistSlug ? "block" : "none";
  });

  document.querySelectorAll("[data-chapter-list] [data-playlist-slug]").forEach(chapter => {
    chapter.style.display = chapter.getAttribute("data-playlist-slug") === playlistSlug ? "block" : "none";
  });

  document.querySelectorAll("[data-lesson-slug]").forEach(link => {
    const lessonSlug = link.getAttribute("data-lesson-slug");
    link.setAttribute("href", `/lessons/${lessonSlug}?playlist=${playlistSlug}`);
    if (lessonSlug === currentLessonSlug) {
      link.classList.add("is-active");
    }
  });

  const playlistMenu = document.querySelector("[playlist-menu]");
  if (!playlistSlug && playlistMenu) {
    playlistMenu.style.display = "none";
  }

  window.addEventListener("memberstack.ready", async function () {
    const memberData = await window.$memberstackDom.getCurrentMember();
    const member = memberData?.data?.member;

    if (!member) {
      console.warn("❌ Brak membera po memberstack.ready");
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

    completedLessons[playlistSlug].forEach(slug => {
      const el = document.querySelector(`[data-lesson-slug="${slug}"] .dash-lesson--complete-mark`);
      if (el) el.classList.add("is-complete");
    });

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
      });
    });

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
        }

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

    const currentSlug = window.location.pathname.split("/").pop().split("?")[0];

    const lessonLinks = Array.from(document.querySelectorAll("[data-lesson-slug]"))
      .filter(el => el.closest("[data-playlist-slug]")?.getAttribute("data-playlist-slug") === playlistSlug);

    const slugs = lessonLinks.map(link => link.getAttribute("data-lesson-slug"));
    const currentIndex = slugs.indexOf(currentSlug);

    const prevBtn = document.querySelector("#prevLessonBtn");
    const nextBtnStatic = document.querySelector("#nextLessonBtn");

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
