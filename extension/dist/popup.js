"use strict";
document.addEventListener("DOMContentLoaded", () => {
    const sessionInput = document.getElementById("sessionId");
    const connectBtn = document.getElementById("connectBtn");
    const statusDiv = document.getElementById("status");
    // Check if already connected
    chrome.runtime.sendMessage({ type: "GET_SESSION" }, (response) => {
        if (response && response.sessionId) {
            statusDiv.textContent = `Connected: ${response.sessionId}`;
            statusDiv.style.color = "green";
        }
    });
    connectBtn.addEventListener("click", () => {
        const sessionId = sessionInput.value.trim();
        if (!sessionId) {
            alert("Please enter a valid Session ID");
            return;
        }
        chrome.runtime.sendMessage({ type: "CONNECT_SESSION", sessionId }, (response) => {
            if (response && response.success) {
                statusDiv.textContent = `Connected: ${sessionId}`;
                statusDiv.style.color = "green";
                sessionInput.value = "";
                alert("Connected successfully. An overlay will appear on the active page.");
            }
        });
    });
});
