document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    const statusText = document.getElementById("statusText");
    const logPanel = document.getElementById("logPanel");
  
    // Updates the status display.
    function updateStatus(monitoring) {
      statusText.textContent = monitoring ? "Active" : "Inactive";
      console.log("Status updated to:", monitoring ? "Active" : "Inactive");
    }
  
    // Requests and refreshes the current monitoring status.
    function refreshStatus() {
      chrome.runtime.sendMessage({ type: 'GET_MONITORING_STATUS' }, (response) => {
        if (response) {
          updateStatus(response.monitoringActive);
        }
      });
    }
  
    // Requests and refreshes the log panel.
    function refreshLogs() {
      chrome.runtime.sendMessage({ type: 'GET_LOGS' }, (response) => {
        if (response && response.logs) {
          logPanel.innerHTML = "";
          response.logs.forEach((log) => {
            const p = document.createElement("p");
            p.textContent = `[${log.timestamp}] ${log.event}`;
            logPanel.appendChild(p);
          });
        }
      });
    }
  
    // Get the initial monitoring status.
    chrome.runtime.sendMessage({ type: 'GET_MONITORING_STATUS' }, (response) => {
      if (response) updateStatus(response.monitoringActive);
    });
  
    // Start Monitoring button click event.
    startBtn.addEventListener("click", () => {
      console.log("Start button clicked");
      chrome.runtime.sendMessage({ type: 'TOGGLE_MONITORING', value: true }, (response) => {
        if (response) {
          updateStatus(response.monitoringActive);
          // The content script in the background tab will already be working.
          refreshLogs();
        }
      });
    });
  
    // Stop Monitoring button click event.
    stopBtn.addEventListener("click", () => {
      console.log("Stop button clicked");
      chrome.runtime.sendMessage({ type: 'TOGGLE_MONITORING', value: false }, (response) => {
        if (response) {
          updateStatus(response.monitoringActive);
          refreshLogs();
        }
      });
    });
  
    // Refresh status and logs every 2 seconds while the popup is open.
    setInterval(refreshStatus, 2000);
    setInterval(refreshLogs, 2000);
  });
  