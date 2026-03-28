(function() {
    console.log("Roll20 Stat Tracker loaded!");

    // Tracks the last detected player name to handle messages without the '.by' node
    let lastPlayerName = 'Unknown Player';

    // Structure for storing stats:
    // { playerName: { d20: { total, count, average }, d6: {...}, ... } }
    const playerStats = {};

    /**
     * Extracts all individual dice rolls from a message node.
     * Handles normal chat rolls, character sheet rolls, and fallback totals.
     *
     * @param {HTMLElement} node - The DOM node representing a chat message.
     * @returns {Array<{value: number, dieSize: string}>} - Array of roll objects.
     */
    const extractRollsFromNode = (node) => {
        const rolls = [];

        // Manual / Typed Rolls
        node.querySelectorAll('.rolled').forEach(rn => {
            const value = parseInt(rn.textContent.trim(), 10);
            if (!isNaN(value)) {
                const dieSize = detectDieSize(rn);
                rolls.push({ value, dieSize });
            }
        });

        // Check the title attribute of inline roll
        node.querySelectorAll('.inlinerollresult').forEach(rn => {
            const match = rn.title?.match(/>(\d+)<\/span>/);
            if (match) {
                const value = parseInt(match[1], 10);
                if (!isNaN(value)) {
                    const dieSize = detectDieSize(rn);
                    rolls.push({ value, dieSize });
                }
            }
        });

        return rolls;
    };

    /**
     * Detect the die size from a roll node.
     *
     * @param {HTMLElement} rn - The node containing the roll.
     * @returns {string} - Die size string (e.g., "d20") or "d?" if unknown.
     */
    const detectDieSize = (rn) => {
        // Use the inline roll formula if available, for character sheet macro
        if (rn.title) {
            const match = rn.title.match(/\d*d(\d+)/i); // Matches patterns like 1d20, d6, etc.
            if (match) return `d${match[1]}`; // Normalized to "d6", "d20", etc.
        }

        // manual chat rolls
        const msgText = rn.closest('.message')?.textContent || '';
        const chatMatch = msgText.match(/\d*d(\d+)/i);
        if (chatMatch) return `d${chatMatch[1]}`;

        // default unknown die
        return 'd?';
    };

    /**
     * updates player statistics whenever new messages are added
     * Each roll is tracked separately, with averages computed per player and per die type.
     */
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.classList?.contains('message')) {

                    // find the player's name, if none, reuse the last known name.
                    const nameNode = node.querySelector('.by');
                    const playerName = nameNode ? nameNode.textContent.trim() : lastPlayerName;
                    lastPlayerName = playerName;

                    // extract all rolls from this message
                    const rolls = extractRollsFromNode(node);

                    // Initialize player stats if not yet present
                    if (!playerStats[playerName]) playerStats[playerName] = {};

                    // Update stats for each individual roll
                    rolls.forEach(({ value: rollValue, dieSize }) => {
                        const stats = playerStats[playerName];
                        if (!stats[dieSize]) {
                            stats[dieSize] = { total: 0, count: 0, average: 0 };
                        }

                        const dieStats = stats[dieSize];
                        dieStats.total += rollValue;
                        dieStats.count += 1;
                        dieStats.average = dieStats.total / dieStats.count;

                        // Log individual rolls with running average
                        console.log(`Player ${playerName} rolled: ${rollValue} (${dieSize}) | Average: ${dieStats.average.toFixed(2)}`);
                    });
                }
            });
        });
    });

    // Observe the chat container for new messages
    const messageContainer = document.querySelector('#textchat .content');
    if (messageContainer) {
        observer.observe(messageContainer, { childList: true, subtree: true });
        console.log("Roll20 Stat Tracker observing chat messages...");
    } else {
        console.log("Message container not found.");
    }
})();