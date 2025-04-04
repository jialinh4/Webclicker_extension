// content_script.js

let checkInterval = null;
let lastQuestionText = "";

// Starts polling for poll status.
function startMonitoring() {
  if (!checkInterval) {
    checkInterval = setInterval(checkPollStatus, 3000); // Check every 3 seconds
  }
}

// Stops polling for poll status.
function stopMonitoring() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

// Checks the poll status and selects an answer if a poll is active.
function checkPollStatus() {
  // Adjust these selectors to match the actual webpage elements.
  const statusElement = document.querySelector(".poll-status");
  const questionElement = document.querySelector(".poll-question");

  if (!statusElement) return;
  const statusText = statusElement.textContent.trim();

  // Only act if a poll is active.
  if (statusText.includes("Poll is active")) {
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

// Randomly selects an answer with a heavier weighting on A and B.
function getRandomAnswer() {
  const rand = Math.random();
  if (rand < 0.4) return "A";  // 40% chance
  if (rand < 0.8) return "B";  // 40% chance
  if (rand < 0.85) return "C"; // 5% chance
  if (rand < 0.9) return "D";  // 5% chance
  return "E";                  // 10% chance
}

// Simulates a click on the desired answer option.
function clickOption(answer) {
  // Assumes that options have IDs like "optionA", "optionB", etc.
  const optionId = "option" + answer;
  const option = document.getElementById(optionId);
  if (option) {
    option.click();
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
