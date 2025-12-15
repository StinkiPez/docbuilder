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
        const closeButton = document.querySelector('.header-close-button');
        
        // Toggle header visibility
        if (viewName === 'login') {
            closeButton.classList.remove('hidden');
            backButton.classList.add('hidden');
            document.querySelector('.header-logo').classList.add('hidden');
            userText.classList.add('hidden');
        } else {
            console.log('Showing header elements');
            closeButton.classList.add('hidden');
            backButton.classList.remove('no-transition');
            backButton.classList.remove('hidden');
            document.querySelector('.header-logo').classList.remove('no-transition');
            document.querySelector('.header-logo').classList.remove('hidden');
            userText.classList.remove('no-transition');
            userText.classList.remove('hidden');
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

            userSelect.addEventListener('change', () => {
                userSelect.setCustomValidity('');
            });

            userSelect.addEventListener('invalid', () => {
                if (!userSelect.value) {
                    userSelect.setCustomValidity('Select a user to continue.');
                }
            });

            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (!userSelect.value) {
                    // Optionally show a custom message or highlight the field
                    userSelect.focus();
                    return;
                }
                if (userSelect.value) {
                    currentUser = userSelect.value;
                    userText.textContent = `Welcome, ${currentUser}!`;
                    
                    const loginContainer = document.querySelector('.login-container');
                    loginContainer.classList.add('slide-out-left');
                    loginContainer.addEventListener('animationend', () => {
                        loadView('dashboard');
                    }, { once: true });
                }
            });
        }
    }

    function goBack() {
        if (viewHistory.length > 0) {
            const previousView = viewHistory.pop();
            
            const currentContainer = appContainer.firstElementChild;
            if (currentContainer) {
                currentContainer.classList.add('slide-out-right');
                currentContainer.addEventListener('animationend', (e) => {
                    if (e.animationName === 'slideRightFadeOut') {
                        loadView(previousView, false);
                    }
                }, { once: true });
            } else {
                loadView(previousView, false);
            }
        }
    }

    backButton.addEventListener('click', goBack);
    document.querySelector('.header-close-button').addEventListener('click', () => {
        window.close();
    });
    // Load initial view
    loadView('login');
});