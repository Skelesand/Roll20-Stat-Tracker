(function() {
    console.log("Roll20 Stat Tracker loaded!");

    // Tracks the last detected player name to handle messages without the '.by' node
    let lastPlayerName = 'Unknown Player';

    // Structure for storing stats:
    // { playerName: { d20: { total, count, average }, d6: {...}, ... } }
    const playerStats = {};

    // UI panel
    // UI panel
    function createStatsPanel() {
        let panel = document.getElementById('roll20-stats-panel');
        if (!panel) {
            // Outer panel
            panel = document.createElement('div');
            panel.id = 'roll20-stats-panel';
            panel.style.position = 'fixed';
            panel.style.top = '10px';
            panel.style.left = 'calc(100% - 260px)'; // start near the right
            panel.style.width = '250px';
            panel.style.backgroundColor = 'rgba(0,0,0,0.8)';
            panel.style.color = 'white';
            panel.style.fontFamily = 'sans-serif';
            panel.style.fontSize = '14px';
            panel.style.padding = '5px';
            panel.style.borderRadius = '8px';
            panel.style.zIndex = 10000;
            panel.style.right = 'auto';

            // Header (clickable)
            const header = document.createElement('div');
            header.id = 'roll20-stats-header';
            header.textContent = 'Roll Averages ⬇';
            header.style.cursor = 'pointer';
            header.style.fontWeight = 'bold';
            header.style.marginBottom = '5px';
            panel.appendChild(header);

            // Content container (collapsible)
            const content = document.createElement('div');
            content.id = 'roll20-stats-content';
            content.style.maxHeight = '300px';
            content.style.overflowY = 'auto';
            content.style.display = 'block'; // start expanded
            panel.appendChild(content);

            // Click to toggle collapse
            header.addEventListener('click', () => {
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    header.textContent = 'Roll Averages ⬇';
                } else {
                    content.style.display = 'none';
                    header.textContent = 'Roll Averages ➤';
                }
            });

            // Start New Session button
            const newSessionBtn = document.createElement('button');
            newSessionBtn.textContent = 'Start New Session';
            newSessionBtn.style.marginTop = '5px';
            newSessionBtn.style.width = '100%';
            newSessionBtn.style.padding = '4px';
            newSessionBtn.style.fontSize = '13px';
            newSessionBtn.style.cursor = 'pointer';
            newSessionBtn.addEventListener('click', () => {
                // Reset all stats
                for (const player in playerStats) {
                    delete playerStats[player];
                }
                updateStatsPanel(); // refresh the panel
            });
            panel.appendChild(newSessionBtn);

            document.body.appendChild(panel);

            // makes the stats panel draggable
            makePanelDraggable(panel);
        }
        return panel;
    }

    function updateStatsPanel() {
        const panel = createStatsPanel();
        const content = document.getElementById('roll20-stats-content');
        if (!content) return;

        // Build stats HTML
        let html = '';
        for (const player in playerStats) {
            html += `<strong>${player}</strong><br>`;
            const dice = playerStats[player];

            // Convert dice object to array and sort by die size descending
            const sortedDice = Object.keys(dice).sort((a, b) => {
                // Extract numeric part of die, fallback to 0 for unknown
                const numA = parseInt(a.replace('d', ''), 10) || 0;
                const numB = parseInt(b.replace('d', ''), 10) || 0;
                return numB - numA; // largest first
            });

            sortedDice.forEach(die => {
                const stat = dice[die];
                html += `${die}: Avg ${stat.average.toFixed(2)} (Rolled ${stat.count} times)<br>`;
            });

            html += '<hr>';
        }

        content.innerHTML = html;
    }

    // makes the stats panel draggable
    function makePanelDraggable(panel) {
        const header = document.getElementById('roll20-stats-header');
        let offsetX = 0, offsetY = 0, isDragging = false;

        header.style.cursor = 'move'; // show move cursor

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            // Mouse offset inside the panel
            const rect = panel.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            document.body.style.userSelect = 'none'; // prevent text selection while dragging
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panel.style.top = `${e.clientY - offsetY}px`;
            panel.style.left = `${e.clientX - offsetX}px`;
            panel.style.right = 'auto'; // disable right positioning while dragging
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = ''; // restore text selection
        });
    }

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
                        // Update visual stats panel
                        updateStatsPanel();
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