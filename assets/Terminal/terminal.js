/**
 * Dual-Mode Portfolio Terminal
 * A lightweight, extensible JavaScript terminal emulator
 */

// Global variables for security lockout
let loginAttempts = 0;

class OutputRenderer {
    constructor(outputElement) {
        this.outputElement = outputElement;
    }

    print(text, className = 'output') {
        const div = document.createElement('div');
        div.className = className;
        div.innerHTML = text;
        this.outputElement.appendChild(div);
        this.scrollToBottom();
    }

    printCommand(command) {
        const prompt = document.getElementById('prompt');
        const promptText = prompt.textContent;
        const div = document.createElement('div');
        div.className = 'command';
        div.innerHTML = `<span class="prompt">${promptText}</span> ${this.escapeHtml(command)}`;
        this.outputElement.appendChild(div);
    }

    printLink(url, text) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    }

    scrollToBottom() {
        const terminalBody = document.querySelector('.terminal-body');
        const terminalOutput = document.getElementById('output');
        
        // Use requestAnimationFrame for smoother scrolling on all devices
        requestAnimationFrame(() => {
            // Scroll both elements to ensure proper scrolling
            if (terminalBody) {
                terminalBody.scrollTop = terminalBody.scrollHeight;
            }
            if (terminalOutput) {
                terminalOutput.scrollTop = terminalOutput.scrollHeight;
            }
        });
    }

    clear() {
        this.outputElement.innerHTML = '';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    createTable(headers, rows) {
        let table = '<table class="output-table"><thead><tr>';
        headers.forEach(header => {
            table += `<th>${header}</th>`;
        });
        table += '</tr></thead><tbody>';
        rows.forEach(row => {
            table += '<tr>';
            row.forEach(cell => {
                table += `<td>${cell}</td>`;
            });
            table += '</tr>';
        });
        table += '</tbody></table>';
        return table;
    }
}

class InputParser {
    parse(input) {
        const trimmed = input.trim();
        if (!trimmed) return { command: '', args: [], flags: [] };

        const parts = trimmed.split(/\s+/);
        const command = parts[0].toLowerCase();
        const args = [];
        const flags = [];

        for (let i = 1; i < parts.length; i++) {
            if (parts[i].startsWith('--')) {
                flags.push(parts[i]);
            } else if (parts[i].startsWith('-')) {
                flags.push(parts[i]);
            } else {
                args.push(parts[i]);
            }
        }

        return { command, args, flags };
    }
}

class CryptoUtils {
    static async hashSHA256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    static CORRECT_HASH = '766228e38deba63da769a322db5f4ff19dc00367e14432dc8028f52148aee192';
}

class CommandRegistry {
    constructor(renderer, state, terminal) {
        this.renderer = renderer;
        this.state = state;
        this.terminal = terminal;
        this.commands = new Map();
        this.registerDefaultCommands();
    }

    register(name, handler, options = {}) {
        this.commands.set(name, { handler, ...options });
    }

    execute(command, args, flags) {
        const cmd = this.commands.get(command);
        
        if (!cmd) {
            this.renderer.print(`Command not found: ${command}. Type 'help' for available commands.`, 'error');
            return;
        }

        if (cmd.admin && !this.state.isAuthorized) {
            this.renderer.print(`Admin command. Use 'sudo login' to access admin mode.`, 'warning');
            return;
        }

        try {
            cmd.handler(args, flags, this);
        } catch (error) {
            this.renderer.print(`Error executing command: ${error.message}`, 'error');
        }
    }

