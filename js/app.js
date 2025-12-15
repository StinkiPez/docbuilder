document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    const header = document.querySelector('.app-header');
    const userText = document.querySelector('.header-user-text');
    const backButton = document.querySelector('.header-back-button');
    
    let currentUser = null;
    let currentView = null;
    let viewHistory = [];

    async function loadView(viewName, addToHistory = true) {
        if (addToHistory && currentView) {
            viewHistory.push(currentView);
        }
        const response = await fetch(`./views/${viewName}.html`);
        const html = await response.text();
        
        // Toggle header visibility
        if (viewName === 'login') {
            header.style.display = 'none';
        } else {
            header.style.display = 'flex';
        }
        
        appContainer.innerHTML = html;
        currentView = viewName;
        
        // Re-attach event listeners for the new view
        initViewListeners(viewName);
    }

    function initViewListeners(viewName) {
        if (viewName === 'login') {
            const loginForm = document.querySelector('.login-form');
            const userSelect = document.querySelector('.login-form select');
            
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (userSelect.value) {
                    currentUser = userSelect.value;
                    userText.textContent = `Welcome, ${currentUser}!`;
                    loadView('dashboard');
                }
            });
        }
    }

    function goBack() {
        if (viewHistory.length > 0) {
            const previousView = viewHistory.pop();
            loadView(previousView, false); // false = don't add to history
        }
    }

    backButton.addEventListener('click', goBack);

    // Load initial view
    loadView('login');
});