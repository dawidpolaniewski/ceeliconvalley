<script src="https://cdn.plyr.io/3.7.2/plyr.js"></script>
<script>
$(".plyr_component").each(function (index) {
  let thisComponent = $(this);

  // create plyr settings
  let player = new Plyr(thisComponent.find(".plyr_video")[0], {
    controls: ["play", "progress", "current-time", "mute", "fullscreen"],
    resetOnEnd: true
  });
  
  // custom video cover
  thisComponent.find(".plyr_cover").on("click", function () {
    player.play();
  });
  player.on("ended", (event) => {
    thisComponent.removeClass("hide-cover");
  });

  // pause other playing videos when this one starts playing
  player.on("play", (event) => {
		$(".plyr_component").removeClass("hide-cover");
    thisComponent.addClass("hide-cover");
    let prevPlayingComponent = $(".plyr--playing").closest(".plyr_component").not(thisComponent);
    if (prevPlayingComponent.length > 0) {
      prevPlayingComponent.find(".plyr_pause-trigger")[0].click();
    }
  });
  thisComponent.find(".plyr_pause-trigger").on("click", function () {
    player.pause();
  });

  // exit full screen when video ends
  player.on("ended", (event) => {
    if (player.fullscreen.active) {
      player.fullscreen.exit();
    }
  });
  // set video to contain instead of cover when in full screen mode
  player.on("enterfullscreen", (event) => {
    thisComponent.addClass("contain-video");
  });
  player.on("exitfullscreen", (event) => {
    thisComponent.removeClass("contain-video");
  });
});
</script>

<script>
document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const playlistSlug = urlParams.get("playlist");
  const currentLessonSlug = window.location.pathname.split('/').pop();

  // 1. Pokazanie tylko odpowiedniej playlisty (np. tytułu)
  document.querySelectorAll('[data-playlist-slug]').forEach(item => {
    item.style.display = "none";
    if (item.getAttribute("data-playlist-slug") === playlistSlug) {
      item.style.display = "block";
    }
  });

  // 2. Pokazanie tylko chapterów pasujących do playlisty
  document.querySelectorAll('[data-chapter-list] [data-playlist-slug]').forEach(chapter => {
    chapter.style.display = "none";
    if (chapter.getAttribute("data-playlist-slug") === playlistSlug) {
      chapter.style.display = "block";
    }
  });

  // 3. Uzupełnianie href w linkach lekcji o playlistę (gdy link = "/lessons/{{wf {&quot;path&quot;:&quot;slug&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}")
  document.querySelectorAll('[data-lesson-slug]').forEach(link => {
    const lessonSlug = link.getAttribute('data-lesson-slug');
    link.setAttribute('href', `/lessons/${lessonSlug}?playlist=${playlistSlug}`);
  });

  // 4. Podświetlenie aktywnej lekcji
  document.querySelectorAll('[data-lesson-slug]').forEach(link => {
    const lessonSlug = link.getAttribute('data-lesson-slug');
    if (lessonSlug === currentLessonSlug) {
      link.classList.add('is-active'); // dodaj klasę np. z tłem lub boldem
    }
  });
});
</script>

<script>
document.addEventListener("DOMContentLoaded", function () {
  const playlistMenu = document.querySelector('[playlist-menu]');
  const urlParams = new URLSearchParams(window.location.search);
  const playlistSlug = urlParams.get("playlist");

  if (!playlistSlug && playlistMenu) {
    playlistMenu.style.display = "none";
  }
});
</script>

<script>
document.addEventListener("DOMContentLoaded", function () {
  const dropdowns = document.querySelectorAll(".dash-chapter-dropdown");

  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector(".dash-chapter-dropdown-toggle");
    const list = dropdown.querySelector(".dash-chapter-dropdown-list");

    if (toggle && list) {
      toggle.addEventListener("click", () => {
        const isOpen = dropdown.classList.contains("is-open");

        // Zamknij wszystkie inne
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
          // Zamknij aktualnie kliknięty
          list.style.height = list.scrollHeight + "px";
          setTimeout(() => {
            list.style.height = "0px";
            dropdown.classList.remove("is-open");
          }, 10);
        } else {
          // Otwórz aktualnie kliknięty
          dropdown.classList.add("is-open");
          const fullHeight = list.scrollHeight + "px";
          list.style.height = fullHeight;

          // Reset na auto po animacji
          setTimeout(() => {
            list.style.height = "auto";
          }, 300);
        }
      });
    }
  });

  // Otwórz automatycznie jeśli ma aktywną lekcję
  dropdowns.forEach(dropdown => {
    const activeLesson = dropdown.querySelector(".is-active");
    const list = dropdown.querySelector(".dash-chapter-dropdown-list");

    if (activeLesson && list) {
      dropdown.classList.add("is-open");
      list.style.height = "auto";
    }
  });
});
</script>

