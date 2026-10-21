document.addEventListener('DOMContentLoaded', () => {
(function () {
    const CURRENT_VERSION = '0.1.5-beta';
    const STORAGE_KEY = 'changelog_seen_version';
    const overlay = document.getElementById('changes-overlay');

    if (!overlay) return;

    try {
        const seenVersion = localStorage.getItem(STORAGE_KEY);
        if (seenVersion === CURRENT_VERSION) {
            overlay.classList.remove('show');
        } else {
            overlay.classList.add('show');
        }
    } catch (e) {}     
    // ^^^ if the stored seen version equals CURRENT_VERSION, hide the overlay (the user already saw it and decided to close it.)
    // Otherwise show it. If no value exists (first run) we show the overlay. we also localStorage errors as "error handling".  -awdev1 11/04/2024
    const closeBtn = overlay.querySelector('.close-svg');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            try { localStorage.setItem(STORAGE_KEY, CURRENT_VERSION); } catch (e) {}
            overlay.classList.remove('show');
        });
    }// also close the log on escape key for fun

    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && overlay.classList.contains('show')) {
            try { localStorage.setItem(STORAGE_KEY, CURRENT_VERSION); } catch (e) {}
            overlay.classList.remove('show');
        }
    });
})();

});
