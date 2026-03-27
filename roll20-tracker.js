// Minimal Roll20 Stat Tracker Test

(function() {
    console.log("Roll20 Stat Tracker loaded!");

    // Listen for new chat messages
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.classList && node.classList.contains('message')) {
                    const playerId = node.getAttribute('data-playerid');
                    const rollResult = node.querySelector('.inlinerollresult');
                    
                    if (rollResult) {
                        const diceResult = rollResult.textContent;
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