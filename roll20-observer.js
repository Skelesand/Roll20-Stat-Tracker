// Roll20 DOM Observer / Debugger

(function () {
    console.log("Roll20 DOM Observer loaded");

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    console.log("NODE ADDED:", node);
                }
            });
        });
    });

    // Ensure the body exists before observing
    function startObserver() {
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            console.log("Observer attached to document.body");
        } else {
            setTimeout(startObserver, 100);
        }
    }

    startObserver();
})();