    registerDefaultCommands() {
        // Help Command
        this.register('help', (args, flags, registry) => {
            const isAdmin = this.state.isAuthorized;
            let helpText = '<strong>Available Commands:</strong><br><br>';
            
            const publicCommands = [
                ['help', 'Display this help message'],
                ['about', 'Learn about me'],
                ['projects', 'View my projects'],
                ['socials', 'Find me on social media'],
                ['ls', 'List directory contents'],
                ['clear', 'Clear the terminal'],
                ['sudo login', 'Admin login (password required)'],
                ['logout', 'Logout from admin mode']
            ];

            const adminCommands = [
                ['status --bot', 'View bot status'],
                ['notes --view', 'View personal tasks'],
                ['bot --stats', 'View bot statistics'],
                ['edit --bio', 'Edit your bio'],
                ['sys --logs', 'View system logs'],
                ['network --logs', 'View network logs']
            ];

            publicCommands.forEach(([cmd, desc]) => {
                helpText += `<span class="help-command">${cmd}</span> - ${desc}<br>`;
            });

            if (isAdmin) {
                helpText += '<br><strong>Admin Commands:</strong><br><br>';
                adminCommands.forEach(([cmd, desc]) => {
                    helpText += `<span class="help-command" style="color:#ff3333">${cmd}</span> - ${desc}<br>`;
                });
            }

            this.renderer.print(helpText);
        }, { admin: false });

        // About Command
        this.register('about', (args, flags, registry) => {
            const aboutText = `
<strong>L0neW0lf</strong> - Full Stack Developer
<br><br>
Hi, I'm Mohamed 👋

Full-stack developer...in the making.  
I like building fast, reliable things people actually enjoy using, and benefiting from.

Currently exploring: [Ai's / personal project e.g. "Paper_Trading_Bot", "This Terminal we are in", "Flipper Zero"].

Tech I enjoy working with lately:
• [Python + Visual studio code]
• [Flipper zero / For *ethical* daily use]

Find me:
• [mohameddodda.github.io]
<br><br>
Type <strong>projects</strong> to see my work or <strong>socials</strong> to connect with me!
            `;
            this.renderer.print(aboutText);
        }, { admin: false });

        // Projects Command
        this.register('projects', (args, flags, registry) => {
            const projects = [
                ['Portfolio Terminal', 'A JS terminal emulator', 'https://mohameddodda.github.io'],
                ['Paper Trading Bot', 'AI-powered trading bot', 'https://github.com/mohameddodda/paper_trading_bot']
            ];
            
            let projectText = '<strong>My Projects:</strong><br><br>';
            projects.forEach(([name, desc, url]) => {
                projectText += `• <strong>${name}</strong><br>`;
                projectText += `  ${desc}<br>`;
                projectText += `  ${this.renderer.printLink(url, 'View Project')}<br><br>`;
            });
            
            this.renderer.print(projectText);
        }, { admin: false });

        // Socials Command
        this.register('socials', (args, flags, registry) => {
            const socials = [
                ['Personal', 'https://mohameddodda.github.io'],
                ['Instagram', 'https://instagram.com/mohameddodda_']
            ];

            let socialText = '<strong>Connect with me:</strong><br><br>';
            socials.forEach(([platform, url]) => {
                socialText += `• ${platform}: ${this.renderer.printLink(url, url)}<br>`;
            });

            this.renderer.print(socialText);
        }, { admin: false });

        // LS Command
        this.register('ls', (args, flags, registry) => {
            const items = [
                ['about.txt', 'Learn about me'],
                ['projects/', 'What I work on, In my free time'],
                ['socials.txt', 'Contact info'],
                ['secret/', 'Admin only area']
            ];

            let output = '';
            items.forEach(([name, desc]) => {
                if (name.startsWith('secret/') && !this.state.isAuthorized) {
                    // Don't show secret folder to non-admin
                } else {
                    const icon = name.endsWith('/') ? '📁' : '📄';
                    output += `${icon} ${name}  `;
                }
            });

            if (!output.trim()) {
                output = ' (empty)';
            }

            this.renderer.print(output);
        }, { admin: false });

        // Clear Command
        this.register('clear', (args, flags, registry) => {
            this.renderer.clear();
        }, { admin: false });

        // Logout Command
        this.register('logout', (args, flags, registry) => {
            if (!this.state.isAuthorized) {
                this.renderer.print('You are not logged in.', 'warning');
                return;
            }
            
            this.state.isAuthorized = false;
            // Clear authorization state from sessionStorage
            sessionStorage.removeItem('terminal_isAuthorized');
            this.updatePrompt(false);
            this.renderer.print('Logged out successfully.', 'info');
        }, { admin: false });

        // Sudo Login Command
        this.register('sudo', (args, flags, registry) => {
            if (args.length === 0 || args[0] !== 'login') {
                this.renderer.print('Usage: sudo login', 'warning');
                return;
            }

            if (this.state.isAuthorized) {
                this.renderer.print('Already logged in as admin!', 'info');
                return;
            }

            this.renderer.print('Enter password:', 'info');
            
            // Set input mode to prevent command processing
            this.terminal.setInputMode(true, '');
            
            // Change input to password mode
            const input = document.getElementById('command-input');
            input.type = 'password';
            input.classList.add('password-input');
            input.value = '';
            input.focus();

            const handlePassword = async (e) => {
                if (e.key === 'Enter') {
                    const password = input.value;
                    input.type = 'text';
                    input.classList.remove('password-input');
                    
                    const hash = await CryptoUtils.hashSHA256(password);
                    
                    if (hash === CryptoUtils.CORRECT_HASH) {
                        this.state.isAuthorized = true;
                        // Reset login attempts on successful login
                        loginAttempts = 0;
                        // Save authorization state to sessionStorage
                        sessionStorage.setItem('terminal_isAuthorized', 'true');
                        this.updatePrompt(true);
                        this.renderer.print('✓ Access granted! Welcome, Admin.', 'success');
                        this.renderer.print('Admin commands are now available.', 'info');
                    } else {
                        // Increment failed login attempts
                        loginAttempts++;
                        this.renderer.print(`✗ Access denied. Incorrect password. (Attempt ${loginAttempts}/3)`, 'error');
                        
                        // Check if we've hit the lockout threshold
                        if (loginAttempts >= 3) {
                            this.terminal.lockdown();
                        }
                    }
                    
                    input.value = '';
                    // Reset input mode to allow normal command processing
                    this.terminal.setInputMode(false, '');
                    input.removeEventListener('keydown', handlePassword);
                }
            };

            input.addEventListener('keydown', handlePassword);
        }, { admin: false });

        // Bot Stats Command (Admin)
        this.register('bot', (args, flags, registry) => {
            if (args.length === 0 || args[0] !== '--stats') {
                this.renderer.print('Usage: bot --stats', 'warning');
                return;
            }

            const stats = [
                ['Uptime', '99.9%'],
                ['Total Commands', '1,234'],
                ['Active Users', '567'],
                ['Server Load', '12%']
            ];

            const headers = ['Metric', 'Value'];
            const rows = stats;
            
            this.renderer.print('<strong>Bot Statistics:</strong><br>');
            this.renderer.print(this.renderer.createTable(headers, rows));
        }, { admin: true });

        // Edit Bio Command (Admin)
        this.register('edit', (args, flags, registry) => {
            if (args.length === 0 || args[0] !== '--bio') {
                this.renderer.print('Usage: edit --bio', 'warning');
                return;
            }

            this.renderer.print('Enter new bio (press Enter to save):', 'info');
            
            // Set input mode to prevent command processing
            this.terminal.setInputMode(true, '');
            
            const input = document.getElementById('command-input');
            input.value = '';
            input.focus();

            const handleBio = (e) => {
                if (e.key === 'Enter') {
                    const newBio = input.value.trim();
                    if (newBio) {
                        this.renderer.print('✓ Bio updated: "' + newBio + '"', 'success');
                    } else {
                        this.renderer.print('Bio unchanged.', 'warning');
                    }
                    // Reset input mode
                    this.terminal.setInputMode(false, '');
                    input.removeEventListener('keydown', handleBio);
                }
            };

            input.addEventListener('keydown', handleBio);
        }, { admin: true });

        // Sys Logs Command (Admin)
        this.register('sys', (args, flags, registry) => {
            if (args.length === 0 || args[0] !== '--logs') {
                this.renderer.print('Usage: sys --logs', 'warning');
                return;
            }

            const logs = [
                ['2024-01-15 10:30:45', 'System started'],
                ['2024-01-15 10:31:00', 'User connected'],
                ['2024-01-15 10:32:15', 'Command executed: help'],
                ['2024-01-15 10:33:00', 'Admin login successful']
            ];

            const headers = ['Timestamp', 'Event'];
            const rows = logs;

            this.renderer.print('<strong>System Logs:</strong><br>');
            this.renderer.print(this.renderer.createTable(headers, rows));
        }, { admin: true });

        // Network Logs Command (Admin)
        this.register('network', (args, flags, registry) => {
            if (args.length === 0 || args[0] !== '--logs') {
                this.renderer.print('Usage: network --logs', 'warning');
                return;
            }

            const logs = [
                ['192.168.1.1', 'HTTP/200', 'GET /api/projects'],
                ['192.168.1.45', 'HTTP/200', 'GET /api/socials'],
                ['10.0.0.23', 'HTTP/304', 'GET /api/about'],
                ['192.168.1.100', 'WebSocket', 'Connected']
            ];

            const headers = ['Source IP', 'Status', 'Request'];
            const rows = logs;

            this.renderer.print('<strong>Network Logs:</strong><br>');
            this.renderer.print(this.renderer.createTable(headers, rows));
        }, { admin: true });

        // Status Bot Command (Admin Only - Personal Dashboard)
        this.register('status', (args, flags, registry) => {
            if (args.length === 0 || args[0] !== '--bot') {
                this.renderer.print('Usage: status --bot', 'warning');
                return;
            }

            this.renderer.print('[L0neW0lf Bot v1.0]: Online | Strategy: Arbitrage | Uptime: 48h', 'success');
        }, { admin: true });

        // Notes View Command (Admin Only - Personal Dashboard)
        this.register('notes', (args, flags, registry) => {
            if (args.length === 0 || args[0] !== '--view') {
                this.renderer.print('Usage: notes --view', 'warning');
                return;
            }

            const notes = [
                '1. Updateand upgrade site' ,
                '2. Update creative portfolio',
                '3. Review paper trading bot codebase',
                '4. Relax and think'
            ];

            let notesText = '<strong>My Tasks:</strong><br><br>';
            notes.forEach(note => {
                notesText += `• ${note}<br>`;
            });

            this.renderer.print(notesText);
        }, { admin: true });
    }

