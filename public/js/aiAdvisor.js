/**
 * AI FINANCIAL ADVISOR INTERFACE MODULE
 * Handles chat communication with secure backend AI endpoint.
 */

export const AIAdvisorModule = {
  chatHistory: [],
  currentContext: null,

  init() {
    this.bindEvents();
  },

  setContext(context) {
    this.currentContext = context;
  },

  bindEvents() {
    const sendBtn = document.getElementById('ai-send-btn');
    const inputField = document.getElementById('ai-input');
    const presetChips = document.querySelectorAll('.preset-chip');

    if (sendBtn && inputField) {
      sendBtn.addEventListener('click', () => this.handleSendMessage());
      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleSendMessage();
      });
    }

    presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.dataset.prompt || chip.innerText.trim();
        if (inputField) {
          inputField.value = text;
          this.handleSendMessage();
        }
      });
    });
  },

  async handleSendMessage() {
    const inputField = document.getElementById('ai-input');
    const messagesList = document.getElementById('ai-messages-list');
    if (!inputField || !messagesList) return;

    const query = inputField.value.trim();
    if (!query) return;

    // Append User Message
    this.appendMessage('user', query);
    inputField.value = '';

    // Show Typing Indicator
    const typingId = this.appendTypingIndicator();

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          userContext: this.currentContext || {}
        })
      });

      this.removeTypingIndicator(typingId);

      if (response.ok) {
        const data = await response.json();
        this.appendMessage('ai', data.answer);
      } else {
        this.appendMessage('ai', '⚠️ **Notice:** Could not establish connection to the AI Advisor service. Please try again shortly. Your other financial tools remain fully functional.');
      }
    } catch (err) {
      this.removeTypingIndicator(typingId);
      this.appendMessage('ai', '⚠️ **Connection Error:** Unable to reach AI server. Please check your network connection.');
    }
  },

  appendMessage(sender, text) {
    const messagesList = document.getElementById('ai-messages-list');
    if (!messagesList) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;

    if (sender === 'user') {
      bubble.textContent = text;
    } else {
      bubble.innerHTML = this.parseMarkdown(text);
    }

    messagesList.appendChild(bubble);
    messagesList.scrollTop = messagesList.scrollHeight;
  },

  appendTypingIndicator() {
    const messagesList = document.getElementById('ai-messages-list');
    if (!messagesList) return null;

    const typingId = 'typing-' + Date.now();
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ai';
    bubble.id = typingId;
    bubble.innerHTML = `<em>Thinking & analyzing your financial profile...</em>`;

    messagesList.appendChild(bubble);
    messagesList.scrollTop = messagesList.scrollHeight;
    return typingId;
  },

  removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  },

  parseMarkdown(text) {
    if (!text) return '';
    let formatted = text
      .replace(/### (.*?)\n/g, '<h4>$1</h4>')
      .replace(/## (.*?)\n/g, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/> (.*?)\n/g, '<blockquote>$1</blockquote>')
      .replace(/- (.*?)\n/g, '<li>$1</li>')
      .replace(/\n\n/g, '<br/><br/>');

    if (formatted.includes('<li>')) {
      formatted = formatted.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    }

    return formatted;
  }
};
