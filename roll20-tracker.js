(function() {
    console.log("Roll20 Stat Tracker loaded!");

    let lastPlayerName = 'Unknown Player';
    const playerStats = {}; // { playerName: { total: 0, count: 0, average: 0 } }

    // Extract all rolls from a message node (chat or sheet)
    const extractRollsFromNode = (node) => {
        const rolls = [];

        // Normal chat rolls
        node.querySelectorAll('.rolled').forEach(rn => {
            const value = parseInt(rn.textContent.trim(), 10);
            if (!isNaN(value)) rolls.push(value);
        });

        // Character sheet rolls
        node.querySelectorAll('.inlinerollresult .basicdiceroll').forEach(rn => {
            const value = parseInt(rn.textContent.trim(), 10);
            if (!isNaN(value)) rolls.push(value);
        });

        // Fallback: hidden rolls in title attribute
        node.querySelectorAll('.inlinerollresult').forEach(rn => {
            const match = rn.title?.match(/>(\d+)<\/span>/);
            if (match) {
                const value = parseInt(match[1], 10);
                if (!isNaN(value)) rolls.push(value);
            }
        });

        return rolls;
    };

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.classList?.contains('message')) {

                    // Determine player name
                    const nameNode = node.querySelector('.by');
                    const playerName = nameNode ? nameNode.textContent.trim() : lastPlayerName;
                    lastPlayerName = playerName;

                    // Get all rolls in this message
                    const rolls = extractRollsFromNode(node);

                    // Update stats for every individual roll
                    rolls.forEach(rollValue => {
                        if (!playerStats[playerName]) {
                            playerStats[playerName] = { total: 0, count: 0, average: 0 };
                        }
                        const stats = playerStats[playerName];
                        stats.total += rollValue;
                        stats.count += 1;
                        stats.average = stats.total / stats.count;

                        console.log(`Player ${playerName} rolled: ${rollValue} | Average: ${stats.average.toFixed(2)}`);
                    });
                }
            });
        });
    });

    const messageContainer = document.querySelector('#textchat .content');
    if (messageContainer) {
        observer.observe(messageContainer, { childList: true, subtree: true });
        console.log("Roll20 Stat Tracker observing chat messages...");
    } else {
        console.log("Message container not found.");
    }
})();