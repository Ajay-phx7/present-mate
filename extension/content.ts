const API_URL = "http://localhost:8000";
let activeSessionId: string | null = null;
let overlayDiv: HTMLDivElement | null = null;
let pollingInterval: number | null = null;

function createOverlay() {
    if (overlayDiv) return;
    
    overlayDiv = document.createElement("div");
    overlayDiv.id = "presentmate-overlay";
    overlayDiv.style.position = "fixed";
    overlayDiv.style.bottom = "20px";
    overlayDiv.style.right = "20px";
    overlayDiv.style.width = "400px";
    overlayDiv.style.backgroundColor = "rgba(15, 23, 42, 0.95)";
    overlayDiv.style.color = "white";
    overlayDiv.style.padding = "20px";
    overlayDiv.style.borderRadius = "12px";
    overlayDiv.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.5)";
    overlayDiv.style.fontFamily = "system-ui, sans-serif";
    overlayDiv.style.zIndex = "999999";
    overlayDiv.style.border = "1px solid rgba(255, 255, 255, 0.2)";
    
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.marginBottom = "12px";
    header.style.borderBottom = "1px solid rgba(255, 255, 255, 0.1)";
    header.style.paddingBottom = "8px";
    
    header.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight: bold; font-size: 14px; color: #60a5fa;">🎯 PresentMate</span>
            <button id="pm-mic-btn" style="background:#3b82f6; border:none; border-radius:4px; padding:4px 8px; color:white; font-size:11px; cursor:pointer;">🎤 Listen</button>
        </div>
        <button id="close-pm-overlay" style="background:none; border:none; color:white; cursor:pointer;" aria-label="Close">✖</button>
    `;
    
    const content = document.createElement("div");
    content.id = "pm-content";
    content.innerHTML = `<p style="font-size: 13px; color: #cbd5e1;">Loading live hints for current slide...</p>`;
    
    const qaContent = document.createElement("div");
    qaContent.id = "pm-qa-content";
    qaContent.style.marginTop = "12px";
    qaContent.style.borderTop = "1px solid rgba(255, 255, 255, 0.1)";
    qaContent.style.paddingTop = "8px";
    qaContent.innerHTML = `<div id="pm-mic-status" style="font-size: 11px; color: #94a3b8; font-style: italic;">Mic off. Click Listen to capture audience questions.</div>`;

    overlayDiv.appendChild(header);
    overlayDiv.appendChild(content);
    overlayDiv.appendChild(qaContent);
    document.body.appendChild(overlayDiv);
    
    document.getElementById("close-pm-overlay")?.addEventListener("click", () => {
        if (overlayDiv) {
            overlayDiv.remove();
            overlayDiv = null;
        }
    });
}

async function fetchCurrentSlideHints() {
    if (!activeSessionId || !overlayDiv) return;
    
    try {
        const res = await fetch(`${API_URL}/sessions/${activeSessionId}/hints/current-slide`);
        const data = await res.json();
        
        const contentDiv = document.getElementById("pm-content");
        if (contentDiv) {
            if (data.message) {
                contentDiv.innerHTML = `<p style="font-size: 13px; color: #cbd5e1;">${data.message}</p>`;
            } else {
                let html = `<div style="margin-bottom: 10px;">
                    <strong style="color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Slide ${data.slide_number} Summary</strong>
                    <p style="font-size: 14px; margin: 4px 0 0 0;">${data.summary}</p>
                </div>`;
                
                if (data.key_points && data.key_points.length > 0) {
                    html += `<div>
                        <strong style="color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Key Points</strong>
                        <ul style="font-size: 13px; margin: 4px 0 0 0; padding-left: 20px; line-height: 1.5;">`;
                    data.key_points.forEach((pt: string) => {
                        html += `<li>${pt}</li>`;
                    });
                    html += `</ul></div>`;
                }
                
                contentDiv.innerHTML = html;
            }
        }
        
    } catch (err) {
        console.error("Failed to fetch hints:", err);
    }
}

let recognition: any = null;
let isListening = false;

function toggleListening() {
    if (!("webkitSpeechRecognition" in window)) {
        alert("Speech recognition is not supported in this browser.");
        return;
    }

    const micBtn = document.getElementById("pm-mic-btn");
    const micStatus = document.getElementById("pm-mic-status");

    if (isListening && recognition) {
        recognition.stop();
        isListening = false;
        if (micBtn) micBtn.style.background = "#3b82f6";
        if (micBtn) micBtn.textContent = "🎤 Listen";
        if (micStatus) micStatus.innerHTML = "Mic off.";
        return;
    }

    // @ts-ignore
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false; // send chunks per sentence/pause
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
        isListening = true;
        if (micBtn) micBtn.style.background = "#ef4444";
        if (micBtn) micBtn.textContent = "🛑 Stop";
        if (micStatus) micStatus.innerHTML = "Listening to audience...";
    };

    recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (micStatus) micStatus.innerHTML = `<i>Heard: "${transcript}"</i><br/><span style="color:#60a5fa;">Thinking...</span>`;
        
        // Send to backend
        try {
            const res = await fetch(`${API_URL}/sessions/${bgSessionId}/question`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ questionText: transcript })
            });
            const data = await res.json();
            
            if (data.hint && data.hint.answer_hint) {
                let qaHtml = `<strong style="color: #fbbf24; font-size: 13px;">Q: ${transcript}</strong>`;
                qaHtml += `<p style="font-size: 14px; margin: 4px 0;">${data.hint.answer_hint}</p>`;
                if (data.hint.talking_points?.length > 0) {
                    qaHtml += `<ul style="font-size: 13px; margin: 4px 0 0 0; padding-left: 20px;">`;
                    data.hint.talking_points.forEach((tp: string) => {
                        qaHtml += `<li>${tp}</li>`;
                    });
                    qaHtml += `</ul>`;
                }
                if (micStatus) micStatus.innerHTML = qaHtml;
            } else {
                if (micStatus) micStatus.innerHTML = "No clear hint generated.";
            }

        } catch (err) {
            console.error(err);
            if (micStatus) micStatus.innerHTML = "Error fetching answer hint.";
        }
    };

    recognition.onerror = (event: any) => {
        console.error("Speech error:", event.error);
        isListening = false;
        if (micBtn) micBtn.style.background = "#3b82f6";
        if (micBtn) micBtn.textContent = "🎤 Listen";
        if (micStatus) micStatus.innerHTML = `Error: ${event.error}`;
    };

    recognition.onend = () => {
        // Automatically restart if we want continuous, but for manual control we stop.
        isListening = false;
        if (micBtn) micBtn.style.background = "#3b82f6";
        if (micBtn) micBtn.textContent = "🎤 Listen";
    };

    recognition.start();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SHOW_OVERLAY") {
        activeSessionId = message.sessionId;
        createOverlay();
        fetchCurrentSlideHints();
        
        document.getElementById("pm-mic-btn")?.addEventListener("click", toggleListening);
        
        if (pollingInterval) clearInterval(pollingInterval);
        pollingInterval = window.setInterval(fetchCurrentSlideHints, 5000);
    }
});
