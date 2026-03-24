const POPUP_API_URL = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", () => {
    const sessionInput = document.getElementById("sessionId") as HTMLInputElement;
    const connectBtn = document.getElementById("connectBtn") as HTMLButtonElement;
    const stealthBtn = document.getElementById("stealthBtn") as HTMLButtonElement;
    const statusDiv = document.getElementById("status") as HTMLDivElement;
    const hintsPanel = document.getElementById("pm-hints-panel") as HTMLDivElement;
    const hintsContent = document.getElementById("pm-hints-content") as HTMLDivElement;
    
    // Nav elements
    const prevBtn = document.getElementById("pop-prev-btn") as HTMLButtonElement;
    const nextBtn = document.getElementById("pop-next-btn") as HTMLButtonElement;
    const slideText = document.getElementById("pop-slide-text") as HTMLDivElement;

    let isStealthMode = false;
    let hintsInterval: ReturnType<typeof setInterval> | null = null;
    let activeSessionId: string | null = null;
    let currentSlide = 1;
    let totalSlides = 1;

    // Restore existing session
    chrome.runtime.sendMessage({ type: "GET_SESSION" }, (response) => {
        if (response && response.sessionId) {
            activeSessionId = response.sessionId;
            statusDiv.textContent = `Connected: ${response.sessionId}`;
            statusDiv.style.color = "green";
        }
    });

    connectBtn.addEventListener("click", () => {
        const sessionId = sessionInput.value.trim();
        if (!sessionId) {
            statusDiv.textContent = "Please enter a Session ID.";
            statusDiv.style.color = "orange";
            return;
        }
        statusDiv.textContent = "Connecting...";
        statusDiv.style.color = "#555";

        chrome.runtime.sendMessage({ type: "CONNECT_SESSION", sessionId }, (response) => {
            if (response && response.success) {
                activeSessionId = sessionId;
                statusDiv.textContent = `Connected: ${sessionId}`;
                statusDiv.style.color = "green";
                sessionInput.value = "";
            } else {
                activeSessionId = null;
                const errMsg = response?.error || "Invalid session ID";
                statusDiv.textContent = `Failed: ${errMsg}`;
                statusDiv.style.color = "red";
            }
        });
    });

    function updateNavButtons() {
        prevBtn.disabled = currentSlide <= 1;
        nextBtn.disabled = currentSlide >= totalSlides;
        slideText.textContent = `Slide ${currentSlide} of ${totalSlides}`;
    }

    async function changeSlide(direction: number) {
        if (!activeSessionId) return;
        const newSlide = currentSlide + direction;
        if (newSlide < 1 || newSlide > totalSlides) return;
        
        currentSlide = newSlide;
        updateNavButtons();
        
        try {
            await fetch(`${POPUP_API_URL}/sessions/${activeSessionId}/slide?slide_number=${newSlide}`, { method: "POST" });
            fetchAndDisplayHints();
        } catch (e) {
            console.error("Failed to change slide", e);
        }
    }

    prevBtn.addEventListener("click", () => changeSlide(-1));
    nextBtn.addEventListener("click", () => changeSlide(1));

    function fetchAndDisplayHints() {
        chrome.runtime.sendMessage({ type: "FETCH_HINTS_FOR_POPUP" }, (response) => {
            if (!response || response.error) {
                hintsContent.innerHTML = `<p style="color:#94a3b8; font-size:12px;">No active session or could not load hints.</p>`;
                return;
            }
            const data = response.data;

            if (data.slide_number) currentSlide = data.slide_number;
            if (data.total_slides) totalSlides = data.total_slides;
            updateNavButtons();

            if (data.message) {
                hintsContent.innerHTML = `<p style="font-size:13px; color:#475569;">${data.message}</p>`;
                return;
            }
            let html = `<div style="margin-bottom:8px;">
                <p style="font-size:13px; margin:4px 0 0; color:#1e293b; line-height:1.5;">${data.summary}</p>
            </div>`;
            if (data.key_points?.length > 0) {
                html += `<span style="font-size:10px; font-weight:700; text-transform:uppercase; color:#94a3b8; letter-spacing:0.5px;">Key Points</span>
                <ul style="font-size:12px; margin:4px 0 0; padding-left:18px; color:#334155; line-height:1.6;">`;
                data.key_points.forEach((pt: string) => { html += `<li>${pt}</li>`; });
                html += `</ul>`;
            }
            hintsContent.innerHTML = html;
        });
    }

    stealthBtn.addEventListener("click", () => {
        isStealthMode = !isStealthMode;

        if (isStealthMode) {
            stealthBtn.textContent = "Exit Presentation Mode";
            stealthBtn.classList.add("btn-stealth-active");
            stealthBtn.classList.remove("btn-stealth");
            hintsPanel.style.display = "block";
            fetchAndDisplayHints();
            hintsInterval = setInterval(fetchAndDisplayHints, 5000);
        } else {
            stealthBtn.textContent = "Enable Presentation Mode";
            stealthBtn.classList.remove("btn-stealth-active");
            stealthBtn.classList.add("btn-stealth");
            hintsPanel.style.display = "none";
            if (hintsInterval) {
                clearInterval(hintsInterval);
                hintsInterval = null;
            }
        }

        chrome.runtime.sendMessage({ type: "SET_STEALTH_MODE", enabled: isStealthMode });
    });
});
