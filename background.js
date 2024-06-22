chrome.runtime.onInstalled.addListener(() => {
  console.log('%c🧑‍💻 YT Comments Crawler: Extension installed.', 'background-color: lightblue;');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'commentsReady') {
    chrome.action.openPopup();
  }
});
