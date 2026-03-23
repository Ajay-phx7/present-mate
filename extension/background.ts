chrome.runtime.onInstalled.addListener(() => {
    console.log("PresentMate Extension Installed.");
});

// A simple dictionary to emulate an active session
let bgSessionId: string | null = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CONNECT_SESSION") {
        bgSessionId = message.sessionId;
        console.log("Connected to Session:", bgSessionId);
        // Relay to content script to show overlay
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, { type: "SHOW_OVERLAY", sessionId: bgSessionId });
            }
        });
        sendResponse({ success: true });
    } else if (message.type === "GET_SESSION") {
        sendResponse({ sessionId: bgSessionId });
    }
});
