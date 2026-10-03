document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("siteNav");
  const navLinks = document.querySelectorAll(".nav-link");
  const input = document.getElementById("copilotInput");
  const send = document.getElementById("copilotSend");
  const userMessage = document.getElementById("userMessage");
  const aiMessage = document.getElementById("aiMessage");
  const suggestionButtons = document.querySelectorAll(".suggestions button");
  const careerButton = document.getElementById("careerButton");

  // Add a subtle navbar shadow after scrolling.
  const updateNav = () => {
    nav.classList.toggle("scrolled", window.scrollY > 20);
  };
  updateNav();
  window.addEventListener("scroll", updateNav);

  // Close mobile navigation after clicking a link.
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const menu = document.getElementById("mainNav");
      if (menu.classList.contains("show") && window.bootstrap) {
        bootstrap.Collapse.getOrCreateInstance(menu).hide();
      }
    });
  });

  const answerFor = (question) => {
    const q = question.toLowerCase();

    if (q.includes("skill")) {
      return "Naïm combines UX/UI, Product Design, Design Systems, AI-driven product work, Low-Code and Product Operations.";
    }
    if (q.includes("project")) {
      return "Relevant work includes WINNI, Assestini, Naïm Copilot, Career OS, and UX/UI work across Saudi government, banking and regulatory sectors.";
    }
    if (q.includes("ai") || q.includes("tool")) {
      return "His current AI stack includes n8n, AI agents, RAG, MCP, Google AI Studio, Claude and AI-assisted product workflows.";
    }
    if (q.includes("available") || q.includes("project")) {
      return "For collaboration, use the Let's Talk button below. The public site can later connect this flow to Naïm's real n8n agent.";
    }
    if (q.includes("why")) {
      return "His approach combines product thinking, UX/UI design and hands-on AI/Low-Code building, allowing ideas to move from concept toward a working product.";
    }
    return "I can answer questions about Naïm's experience, skills, projects, AI work and career direction. This portfolio UI is ready to connect to the real n8n Copilot.";
  };

  const ask = (question) => {
    const clean = question.trim();
    if (!clean) return;
    userMessage.textContent = clean;
    aiMessage.textContent = "Thinking…";
    window.setTimeout(() => {
      aiMessage.textContent = answerFor(clean);
    }, 350);
    input.value = "";
  };

  send.addEventListener("click", () => ask(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") ask(input.value);
  });
  suggestionButtons.forEach((btn) => {
    btn.addEventListener("click", () => ask(btn.dataset.question));
  });

  careerButton.addEventListener("click", () => {
    const toastEl = document.getElementById("careerToast");
    if (window.bootstrap && toastEl) {
      bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 4500 }).show();
    }
  });
});

/* =========================================
   CUSTOM VOICE WAVE PLAYER
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const player = document.getElementById("voicePlayer");
  const audio = document.getElementById("voiceAudio");
  const playBtn = document.getElementById("voicePlay");
  const playIcon = playBtn?.querySelector("i");
  const wave = document.getElementById("voiceWave");
  const timeDisplay = document.getElementById("voiceTime");

  if (!player || !audio || !playBtn || !wave) return;

  // Give every bar a different height
  const heights = [
    12, 22, 15, 29, 19, 11, 25, 17, 31, 20, 14, 27, 18, 23, 12, 30, 17, 25, 14,
    21, 29, 16, 12, 26, 19, 31, 15, 23, 18, 28, 13, 20, 30, 17, 25, 12, 22, 16,
    29, 19, 14, 27, 18, 24, 11, 30, 16, 22, 13, 26, 18, 29,
  ];

  wave.querySelectorAll("span").forEach((bar, index) => {
    bar.style.setProperty("--h", `${heights[index] || 18}px`);
    bar.style.setProperty("--i", index);
  });

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:15";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${mins}:${secs}`;
  }

  function updatePlayer() {
    const remaining = Math.max(0, (audio.duration || 0) - audio.currentTime);

    timeDisplay.textContent = formatTime(remaining);

    if (audio.ended) {
      player.classList.remove("is-playing");

      playIcon.className = "bi bi-play-fill";

      timeDisplay.textContent = formatTime(audio.duration);
    }
  }

  playBtn.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await audio.play();

        player.classList.add("is-playing");
        playIcon.className = "bi bi-pause-fill";
      } catch (error) {
        console.error("Audio playback failed:", error);
      }
    } else {
      audio.pause();

      player.classList.remove("is-playing");
      playIcon.className = "bi bi-play-fill";
    }
  });

  audio.addEventListener("timeupdate", updatePlayer);

  audio.addEventListener("loadedmetadata", () => {
    timeDisplay.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("ended", () => {
    player.classList.remove("is-playing");
    playIcon.className = "bi bi-play-fill";
  });

  // Click waveform to seek
  wave.addEventListener("click", (event) => {
    if (!audio.duration) return;

    const rect = wave.getBoundingClientRect();
    const position = (event.clientX - rect.left) / rect.width;

    audio.currentTime = position * audio.duration;
  });
});
