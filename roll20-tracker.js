// Minimal Roll20 Stat Tracker Test

(function() {
    console.log("Roll20 Stat Tracker loaded!");

    // Listen for new chat messages
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.classList?.contains('message')) {

                    // Extract player ID from class
                    const playerClass = [...node.classList].find(c => c.startsWith('player--'));
                    const playerId = playerClass ? playerClass.replace('player--', '') : null;

                    // Find roll result
                    const rollResult = node.querySelector('.inlinerollresult');

                    if (rollResult) {
                        const diceResult = rollResult.textContent.trim();
                        console.log(`Player ${playerId} rolled: ${diceResult}`);
                    }
                }
            });
        });
    });
    const chatContainer = document.getElementById('chat');
    if (chatContainer) {
        observer.observe(chatContainer, { childList: true, subtree: true });
    }
})();