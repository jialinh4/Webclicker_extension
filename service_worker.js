let monitoringActive = false;
let logs = [];
let backgroundTabId = null;

// Initialize state from storage when the service worker starts.
chrome.storage.local.get(["monitoringActive", "backgroundTabId"], (data) => {
  monitoringActive = data.monitoringActive || false;
  backgroundTabId = data.backgroundTabId || null;
  if (monitoringActive && backgroundTabId) {
    // Check if the background tab is still open.
    chrome.tabs.get(backgroundTabId, (tab) => {
      if (chrome.runtime.lastError) {
        logs.push({
          event: `Background tab with ID ${backgroundTabId} not found on initialization.`,
          timestamp: new Date().toISOString()
        });
        monitoringActive = false;
        backgroundTabId = null;
        chrome.storage.local.set({ monitoringActive, backgroundTabId });
      }
    });
  }
});

// Listen for messages from the popup or other parts.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'TOGGLE_MONITORING') {
    monitoringActive = request.value;
    logs.push({
      event: `Monitoring ${monitoringActive ? 'started' : 'stopped'}`,
      timestamp: new Date().toISOString()
    });
    chrome.storage.local.set({ monitoringActive });

    if (monitoringActive) {
      // If monitoring is turned on and no background tab exists, create one.
      if (!backgroundTabId) {
        chrome.tabs.create({
          url: "https://webclicker.web.app/student/TBgTHAaueLSwF0xWgVuM",
          active: false
        }, (tab) => {
          backgroundTabId = tab.id;
          logs.push({
            event: `Background tab created with ID ${backgroundTabId}`,
            timestamp: new Date().toISOString()
          });
          chrome.storage.local.set({ backgroundTabId });
          sendResponse({ success: true, monitoringActive });
        });
        return true; // Asynchronous response.
      } else {
        sendResponse({ success: true, monitoringActive });
      }
    } else {
      // When stopping monitoring, remove the background tab if it exists.
      if (backgroundTabId) {
        chrome.tabs.remove(backgroundTabId, () => {
          logs.push({
            event: `Background tab with ID ${backgroundTabId} closed`,
            timestamp: new Date().toISOString()
          });
          backgroundTabId = null;
          chrome.storage.local.set({ backgroundTabId });
          sendResponse({ success: true, monitoringActive });
        });
        return true;
      } else {
        sendResponse({ success: true, monitoringActive });
      }
    }
  } else if (request.type === 'GET_MONITORING_STATUS') {
    sendResponse({ monitoringActive });
  } else if (request.type === 'LOG_EVENT') {
    logs.push({
      event: request.event,
      timestamp: new Date().toISOString()
    });
    sendResponse({ success: true });
  } else if (request.type === 'GET_LOGS') {
    sendResponse({ logs });
  }
});

// Listen for background tab closure (if it is closed unexpectedly).
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabId === backgroundTabId) {
    logs.push({
      event: `Background tab with ID ${backgroundTabId} closed unexpectedly`,
      timestamp: new Date().toISOString()
    });
    backgroundTabId = null;
    monitoringActive = false;
    chrome.storage.local.set({ monitoringActive, backgroundTabId });
  }
});
