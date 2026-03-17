/**
 * L0neW0lf Terminal – BEAST MODE EDITION (ASCII + Boot Sequence 100% ORIGINAL)
 * Real CLI experience: virtual filesystem, dynamic path prompt, typing animation,
 * tab autocomplete (commands + files), themes, neofetch, echo, whoami, date,
 * number guessing game, pwd/cd/cat/ls + ALL your original features preserved.
 * 
 * Boot sequence & ASCII art restored EXACTLY to your original code.
 * Just replace your entire terminal.js with this.
 */

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

    printTyped(text, className = 'output', speed = 15) {
        const div = document.createElement('div');
        div.className = className;
        this.outputElement.appendChild(div);
        this.scrollToBottom();

        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                const char = text[i] === '\n' ? '<br>' : text[i];
                div.innerHTML += char;
                i++;
                this.scrollToBottom();
            } else {
                clearInterval(interval);
            }
        }, speed);
    }

    printCommand(command) {
        const prompt = document.getElementById('prompt');
        const promptText = prompt.textContent;
        const div = document.createElement('div');
        div.className = 'command';
        div.innerHTML = `<span class="prompt">${promptText}</span> ${this.escapeHtml(command)}`;
        this.outputElement.appendChild(div);
        this.scrollToBottom();
    }

    printLink(url, text) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    }

    scrollToBottom() {
        const terminalBody = document.querySelector('.terminal-body');
        const terminalOutput = document.getElementById('output');
        requestAnimationFrame(() => {
            if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight;
            if (terminalOutput) terminalOutput.scrollTop = terminalOutput.scrollHeight;
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
        headers.forEach(header => table += `<th>${header}</th>`);
        table += '</tr></thead><tbody>';
        rows.forEach(row => {
            table += '<tr>';
            row.forEach(cell => table += `<td>${cell}</td>`);
            table += '</tr>';
        });
        table += '</tbody></table>';
        return table;
    }
}

class VirtualFS {
    constructor() {
        this.dirs = {
            '~': {
                'about.txt': `Hi, I'm Mohamed 👋\n\nFull-stack developer in the making.\nI like building fast, reliable things.\n\nCurrently exploring: AI, Paper Trading Bot, Flipper Zero.\n\nType 'help' or 'neofetch' for more.`,
                'socials.txt': `Personal: https://mohameddodda.github.io\nInstagram: https://instagram.com/mohameddodda_`,
                'skills.txt': `Python • JavaScript • React • Node.js\nFlask • Tailwind • Git • Linux\nAI Agents • Hardware Hacking`,
                'projects': { type: 'dir' }
            },
            'projects': {
                'terminal.txt': `This beast-mode terminal you are using right now.\nBuilt 100% in vanilla JS.`,
                'bot.txt': `Paper Trading Bot – AI-powered automated trading simulator.\nGitHub: https://github.com/mohameddodda/paper_trading_bot`
            }
        };
        this.cwd = '~';
    }

    getCurrentDir() {
        return this.cwd === '~' ? this.dirs['~'] : this.dirs['projects'];
    }

    ls() {
        if (this.cwd === '~') return ['about.txt', 'socials.txt', 'skills.txt', 'projects/'];
        return ['terminal.txt', 'bot.txt'];
    }

    cat(filename) {
        const dir = this.getCurrentDir();
        if (this.cwd === '~') {
            if (filename === 'about.txt') return this.dirs['~']['about.txt'];
            if (filename === 'socials.txt') return this.dirs['~']['socials.txt'];
            if (filename === 'skills.txt') return this.dirs['~']['skills.txt'];
            if (filename === 'projects') return 'projects is a directory – use "cd projects"';
        } else if (this.cwd === 'projects') {
            if (filename === 'terminal.txt') return this.dirs['projects']['terminal.txt'];
            if (filename === 'bot.txt') return this.dirs['projects']['bot.txt'];
        }
        return `cat: ${filename}: No such file or directory`;
    }

    cd(dir) {
        if (!dir || dir === '~' || dir === '..') {
            this.cwd = '~';
            return true;
        }
        if (this.cwd === '~' && dir === 'projects') {
            this.cwd = 'projects';
            return true;
        }
        return false;
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
            if (parts[i].startsWith('--') || parts[i].startsWith('-')) {
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
            this.renderer.print(`Error: ${error.message}`, 'error');
        }
    }

    registerDefaultCommands() {
        // ====================== HELP ======================
        this.register('help', () => {
            const isAdmin = this.state.isAuthorized;
            let helpText = `<strong>REAL CLI COMMANDS:</strong><br><br>`;
            const publicCmds = [
                ['help', 'This menu'],
                ['about', 'About me (HTML version)'],
                ['projects', 'My projects (HTML version)'],
                ['socials', 'Social links'],
                ['skills', 'Tech stack'],
                ['ls', 'List files'],
                ['cd <dir>', 'Change directory (projects / .. / ~)'],
                ['cat <file>', 'Read file'],
                ['pwd', 'Print working directory'],
                ['echo <text>', 'Echo text'],
                ['whoami', 'Who am I'],
                ['date', 'Current date/time'],
                ['neofetch', 'System info'],
                ['theme <hacker|matrix|default>', 'Change theme'],
                ['guess', 'Number guessing game'],
                ['contact', 'My email'],
                ['resume', 'Download resume'],
                ['matrix', 'Matrix rain easter egg'],
                ['clear', 'Clear screen'],
                ['sudo login', 'Admin login'],
                ['logout', 'Logout admin']
            ];

            publicCmds.forEach(([cmd, desc]) => {
                helpText += `<span class="help-command">${cmd}</span> - ${desc}<br>`;
            });

            if (isAdmin) {
                helpText += `<br><strong>ADMIN COMMANDS:</strong><br>`;
                const adminCmds = [
                    ['status --bot', 'Bot status'],
                    ['notes --view', 'Tasks'],
                    ['bot --stats', 'Statistics'],
                    ['edit --bio', 'Edit bio'],
                    ['sys --logs', 'System logs'],
                    ['network --logs', 'Network logs'],
                    ['devices', 'Owned hardware']
                ];
                adminCmds.forEach(([cmd, desc]) => {
                    helpText += `<span class="help-command" style="color:#ff3333">${cmd}</span> - ${desc}<br>`;
                });
            }
            this.renderer.print(helpText);
        }, { admin: false });

        // ====================== CORE FS COMMANDS ======================
        this.register('ls', () => {
            const items = this.terminal.fs.ls();
            if (this.state.isAuthorized) items.push('secret/');
            const output = items.map(item => item.endsWith('/') ? `📁 ${item}` : `📄 ${item}`).join('   ');
            this.renderer.printTyped(output);
        }, { admin: false });

        this.register('pwd', () => {
            this.renderer.printTyped(this.terminal.fs.cwd);
        }, { admin: false });

        this.register('cd', (args) => {
            const dir = args[0] || '~';
            if (this.terminal.fs.cd(dir)) {
                this.terminal.updatePrompt();
                this.renderer.printTyped(`Moved to ${this.terminal.fs.cwd}`);
            } else {
                this.renderer.print(`cd: ${dir}: No such directory`, 'error');
            }
        }, { admin: false });

        this.register('cat', (args) => {
            if (!args[0]) {
                this.renderer.print('Usage: cat <file>', 'warning');
                return;
            }
            const content = this.terminal.fs.cat(args[0]);
            if (content.startsWith('cat:')) {
                this.renderer.print(content, 'error');
            } else {
                this.renderer.printTyped(content);
            }
        }, { admin: false });

        // ====================== EXTRA REAL CLI ======================
        this.register('echo', (args) => {
            this.renderer.printTyped(args.join(' '));
        }, { admin: false });

        this.register('whoami', () => {
            const user = this.state.isAuthorized ? 'root' : 'guest';
            this.renderer.printTyped(user);
        }, { admin: false });

        this.register('date', () => {
            this.renderer.printTyped(new Date().toLocaleString());
        }, { admin: false });

        this.register('neofetch', () => {
            const info = `
   _____   _____ 
  / ____| / ____|
 | |  __ | |  __ 
 | | |_ || | |_ |
 | |__| || |__| |
  \\_____| \\_____|
  
L0neW0lf Terminal v2.0 (Beast Mode)
OS: Browser
Kernel: JavaScript
Uptime: ${Math.floor(performance.now() / 1000)}s
Shell: L0neW0lf CLI
CPU: Your brain
RAM: Unlimited creativity
Packages: 42 commands
`;
            this.renderer.print(`<pre class="ascii-art">${info}</pre>`);
        }, { admin: false });

        this.register('theme', (args) => {
            const t = (args[0] || 'default').toLowerCase();
            const container = document.querySelector('.terminal-container');
            if (container) {
                container.classList.remove('theme-hacker', 'theme-matrix', 'theme-default');
                container.classList.add(`theme-${t}`);
            }
            this.renderer.printTyped(`Theme switched to ${t} ✨`);
        }, { admin: false });

        this.register('guess', () => {
            this.terminal.isInGame = true;
            this.terminal.gameTarget = Math.floor(Math.random() * 100) + 1;
            this.renderer.print('🎲 Number Guessing Game (1-100) started!', 'success');
            this.renderer.print('Type your guess and press Enter. "exit" to quit.', 'info');
        }, { admin: false });

        // ====================== ORIGINAL FAVORITES ======================
        this.register('about', () => {
            const aboutText = `<strong>L0neW0lf</strong> - Full Stack Developer<br><br>Hi, I'm Mohamed 👋<br><br>Full-stack developer...in the making.<br>Type 'cat about.txt' for the filesystem version!`;
            this.renderer.print(aboutText);
        }, { admin: false });

        this.register('projects', () => {
            const projects = [
                ['Portfolio Terminal', 'A JS terminal emulator', 'https://mohameddodda.github.io'],
                ['Paper Trading Bot', 'AI-powered trading bot', 'https://github.com/mohameddodda/paper_trading_bot']
            ];
            let txt = '<strong>My Projects:</strong><br><br>';
            projects.forEach(([name, desc, url]) => {
                txt += `• <strong>${name}</strong><br>  ${desc}<br>  ${this.renderer.printLink(url, 'View Project')}<br><br>`;
            });
            this.renderer.print(txt);
        }, { admin: false });

        this.register('socials', () => {
            const socials = [['Personal', 'https://mohameddodda.github.io'], ['Instagram', 'https://instagram.com/mohameddodda_']];
            let txt = '<strong>Connect with me:</strong><br><br>';
            socials.forEach(([p, u]) => txt += `• ${p}: ${this.renderer.printLink(u, u)}<br>`);
            this.renderer.print(txt);
        }, { admin: false });

        this.register('skills', () => {
            this.renderer.print(`<strong>Tech Stack:</strong><br><br>• Python • JavaScript • React • Node.js<br>• Flask • Tailwind • Git • Linux<br>• AI Agents • Flipper Zero`);
        }, { admin: false });

        this.register('contact', (args) => {
            const email = 'hello@mohameddodda.com';
            this.renderer.print(`📧 Email: <span class="highlight">${email}</span>`);
            if (args[0] === 'copy') {
                navigator.clipboard.writeText(email).then(() => this.renderer.print('✅ Copied!', 'success'));
            } else {
                this.renderer.print('💡 Use "contact copy" to copy', 'info');
            }
        }, { admin: false });

        this.register('resume', () => {
            this.renderer.print('📄 Downloading resume...');
            const link = document.createElement('a');
            link.href = 'resume.pdf';
            link.download = 'Mohamed_Dodda_Resume.pdf';
            link.click();
        }, { admin: false });

        this.register('matrix', () => {
            this.renderer.printTyped('🌩️ Entering the matrix... (refresh to exit)');
            document.body.style.background = '#000';
        }, { admin: false });

        this.register('clear', () => this.renderer.clear(), { admin: false });

        // ====================== ADMIN COMMANDS (YOUR ORIGINAL CODE EXACT) ======================
        this.register('logout', (args, flags, registry) => {
            if (!this.state.isAuthorized) {
                this.renderer.print('You are not logged in.', 'warning');
                return;
            }
            this.state.isAuthorized = false;
            sessionStorage.removeItem('terminal_isAuthorized');
            this.terminal.updatePrompt();
            this.renderer.print('Logged out successfully.', 'info');
        }, { admin: false });

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
            this.terminal.setInputMode(true, '');
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
                        loginAttempts = 0;
                        sessionStorage.setItem('terminal_isAuthorized', 'true');
                        this.terminal.updatePrompt();
                        this.renderer.print('✓ Access granted! Welcome, Admin.', 'success');
                        this.renderer.print('Admin commands are now available.', 'info');
                    } else {
                        loginAttempts++;
                        this.renderer.print(`✗ Access denied. (Attempt ${loginAttempts}/3)`, 'error');
                        if (loginAttempts >= 3) this.terminal.lockdown();
                    }
                    input.value = '';
                    this.terminal.setInputMode(false, '');
                    input.removeEventListener('keydown', handlePassword);
                }
            };
            input.addEventListener('keydown', handlePassword);
        }, { admin: false });

        this.register('devices', () => {
            this.renderer.printTyped(`
Flipper Zero (ethical daily driver)
PS Vita + PS4
DJI Mavic Mini
Custom 60% mechanical keyboard
            `);
        }, { admin: true });

        this.register('bot', (args) => {
            if (args.length === 0 || args[0] !== '--stats') {
                this.renderer.print('Usage: bot --stats', 'warning');
                return;
            }
            const stats = [['Uptime', '99.9%'],['Total Commands', '1,234'],['Active Users', '567'],['Server Load', '12%']];
            const headers = ['Metric', 'Value'];
            this.renderer.print('<strong>Bot Statistics:</strong><br>');
            this.renderer.print(this.renderer.createTable(headers, stats));
        }, { admin: true });

        this.register('edit', (args) => {
            if (args.length === 0 || args[0] !== '--bio') {
                this.renderer.print('Usage: edit --bio', 'warning');
                return;
            }
            this.renderer.print('Enter new bio (press Enter to save):', 'info');
            this.terminal.setInputMode(true, '');
            const input = document.getElementById('command-input');
            input.value = '';
            input.focus();
            const handleBio = (e) => {
                if (e.key === 'Enter') {
                    const newBio = input.value.trim();
                    if (newBio) this.renderer.print(`✓ Bio updated: "${newBio}"`, 'success');
                    else this.renderer.print('Bio unchanged.', 'warning');
                    this.terminal.setInputMode(false, '');
                    input.removeEventListener('keydown', handleBio);
                }
            };
            input.addEventListener('keydown', handleBio);
        }, { admin: true });

        this.register('sys', (args) => {
            if (args.length === 0 || args[0] !== '--logs') {
                this.renderer.print('Usage: sys --logs', 'warning');
                return;
            }
            const logs = [['2024-01-15 10:30:45', 'System started'],['2024-01-15 10:31:00', 'User connected'],['2024-01-15 10:32:15', 'Command executed: help'],['2024-01-15 10:33:00', 'Admin login successful']];
            const headers = ['Timestamp', 'Event'];
            this.renderer.print('<strong>System Logs:</strong><br>');
            this.renderer.print(this.renderer.createTable(headers, logs));
        }, { admin: true });

        this.register('network', (args) => {
            if (args.length === 0 || args[0] !== '--logs') {
                this.renderer.print('Usage: network --logs', 'warning');
                return;
            }
            const logs = [['192.168.1.1', 'HTTP/200', 'GET /api/projects'],['192.168.1.45', 'HTTP/200', 'GET /api/socials'],['10.0.0.23', 'HTTP/304', 'GET /api/about'],['192.168.1.100', 'WebSocket', 'Connected']];
            const headers = ['Source IP', 'Status', 'Request'];
            this.renderer.print('<strong>Network Logs:</strong><br>');
            this.renderer.print(this.renderer.createTable(headers, logs));
        }, { admin: true });

        this.register('status', (args) => {
            if (args.length === 0 || args[0] !== '--bot') {
                this.renderer.print('Usage: status --bot', 'warning');
                return;
            }
            this.renderer.print('[L0neW0lf Bot v1.0]: Online | Strategy: Arbitrage | Uptime: 48h', 'success');
        }, { admin: true });

        this.register('notes', (args) => {
            if (args.length === 0 || args[0] !== '--view') {
                this.renderer.print('Usage: notes --view', 'warning');
                return;
            }
            const notes = ['1. Update and upgrade site','2. Update creative portfolio','3. Review paper trading bot codebase','4. Relax and think'];
            let notesText = '<strong>My Tasks:</strong><br><br>';
            notes.forEach(note => notesText += `• ${note}<br>`);
            this.renderer.print(notesText);
        }, { admin: true });
    }
}

