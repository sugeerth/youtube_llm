function getComments() {
  let comments = [];
  document.querySelectorAll('#content-text').forEach(comment => {
    comments.push(comment.innerText);
  });
  return comments;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getComments") {
    const comments = getComments();
    sendResponse({ comments: comments });
  }
});