    updatePrompt(isAdmin) {
        const prompt = document.getElementById('prompt');
        if (isAdmin) {
            prompt.textContent = 'root@L0neW0lf:#';
            prompt.classList.add('admin');
        } else {
            prompt.textContent = 'guest@L0neW0lf:~$';
            prompt.classList.remove('admin');
        }
    }
}

class Terminal {
    constructor() {
        this.outputElement = document.getElementById('output');
        this.inputElement = document.getElementById('command-input');
        
        // Check sessionStorage for previously authorized state
        const savedAuth = sessionStorage.getItem('terminal_isAuthorized');
        const wasAuthorized = savedAuth === 'true';
        
        this.state = {
            isAuthorized: wasAuthorized,
            isWaitingForInput: false,  // Flag to prevent command processing during password/bio input
            isLocked: false  // Flag to indicate terminal is locked due to security lockout
        };

        this.renderer = new OutputRenderer(this.outputElement);
        this.parser = new InputParser();
        this.commandRegistry = new CommandRegistry(this.renderer, this.state, this);
        
        this.commandHistory = [];
        this.historyIndex = -1;

        this.init(wasAuthorized);
    }

    init(wasAuthorized = false) {
        // Start boot sequence
        this.boot(wasAuthorized);
    }

    // Boot sequence - displays system messages with typewriter effect
    boot(wasAuthorized = false) {
        const bootMessages = [
            { text: 'booting up...Fingers crossed.', delay: 1500 },
            { text: 'Loading kernel...Please don\'t crash, Please don\'t crash...', delay: 2500 },
            { text: 'Initializing system... Waking up the hamster on the wheel.', delay: 1800 },
            { text: 'Establishing connection...', delay: 1800 },
            { text: 'Hello, world? Nah, hello chaos! ', delay: 1300, isFinal: true }
        ];

        let messageIndex = 0;
        const self = this;

        function showNextMessage() {
            if (messageIndex >= bootMessages.length) {
                // Boot sequence complete - show welcome and init
                self.printWelcome();
                self.bindEvents();
                
                if (wasAuthorized) {
                    self.commandRegistry.updatePrompt(true);
                }
                return;
            }

            const msg = bootMessages[messageIndex];
            const className = msg.isFinal ? 'boot-success' : 'boot-message';
            
            // Use renderer to print the boot message
            self.renderer.print(msg.text, className);
            
            messageIndex++;
            
            setTimeout(showNextMessage, msg.delay);
        }

        // Start the boot sequence
        showNextMessage();
    }

