// Roll20 Stat Tracker - Minimal Version
// Tracks average d20 rolls per player using DOM observation

(function () {
  console.log("Roll20 Stat Tracker Loaded");

  // Store stats per player
  const playerStats = {};
  const processedMessages = new Set();

  // Utility: safely initialize player
  function getPlayer(id) {
    if (!playerStats[id]) {
      playerStats[id] = {
        rolls: [],
        average: 0,
      };
    }
    return playerStats[id];
  }

  // Extract player ID (best effort)
  function getPlayerId(messageNode) {
    // Roll20 usually includes a data-playerid somewhere in message structure
    const playerEl =
      messageNode.closest("[data-playerid]") ||
      messageNode.querySelector("[data-playerid]");

    if (playerEl) {
      return playerEl.getAttribute("data-playerid");
    }

    // Fallback: use displayed name (less reliable)
    const nameEl = messageNode.querySelector(".by");
    if (nameEl) {
      return nameEl.textContent.trim();
    }

    return "unknown_player";
  }

  // Extract d20 rolls from message text
  function extractD20Rolls(messageNode) {
    const text = messageNode.innerText;

    // Match common d20 outputs like:
    // "Rolling 1d20: 15"
    // "1d20 → 12"
    // "d20 (18)"
    const matches = text.match(/\b(?:1d20|d20)[^\d]*(\d{1,2})\b/gi);

    if (!matches) return [];

    const results = [];

    matches.forEach((match) => {
      const numMatch = match.match(/(\d{1,2})/);
      if (numMatch) {
        const value = parseInt(numMatch[1], 10);
        if (value >= 1 && value <= 20) {
          results.push(value);
        }
      }
    });

    return results;
  }

  // Process a single message
  function processMessage(messageNode) {
    if (!messageNode || processedMessages.has(messageNode)) return;
    processedMessages.add(messageNode);

    const rolls = extractD20Rolls(messageNode);
    if (rolls.length === 0) return;

    const playerId = getPlayerId(messageNode);
    const player = getPlayer(playerId);

    rolls.forEach((roll) => {
      player.rolls.push(roll);
    });

    // Update average
    const sum = player.rolls.reduce((a, b) => a + b, 0);
    player.average = sum / player.rolls.length;

    console.log(
      `[Roll20 Tracker] Player: ${playerId} | Rolls: ${player.rolls.length} | Avg: ${player.average.toFixed(
        2
      )}`
    );
  }

  // Observe chat container
  function observeChat() {
    const chatContainer = document.querySelector("#textchat");

    if (!chatContainer) {
      console.warn("Roll20 Tracker: Chat container not found, retrying...");
      setTimeout(observeChat, 2000);
      return;
    }

    console.log("Roll20 Tracker: Chat observer attached");

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;

          // Roll20 messages usually have class "message"
          if (node.classList.contains("message")) {
            processMessage(node);
          }

          // Also check nested messages (sometimes wrapped)
          node.querySelectorAll?.(".message").forEach(processMessage);
        });
      });
    });

    observer.observe(chatContainer, {
      childList: true,
      subtree: true,
    });
  }

  // Start observing after slight delay (Roll20 loads dynamically)
  setTimeout(observeChat, 2000);
})();