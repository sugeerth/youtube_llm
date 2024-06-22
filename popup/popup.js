document.getElementById('start').addEventListener('click', () => {
    const videoUrl = document.getElementById('videoUrl').value;
    if (videoUrl) {
      chrome.tabs.create({ url: videoUrl }, (tab) => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      });
    } else {
      alert('Please enter a valid YouTube video URL');
    }
  });
  
  document.getElementById('showWordCloud').addEventListener('click', () => {
    chrome.storage.local.get('comments', data => {
      if (data.comments) {
        const wordFreq = generateWordFrequency(data.comments);
        WordCloud(document.getElementById('wordCloud'), { list: wordFreq });
        document.getElementById('wordCloud').style.display = 'block';
      }
    });
  });
  
  function generateWordFrequency(comments) {
    const wordCount = {};
    comments.forEach(comment => {
      const words = comment.text.split(/\s+/);
      words.forEach(word => {
        word = word.toLowerCase();
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
    });
    return Object.entries(wordCount).sort((a, b) => b[1] - a[1]);
  }
  