    setInputMode(isWaiting, value = '') {
        this.state.isWaitingForInput = isWaiting;
        this.inputElement.value = value;
        if (isWaiting) {
            this.inputElement.focus();
        }
    }

    // Security Lockout - Disable terminal after 3 failed login attempts
    lockdown() {
        // Remove the input element from DOM
        const inputLine = document.querySelector('.terminal-input-line');
        if (inputLine && this.inputElement) {
            inputLine.removeChild(this.inputElement);
        }

        // Change prompt to [SYSTEM LOCKED]
        const prompt = document.getElementById('prompt');
        if (prompt) {
            prompt.textContent = '[SYSTEM LOCKED]';
            prompt.classList.remove('admin');
        }

        // Display red error message
        this.renderer.print('', 'output');
        this.renderer.print('═══════════════════════════════════════════════════════════', 'error');
        this.renderer.print('CRITICAL: Unauthorized access attempt recorded. Terminal interface disabled.', 'error');
        this.renderer.print('═══════════════════════════════════════════════════════════', 'error');
        this.renderer.print('', 'output');

        // Add glitch effect to terminal container
        const terminalContainer = document.querySelector('.terminal-container');
        if (terminalContainer) {
            terminalContainer.classList.add('glitch');
        }

        // Disable input handling
        this.state.isLocked = true;
    }

