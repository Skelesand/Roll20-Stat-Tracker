(function() {
    console.log("Roll20 Stat Tracker loaded!");

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {

                if (node.nodeType === 1 && node.classList?.contains('message')) {

                    // Extract player ID from class
                    const playerClass = [...node.classList].find(c => c.startsWith('player--'));
                    const playerId = playerClass ? playerClass.replace('player--', '') : null;

                    // Extract roll result
                    const rollNode = node.querySelector('.rolled');
                    const rollValue = rollNode ? rollNode.textContent.trim() : null;

                    if (rollValue !== null) {
                        console.log(`Player ${playerId} rolled: ${rollValue}`);
                    }
                }
            });
        });
    });

    const messageContainer = document.querySelector('#textchat .content');

    if (messageContainer) {
        observer.observe(messageContainer, {
            childList: true,
            subtree: true
        });
    } else {
        console.log("Message container not found.");
    }
})();