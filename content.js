console.log('%c🧑‍💻 YT Comments Crawler: Extension loaded.', 'background-color: lightblue;');

// Utility Functions
const Utils = (() => {
  const getVideoId = () => window.location.search.split('v=')[1].split(/[&#]/)[0];
  const getVideoTitle = () => document.title.replace(' - YouTube', '').trim().replace(/[^ \p{L}0-9-_.]/gu, '').replace(/\s+/g, ' ');

  const scrollToBottom = async (desiredComments = 50, maxScrolls = 10) => {
    let lastHeight = 0;
    let attempts = 0;

    // Create a MutationObserver to detect when new comments are loaded
    const observer = new MutationObserver((mutations, observer) => {
      const comments = document.querySelectorAll('#contents #content-text');
      if (comments.length >= desiredComments || attempts >= maxScrolls) {
        observer.disconnect(); // Stop observing when desired comments or max scrolls reached
        return;
      }
    });

    // Start observing the comments section for new comments
    const commentsSection = document.querySelector('ytd-comments');
    if (commentsSection) {
      observer.observe(commentsSection, { childList: true, subtree: true });
    }

    // Scroll to bottom with a limit on attempts
    while (attempts < maxScrolls) {
      window.scrollTo(0, document.documentElement.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newHeight = document.documentElement.scrollHeight;
      if (newHeight === lastHeight) break;
      lastHeight = newHeight;
      attempts++;

      // Check number of comments
      const comments = document.querySelectorAll('#contents #content-text');
      if (comments.length >= desiredComments) break;
    }

    observer.disconnect(); // Ensure observer is disconnected after scrolling
  };

  const getSortableLikes = likes => {
    let multiplier = 1;
    if (likes.endsWith("K")) multiplier = 1000;
    if (likes.endsWith("M")) multiplier = 1000000;
    return parseFloat(likes) * multiplier;
  };

  return { getVideoId, getVideoTitle, scrollToBottom, getSortableLikes };
})();

// Comment Functions
const Comments = (() => {
  const stopWords = new Set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves',
    'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
    'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the',
    'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against',
    'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
    'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
  ]);

  const extractComments = () => {
    const commentElements = document.querySelectorAll('#contents #content-text');
    return Array.from(commentElements).map(commentElement => commentElement.textContent.trim().replace(/\n/g, ' '));
  };

  const generateWordFrequency = comments => {
    const wordCount = {};
    comments.forEach(comment => {
      const words = comment.split(/\s+/);
      words.forEach(word => {
        word = word.toLowerCase();
        if (!stopWords.has(word)) {
          word = word.replace(/[^a-zA-Z0-9-_.]/g, '');
          if (word) {
            wordCount[word] = (wordCount[word] || 0) + 1;
          }
        }
      });
    });
    return Object.entries(wordCount).map(([word, count]) => [word, count]).sort((a, b) => b[1] - a[1]);
  };

  const displayWordCloud = wordFreq => {
    console.log('%c🧑‍💻 YT Comments Crawler: Displaying word cloud.', 'background-color: lightblue;');
    const wordCloudDiv = document.createElement('div');
    wordCloudDiv.id = 'wordCloud';
    wordCloudDiv.style.width = '65vw'; // Use 80% of viewport width
    wordCloudDiv.style.height = '30vw'; // Reduce height for a more compact display
    wordCloudDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    wordCloudDiv.style.position = 'relative';
    wordCloudDiv.style.margin = '-1px auto'; // Center align the div with margin to prevent overlap

    // Adjust positioning to prevent overlap with recommendations
    wordCloudDiv.style.zIndex = '1000';

    const commentsSection = document.querySelector('ytd-comments');
    if (commentsSection) {
      commentsSection.parentNode.insertBefore(wordCloudDiv, commentsSection);
    } else {
      document.body.appendChild(wordCloudDiv);
    }

    const maxCount = Math.max(...wordFreq.map(([word, count]) => count));

    const wordCloudOptions = {
      list: wordFreq,
      gridSize: Math.round(10 * (window.innerWidth / 1024)), // Adjusted gridSize for compactness
      weightFactor: function (size) {
        // return (size / maxCount) * 95; // Adjust weightFactor for compactness
        return Math.log(size + 1) * 20; // Adjust weightFactor to ensure better visibility for frequent words
      },
      fontFamily: 'Arial',
      color: 'random-dark',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      rotateRatio: 0.5,
      rotationSteps: 2,
      shape: 'square', // Use square for compact layout
    };

    if (typeof WordCloud !== 'undefined') {
      WordCloud(wordCloudDiv, wordCloudOptions);
    } else {
      console.error('WordCloud function is not available.');
    }
  };

    const displayTopics = topics => {
        const topicsDiv = document.createElement('div');
        topicsDiv.id = 'topics';
        topicsDiv.style.width = '80vw'; // Use 80% of viewport width
        topicsDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        topicsDiv.style.margin = '20px auto'; // Center align the div with margin to prevent overlap
        topicsDiv.style.padding = '20px';
        topicsDiv.style.border = '1px solid #ccc';
        topicsDiv.style.borderRadius = '8px';
    
        topics.forEach((topic, index) => {
          const topicDiv = document.createElement('div');
          topicDiv.style.marginBottom = '10px';
          topicDiv.innerHTML = `<strong>Topic ${index + 1}:</strong> ${topic.join(', ')}`;
          topicsDiv.appendChild(topicDiv);
        });
    
        const commentsSection = document.querySelector('ytd-comments');
        if (commentsSection) {
          commentsSection.parentNode.insertBefore(topicsDiv, commentsSection);
        } else {
          document.body.appendChild(topicsDiv);
        }
      };


  return { extractComments, generateWordFrequency, displayWordCloud };
})();

// UI Functions
const UI = (() => {
  const createButton = () => {
    const button = document.createElement('button');
    button.setAttribute('id', 'btn-crawl-comments');
    button.innerText = 'WordCloud ⏬';
    button.title = 'Crawl comments';
    styleButton(button);
    document.body.appendChild(button);
    return button;
  };

  const styleButton = button => {
    Object.assign(button.style, {
      position: 'fixed', opacity: 0.7, bottom: '20px', left: '20px', // Adjust position to avoid overlap
      background: 'var(--yt-spec-brand-background-secondary)',
      color: 'var(--yt-spec-icon-active-other)', border: '1px solid var(--yt-spec-brand-background-primary)',
      borderRadius: '2px', padding: '4px 4px', cursor: 'pointer', fontSize: '2em',
      transition: 'background 0.2s ease-in-out', textDecoration: 'none'
    });
  };

  const toggleButtonVisibility = button => {
    if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
      console.log('%c🧑‍💻 YT Comments Crawler: Went full screen, hiding the button.', 'background-color: lightblue;');
      button.hidden = true;
    } else {
      console.log('%c🧑‍💻 YT Comments Crawler: Exited full screen, showing the button.', 'background-color: lightblue;');
      button.hidden = false;
    }
  };

  const addFullscreenListeners = button => {
    ['fullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange', 'webkitfullscreenchange'].forEach(event =>
      document.addEventListener(event, () => toggleButtonVisibility(button), false)
    );
  };

  return { createButton, addFullscreenListeners };
})();