    printWelcome() {
        const asciiArt = `
 __      __       .__                                 __      __      .__   _____ 
╱  ╲    ╱  ╲ ____ │  │   ____  ____   _____   ____   ╱  ╲    ╱  ╲____ │  │_╱ ____╲
╲   ╲╱╲╱   ╱╱ __ ╲│  │ _╱ ___╲╱  _ ╲ ╱     ╲_╱ __ ╲  ╲   ╲╱╲╱   ╱  _ ╲│  │╲   __╲ 
 ╲        ╱╲  ___╱│  │_╲  ╲__(  <_> )  Y Y  ╲  ___╱   ╲        (  <_> )  │_│  │   
  ╲__╱╲  ╱  ╲___  >____╱╲___  >____╱│__│_│  ╱╲___  >   ╲__╱╲  ╱ ╲____╱│____╱__│   
       ╲╱       ╲╱          ╲╱            ╲╱     ╲╱         ╲╱                    
`;
        this.renderer.print('<pre class="ascii-art">' + asciiArt + '</pre>', 'output');
        
        // Check if user is already authorized (logged in)
        if (this.state.isAuthorized) {
            this.renderer.print('<strong>Welcome back, L0neW0lf. All systems operational.</strong>', 'success');
            this.renderer.print('Your personal dashboard commands are available.', 'info');
            this.renderer.print('');
        } else {
            this.renderer.print('<strong>Welcome to Portfolio Terminal v1.0</strong>', 'welcome-message');
            this.renderer.print('Type <strong>help</strong> to see available commands.', 'info');
            this.renderer.print('Tip: Use <strong>sudo login</strong> to access admin mode.', 'info');
            this.renderer.print('');
        }
    }

    bindEvents() {
        this.inputElement.addEventListener('keydown', (e) => {
            if (this.state.isWaitingForInput) {
                // Let the input handler (password/bio) handle this
                return;
            }
            
            if (e.key === 'Enter') {
                this.handleCommand();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory(1);
            }
        });

        // Focus terminal when clicking inside the terminal container
        const terminalContainer = document.querySelector('.terminal-container');
        if (terminalContainer) {
            terminalContainer.addEventListener('click', () => {
                if (!this.state.isWaitingForInput) {
                    this.focusInput();
                }
            });
            
            // iOS-specific: Handle touch events for better mobile experience
            terminalContainer.addEventListener('touchstart', (e) => {
                // Don't interfere with scrolling if touching the scrollable area
                const target = e.target;
                if (target.closest('.terminal-body') || target.closest('.terminal-output')) {
                    return;
                }
                if (!this.state.isWaitingForInput) {
                    this.focusInput();
                }
            }, { passive: true });
        }
        
        // iOS-specific: Prevent viewport zooming on input focus
        this.inputElement.addEventListener('focus', () => {
            // Prevent zoom on iOS
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            }
        });
        
        this.inputElement.addEventListener('blur', () => {
            // Restore viewport on blur
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
            }
        });
    }

    focusInput() {
        this.inputElement.focus();
    }

    handleCommand() {
        const input = this.inputElement.value;
        
        if (!input.trim()) {
            this.renderer.printCommand('');
            this.inputElement.value = '';
            return;
        }

        // Add to history
        this.commandHistory.push(input);
        this.historyIndex = this.commandHistory.length;

        // Print the command
        this.renderer.printCommand(input);

        // Parse and execute
        const parsed = this.parser.parse(input);
        
        if (parsed.command) {
            this.commandRegistry.execute(parsed.command, parsed.args, parsed.flags);
        }

        this.inputElement.value = '';
        this.focusInput();
    }

    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;

        this.historyIndex += direction;

        if (this.historyIndex < 0) {
            this.historyIndex = 0;
        } else if (this.historyIndex >= this.commandHistory.length) {
            this.historyIndex = this.commandHistory.length;
            this.inputElement.value = '';
            return;
        }

        this.inputElement.value = this.commandHistory[this.historyIndex];
    }
}

// Initialize terminal when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Terminal();
});