class Terminal {
    constructor() {
        this.outputElement = document.getElementById('output');
        this.inputElement = document.getElementById('command-input');

        const savedAuth = sessionStorage.getItem('terminal_isAuthorized') === 'true';
        this.state = { isAuthorized: savedAuth, isWaitingForInput: false, isLocked: false };
        this.isInGame = false;
        this.gameTarget = 0;

        this.renderer = new OutputRenderer(this.outputElement);
        this.parser = new InputParser();
        this.fs = new VirtualFS();
        this.commandRegistry = new CommandRegistry(this.renderer, this.state, this);

        this.commandHistory = [];
        this.historyIndex = -1;

        this.init(savedAuth);
    }

    init(wasAuthorized) {
        this.boot(wasAuthorized);
    }

    // ====================== BOOT SEQUENCE – 100% ORIGINAL ======================
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
                self.printWelcome();
                self.bindEvents();
                if (wasAuthorized) self.updatePrompt();
                return;
            }

            const msg = bootMessages[messageIndex];
            const className = msg.isFinal ? 'boot-success' : 'boot-message';
            self.renderer.print(msg.text, className);
            
            messageIndex++;
            setTimeout(showNextMessage, msg.delay);
        }
        showNextMessage();
    }

    updatePrompt() {
        const promptEl = document.getElementById('prompt');
        const user = this.state.isAuthorized ? 'root' : 'guest';
        const symbol = this.state.isAuthorized ? '#' : '$';
        promptEl.textContent = `${user}@L0neW0lf:${this.fs.cwd}${symbol} `;
        if (this.state.isAuthorized) promptEl.classList.add('admin');
        else promptEl.classList.remove('admin');
    }

    setInputMode(waiting) {
        this.state.isWaitingForInput = waiting;
        if (waiting) this.inputElement.focus();
    }

    lockdown() {
        const inputLine = document.querySelector('.terminal-input-line');
        if (inputLine && this.inputElement) inputLine.removeChild(this.inputElement);
        const prompt = document.getElementById('prompt');
        if (prompt) prompt.textContent = '[SYSTEM LOCKED]';
        this.renderer.print('═══════════════════════════════════════════════════════════', 'error');
        this.renderer.print('CRITICAL: Unauthorized access attempt recorded. Terminal interface disabled.', 'error');
        this.renderer.print('═══════════════════════════════════════════════════════════', 'error');
        const terminalContainer = document.querySelector('.terminal-container');
        if (terminalContainer) terminalContainer.classList.add('glitch');
        this.state.isLocked = true;
    }

    // ====================== WELCOME – ASCII 100% ORIGINAL ======================
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
        
        if (this.state.isAuthorized) {
            this.renderer.print('<strong>Welcome back, L0neW0lf. All systems operational.</strong>', 'success');
            this.renderer.print('Your personal dashboard commands are available.', 'info');
        } else {
            this.renderer.print('<strong>Welcome to Portfolio Terminal v1.0</strong>', 'welcome-message');
            this.renderer.print('Type <strong>help</strong> to see available commands.', 'info');
            this.renderer.print('Tip: Use <strong>sudo login</strong> to access admin mode.', 'info');
        }
    }

    bindEvents() {
        this.inputElement.addEventListener('keydown', (e) => {
            if (this.state.isWaitingForInput) return;
            if (this.isInGame) {
                this.handleGameInput(e);
                return;
            }

            if (e.key === 'Enter') this.handleCommand();
            else if (e.key === 'ArrowUp') { e.preventDefault(); this.navigateHistory(-1); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); this.navigateHistory(1); }
            else if (e.key === 'Tab') { e.preventDefault(); this.autocompleteInput(); }
        });

        const terminalContainer = document.querySelector('.terminal-container');
        if (terminalContainer) {
            terminalContainer.addEventListener('click', () => {
                if (!this.state.isWaitingForInput) this.focusInput();
            });
            terminalContainer.addEventListener('touchstart', (e) => {
                if (!e.target.closest('.terminal-body') && !e.target.closest('.terminal-output')) {
                    if (!this.state.isWaitingForInput) this.focusInput();
                }
            }, { passive: true });
        }
        
        this.inputElement.addEventListener('focus', () => {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        });
        this.inputElement.addEventListener('blur', () => {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
        });
    }

    focusInput() { this.inputElement.focus(); }

    handleCommand() {
        const input = this.inputElement.value.trim();
        if (!input) {
            this.renderer.printCommand('');
            this.inputElement.value = '';
            return;
        }

        this.commandHistory.push(input);
        this.historyIndex = this.commandHistory.length;
        this.renderer.printCommand(input);

        const parsed = this.parser.parse(input);
        if (parsed.command) this.commandRegistry.execute(parsed.command, parsed.args, parsed.flags);

        this.inputElement.value = '';
        this.focusInput();
    }

    handleGameInput(e) {
        if (e.key !== 'Enter') return;
        const input = this.inputElement.value.trim();
        this.renderer.printCommand(input);

        if (input.toLowerCase() === 'exit') {
            this.isInGame = false;
            this.renderer.print('Game exited.', 'info');
            this.inputElement.value = '';
            return;
        }

        const guess = parseInt(input);
        if (isNaN(guess)) {
            this.renderer.print('Enter a number 1-100!', 'warning');
        } else if (guess === this.gameTarget) {
            this.renderer.print('🎉 YOU WIN! Correct number was ' + this.gameTarget, 'success');
            this.isInGame = false;
        } else {
            this.renderer.print(guess < this.gameTarget ? 'Too low ↑' : 'Too high ↓', 'info');
        }
        this.inputElement.value = '';
    }

    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;
        this.historyIndex += direction;
        if (this.historyIndex < 0) this.historyIndex = 0;
        if (this.historyIndex >= this.commandHistory.length) {
            this.historyIndex = this.commandHistory.length;
            this.inputElement.value = '';
            return;
        }
        this.inputElement.value = this.commandHistory[this.historyIndex];
    }

    autocompleteInput() {
        let value = this.inputElement.value.trim();
        if (!value) return;
        const parts = value.split(/\s+/);
        const current = parts[parts.length - 1].toLowerCase();

        let matches = [];
        if (parts.length === 1) {
            matches = Array.from(this.commandRegistry.commands.keys()).filter(c => c.startsWith(current));
        } else if (['cd', 'cat'].includes(parts[0])) {
            matches = this.fs.ls().filter(f => f.toLowerCase().startsWith(current));
        }

        if (matches.length === 1) {
            parts[parts.length - 1] = matches[0];
            this.inputElement.value = parts.join(' ') + (matches[0].endsWith('/') ? '' : ' ');
        } else if (matches.length > 1) {
            this.renderer.print(matches.join('   '), 'info');
        }
    }
}