<script>
document.addEventListener("DOMContentLoaded", function () {
  const playlistSlug = new URLSearchParams(window.location.search).get("playlist");

  // Przechowuj jako: completed_lessons_{playlist}
  const storageKey = `completed_lessons_${playlistSlug}`;
  let completedLessons = JSON.parse(localStorage.getItem(storageKey)) || [];

  // Zaznacz lekcje jako ukonczone przy wczytaniu strony
  completedLessons.forEach(slug => {
    const el = document.querySelector(`[data-lesson-slug="${slug}"] .dash-lesson--complete-mark`);
    if (el) el.classList.add("is-complete");
  });

  // Klikanie checkboxa
  document.querySelectorAll(".dash-lesson--complete-mark").forEach(mark => {
    mark.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const lessonLink = mark.closest("[data-lesson-slug]");
      if (!lessonLink) return;

      const slug = lessonLink.getAttribute("data-lesson-slug");

      if (mark.classList.contains("is-complete")) {
        mark.classList.remove("is-complete");
        completedLessons = completedLessons.filter(s => s !== slug);
      } else {
        mark.classList.add("is-complete");
        completedLessons.push(slug);
      }

      localStorage.setItem(storageKey, JSON.stringify(completedLessons));
    });
  });
});
</script>

<script>
document.addEventListener("DOMContentLoaded", function () {
  const nextBtn = document.getElementById("nextLessonBtn");

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      const playlistSlug = new URLSearchParams(window.location.search).get("playlist");
      const storageKey = `completed_lessons_${playlistSlug}`;
      let completedLessons = JSON.parse(localStorage.getItem(storageKey)) || [];

      const currentLesson = document.querySelector(".dash-chapter-lesson.w--current");
      if (!currentLesson) return;

      const slug = currentLesson.getAttribute("data-lesson-slug");
      const mark = currentLesson.querySelector(".dash-lesson--complete-mark");

      if (!slug || !mark) return;

      // Dodaj jako ukończoną, jeśli jeszcze nie ma
      if (!completedLessons.includes(slug)) {
        mark.classList.add("is-complete");
        completedLessons.push(slug);
        localStorage.setItem(storageKey, JSON.stringify(completedLessons));
      }
    });
  }
});
</script>

<script>
document.addEventListener("DOMContentLoaded", function () {
  const currentSlug = window.location.pathname.split("/").pop().split("?")[0];
  const playlistSlug = new URLSearchParams(window.location.search).get("playlist");

  // Zbierz wszystkie linki do lekcji w obecnym menu kursu
  const lessonLinks = Array.from(document.querySelectorAll('[data-lesson-slug]'))
    .filter(el => el.closest('[data-playlist-slug]')?.getAttribute('data-playlist-slug') === playlistSlug);

  // Zbuduj listę slugów
  const slugs = lessonLinks.map(link => link.getAttribute('data-lesson-slug'));
  const currentIndex = slugs.indexOf(currentSlug);

  // Znajdź przyciski
  const prevBtn = document.querySelector("#prevLessonBtn");
  const nextBtn = document.querySelector("#nextLessonBtn");

  // Obsługa Previous
  if (prevBtn && currentIndex > 0) {
    const prevSlug = slugs[currentIndex - 1];
    prevBtn.href = `/lessons/${prevSlug}?playlist=${playlistSlug}`;
  } else if (prevBtn) {
    prevBtn.style.display = "none"; // ukryj jeśli brak poprzedniej
  }

  // Obsługa Next
  if (nextBtn && currentIndex < slugs.length - 1) {
    const nextSlug = slugs[currentIndex + 1];
    nextBtn.href = `/lessons/${nextSlug}?playlist=${playlistSlug}`;
  } else if (nextBtn) {
    // ✅ TO SIĘ DZIEJE NA OSTATNIEJ LEKCJI
    nextBtn.href = "#"; // nie przechodzimy dalej
    const btnText = nextBtn.querySelector(".btn--text");
    if (btnText) btnText.textContent = "Complete";
  }
});
</script>