// Terminal Window Control Buttons (Red, Yellow, Green)
document.addEventListener('DOMContentLoaded', () => {
    // Support both class naming conventions (close/minimize/maximize OR red/yellow/green)
    const terminalContainer = document.querySelector('.terminal-container, .terminal-window');
    const closeBtn = document.querySelector('.terminal-btn.close, .terminal-btn.red');
    const minimizeBtn = document.querySelector('.terminal-btn.minimize, .terminal-btn.yellow');
    const maximizeBtn = document.querySelector('.terminal-btn.maximize, .terminal-btn.green');
    
    if (!terminalContainer || !closeBtn || !minimizeBtn || !maximizeBtn) return;
    
    let isMinimized = false;
    let isMaximized = false;
    
    // Create a floating button to restore the terminal after closing
    const floatingBtn = document.createElement('div');
    floatingBtn.id = 'terminal-restore-btn';
    floatingBtn.innerHTML = '$_';
    floatingBtn.title = 'Restore Terminal';
    floatingBtn.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: rgba(108, 92, 231, 0.9);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 4px 20px rgba(108, 92, 231, 0.4);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        font-size: 18px;
        font-family: 'Fira Code', monospace;
        color: #fff;
    `;
    
    floatingBtn.addEventListener('mouseenter', () => {
        floatingBtn.style.transform = 'scale(1.1)';
        floatingBtn.style.boxShadow = '0 6px 25px rgba(108, 92, 231, 0.6)';
    });
    
    floatingBtn.addEventListener('mouseleave', () => {
        floatingBtn.style.transform = 'scale(1)';
        floatingBtn.style.boxShadow = '0 4px 20px rgba(108, 92, 231, 0.4)';
    });
    
    // Initially hide the floating button
    floatingBtn.style.display = 'none';
    document.body.appendChild(floatingBtn);
    
    // Close Button - Hide the terminal and show floating restore button
    closeBtn.addEventListener('click', () => {
        terminalContainer.style.display = 'none';
        floatingBtn.style.display = 'flex';
    });
    
    // Floating button click - restore the terminal
    floatingBtn.addEventListener('click', () => {
        terminalContainer.style.display = 'flex';
        floatingBtn.style.display = 'none';
        // Reset states
        isMinimized = false;
        isMaximized = false;
        terminalContainer.style.maxWidth = '';
        terminalContainer.style.maxHeight = '';
        terminalContainer.style.height = '';
        terminalContainer.style.marginTop = '';
        terminalContainer.style.borderRadius = '';
        
        const terminalBody = terminalContainer.querySelector('.terminal-body');
        const terminalInputLine = terminalContainer.querySelector('.terminal-input-line');
        const terminalHeader = terminalContainer.querySelector('.terminal-header');
        if (terminalBody) terminalBody.style.display = 'flex';
        if (terminalInputLine) terminalInputLine.style.display = 'flex';
        if (terminalHeader) terminalHeader.style.padding = '';
    });
    
    // Minimize Button - Collapse the terminal
    minimizeBtn.addEventListener('click', () => {
        isMinimized = !isMinimized;
        const terminalBody = terminalContainer.querySelector('.terminal-body');
        const terminalInputLine = terminalContainer.querySelector('.terminal-input-line');
        const terminalHeader = terminalContainer.querySelector('.terminal-header');
        
        if (isMinimized) {
            // Collapse everything except the header
            if (terminalBody) terminalBody.style.display = 'none';
            if (terminalInputLine) terminalInputLine.style.display = 'none';
            // Make header minimal
            if (terminalHeader) {
                terminalHeader.style.padding = '8px 20px';
            }
            terminalContainer.style.minHeight = 'auto';
        } else {
            // Restore everything
            if (terminalBody) terminalBody.style.display = 'flex';
            if (terminalInputLine) terminalInputLine.style.display = 'flex';
            if (terminalHeader) terminalHeader.style.padding = '';
            terminalContainer.style.minHeight = '';
        }
    });
    
    // Maximize Button - Toggle fullscreen/maximize
    maximizeBtn.addEventListener('click', () => {
        isMaximized = !isMaximized;
        
        if (isMaximized) {
            // Apply maximize styles
            terminalContainer.style.maxWidth = '100%';
            terminalContainer.style.maxHeight = '100vh';
            terminalContainer.style.height = '100vh';
            terminalContainer.style.marginTop = '0';
            terminalContainer.style.borderRadius = '0';
        } else {
            // Restore original styles
            terminalContainer.style.maxWidth = '';
            terminalContainer.style.maxHeight = '';
            terminalContainer.style.height = '';
            terminalContainer.style.marginTop = '';
            terminalContainer.style.borderRadius = '';
        }
    });
});