// Main Function
const Main = (() => {
    let currentVideoId = Utils.getVideoId();

    const clearWordCloud = () => {
      const wordCloudDiv = document.getElementById('wordCloud');
      if (wordCloudDiv) {
        wordCloudDiv.remove();
      }
    };
  
    const monitorVideoChange = () => {
      setInterval(() => {
        const newVideoId = Utils.getVideoId();
        if (newVideoId && newVideoId !== currentVideoId) {
          currentVideoId = newVideoId;
          clearWordCloud();
        }
      }, 1000); // Check every second for video change
    };
  
  const handleButtonClick = async button => {
    console.log('%c🧑‍💻 YT Comments Crawler: Button clicked.', 'background-color: lightblue;');
    const videoId = Utils.getVideoId();
    const videoTitle = Utils.getVideoTitle();
    console.log(`%c🧑‍💻 YT Comments Crawler: videoId: ${videoId}`, 'background-color: lightblue;');
    console.log(`%c🧑‍💻 YT Comments Crawler: videoTitle: ${videoTitle}`, 'background-color: lightblue;');

    button.innerText = '⏳';
    button.title = 'Crawling...';

    await Utils.scrollToBottom(50, 4); // Dynamic scroll based on desired comments and max scrolls
    const comments = Comments.extractComments();
    const wordFreq = Comments.generateWordFrequency(comments);
    Comments.displayWordCloud(wordFreq);
     const topics = Comments.extractTopics(comments);
    console.log(topics);
    
    button.innerText = 'Retry 🔃';
    button.title = 'Crawl again';
  };

  const init = () => {
    const button = UI.createButton();
    UI.addFullscreenListeners(button);
    button.addEventListener('click', () => handleButtonClick(button));
    monitorVideoChange(); // Start monitoring video changes

  };

  return { init };
})();

// Initialize the extension
Main.init();
