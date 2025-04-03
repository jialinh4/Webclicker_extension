let checkInterval = null;
let lastQuestionText = "";

chrome.runtime.sendMessage({ type: 'GET_MONITORING_STATUS' }, (response) => {
  if (response.monitoringActive) startMonitoring();
});

function startMonitoring() {
  if (!checkInterval) {
    checkInterval = setInterval(checkPollStatus, 3000);
  }
}

function stopMonitoring() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

function checkPollStatus() {
  // Adjust these selectors to match the actual webpage elements.
  const statusElement = document.querySelector(".poll-status");
  const questionElement = document.querySelector(".poll-question");

  if (!statusElement) return;
  const statusText = statusElement.textContent.trim();

  if (statusText.includes("No current poll")) {
    // No active poll.
    return;
  } else if (statusText.includes("Poll is active")) {
    const questionText = questionElement ? questionElement.textContent.trim() : "Unknown question";
    const selectedAnswer = getRandomAnswer();
    clickOption(selectedAnswer);
    console.log("Question:", questionText, "Selected:", selectedAnswer);
    lastQuestionText = questionText;
    
    // Log the event to the background.
    chrome.runtime.sendMessage({ 
      type: 'LOG_EVENT', 
      event: `Poll answered: "${questionText}" with option ${selectedAnswer}` 
    });
  }
}

function getRandomAnswer() {
  const rand = Math.random();
  if (rand < 0.4) return "A";
  if (rand < 0.8) return "B";
  if (rand < 0.85) return "C";
  if (rand < 0.9) return "D";
  return "E";
}

function clickOption(answer) {
  // Assuming radio buttons have IDs like "optionA", "optionB", etc.
  const optionId = "option" + answer;
  const option = document.getElementById(optionId);
  if (option) {
    option.click();
    // If there is a submit button, simulate its click.
    const submitBtn = document.querySelector(".poll-submit");
    if (submitBtn) submitBtn.click();
  }
}

// Listen for messages from the popup to start/stop monitoring.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'START_MONITORING') {
    startMonitoring();
    sendResponse({ success: true });
  } else if (request.type === 'STOP_MONITORING') {
    stopMonitoring();
    sendResponse({ success: true });
  }
});
