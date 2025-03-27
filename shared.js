// Initialize chat when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize chat elements
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const chatIcon = document.getElementById('chatIcon');
    const chatContainer = document.getElementById('chatContainer');
    const closeChat = document.getElementById('closeChat');
    const sendButton = document.getElementById('sendButton');
    
    // Check if all required elements exist
    if (!chatIcon || !chatContainer || !closeChat) {
        console.error("Chat elements not found in the DOM");
        return;
    }

    // Load chat history from sessionStorage
    if (sessionStorage.getItem('chatHistory')) {
        chatMessages.innerHTML = sessionStorage.getItem('chatHistory');
    } else {
        // Initial bot message
        addMessage("Hello! I'm your AI assistant. How can I help you with your research today?", 'bot');
    }
    
    // Toggle chat visibility
    chatIcon.addEventListener('click', function() {
        chatContainer.classList.toggle('open');
    });
    
    closeChat.addEventListener('click', function() {
        chatContainer.classList.remove('open');
    });
    
    // Message sending functionality
    if (userInput && sendButton) {
        // Allow sending message with Enter key or button click
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        sendButton.addEventListener('click', sendMessage);
    }

    async function sendMessage() {
        const input = userInput.value.trim();
        if (!input) return;
        
        // Add user message to chat
        addMessage(input, 'user');
        userInput.value = '';
        
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        try {
            // Check if user is asking to open a website
            if (input.toLowerCase().includes('open') || input.toLowerCase().includes('search for')) {
                const websiteMatch = input.match(/(open|search for)\s+(?:the\s+)?(website\s+)?(?:of\s+)?([a-zA-Z0-9]+)/i);
                if (websiteMatch && websiteMatch[3]) {
                    const site = websiteMatch[3];
                    // Remove typing indicator
                    chatMessages.removeChild(typingIndicator);
                    
                    // Add bot response
                    addMessage(`Opening search results for ${site}...`, 'bot');
                    
                    // Redirect to search results
                    setTimeout(() => {
                        window.location.href = `results.html?q=${encodeURIComponent(site)}`;
                    }, 1000);
                    return;
                }
            }
            
            const response = await fetch(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer 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',
                        'HTTP-Referer': 'https://www.sitename.com',
                        'X-Title': 'SiteName',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'deepseek/deepseek-r1:free',
                        messages: getMessageHistory(),
                    }),
                }
            );
            
            const data = await response.json();
            
            // Remove typing indicator
            chatMessages.removeChild(typingIndicator);
            
            // Add bot response to chat
            const botResponse = data.choices?.[0]?.message?.content || 'I couldn\'t generate a response. Please try again.';
            addMessage(botResponse, 'bot');
        } catch (error) {
            // Remove typing indicator
            chatMessages.removeChild(typingIndicator);
            
            // Show error message
            addMessage('Sorry, I encountered an error. Please try again later.', 'bot');
            console.error('Error:', error);
        }
    }
    
    function addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        // Parse markdown if it's a bot message
        if (sender === 'bot') {
            messageDiv.innerHTML = marked.parse(content);
        } else {
            messageDiv.textContent = content;
        }
        
        // Add timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = getCurrentTime();
        messageDiv.appendChild(timestamp);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Save to sessionStorage
        sessionStorage.setItem('chatHistory', chatMessages.innerHTML);
    }
    
    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    function getMessageHistory() {
        const messages = [];
        const messageElements = chatMessages.querySelectorAll('.message');
        
        messageElements.forEach(el => {
            const role = el.classList.contains('user-message') ? 'user' : 'assistant';
            const content = el.classList.contains('user-message') ? 
                el.textContent.replace(getCurrentTime(), '').trim() : 
                el.innerHTML.replace(/<div class="timestamp">.*?<\/div>/, '').trim();
            
            messages.push({
                role: role,
                content: content
            });
        });
        
        return messages;
    }
});