// ====================== INIT + WINDOW CONTROLS (YOUR ORIGINAL EXACT) ======================
document.addEventListener('DOMContentLoaded', () => {
    new Terminal();
});

document.addEventListener('DOMContentLoaded', () => {
    const terminalContainer = document.querySelector('.terminal-container, .terminal-window');
    const closeBtn = document.querySelector('.terminal-btn.close, .terminal-btn.red');
    const minimizeBtn = document.querySelector('.terminal-btn.minimize, .terminal-btn.yellow');
    const maximizeBtn = document.querySelector('.terminal-btn.maximize, .terminal-btn.green');
    
    if (!terminalContainer || !closeBtn || !minimizeBtn || !maximizeBtn) return;
    
    let isMinimized = false;
    let isMaximized = false;
    
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
    
    floatingBtn.style.display = 'none';
    document.body.appendChild(floatingBtn);
    
    closeBtn.addEventListener('click', () => {
        terminalContainer.style.display = 'none';
        floatingBtn.style.display = 'flex';
    });
    
    floatingBtn.addEventListener('click', () => {
        terminalContainer.style.display = 'flex';
        floatingBtn.style.display = 'none';
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
    
    minimizeBtn.addEventListener('click', () => {
        isMinimized = !isMinimized;
        const terminalBody = terminalContainer.querySelector('.terminal-body');
        const terminalInputLine = terminalContainer.querySelector('.terminal-input-line');
        const terminalHeader = terminalContainer.querySelector('.terminal-header');
        
        if (isMinimized) {
            if (terminalBody) terminalBody.style.display = 'none';
            if (terminalInputLine) terminalInputLine.style.display = 'none';
            if (terminalHeader) terminalHeader.style.padding = '8px 20px';
            terminalContainer.style.minHeight = 'auto';
        } else {
            if (terminalBody) terminalBody.style.display = 'flex';
            if (terminalInputLine) terminalInputLine.style.display = 'flex';
            if (terminalHeader) terminalHeader.style.padding = '';
            terminalContainer.style.minHeight = '';
        }
    });
    
    maximizeBtn.addEventListener('click', () => {
        isMaximized = !isMaximized;
        
        if (isMaximized) {
            terminalContainer.style.maxWidth = '100%';
            terminalContainer.style.maxHeight = '100vh';
            terminalContainer.style.height = '100vh';
            terminalContainer.style.marginTop = '0';
            terminalContainer.style.borderRadius = '0';
        } else {
            terminalContainer.style.maxWidth = '';
            terminalContainer.style.maxHeight = '';
            terminalContainer.style.height = '';
            terminalContainer.style.marginTop = '';
            terminalContainer.style.borderRadius = '';
        }
    });
});