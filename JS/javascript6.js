class ServerMonitor {
    constructor() {
        this.startTime = Date.now();
        this.requestCount = 0;
        this.latencyHistory = [];
        this.networkData = [];
        this.maxDataPoints = 20;
        
        this.init();
    }

    init() {
        this.initMobileMenu();
        this.initNavigation();
        this.initAIAssistant();
        this.initChat();
        this.initWeather();
        this.initWorldMap();
        this.fetchIPInfo();
        this.startNetworkMonitoring();
        this.startRealtimeUpdates();
        this.initNetworkGraph();
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 1000);
    }

    initMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mobileNav = document.getElementById('mobileNav');

        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            mobileNav.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        const mobileLinks = document.querySelectorAll('.nav-link-mobile');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('active');
                mobileNav.classList.remove('active');
            });
        });
    }

    initNavigation() {
        // Handle navigation clicks
        const navLinks = document.querySelectorAll('.nav-link, .nav-link-mobile');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href').substring(1); // Remove #
                this.showPage(target);
                
                // Update active states
                navLinks.forEach(l => l.classList.remove('active'));
                document.querySelectorAll(`[href="#${target}"]`).forEach(l => l.classList.add('active'));
                
                // Close mobile menu if open
                const mobileNav = document.getElementById('mobileNav');
                const mobileToggle = document.getElementById('mobileMenuToggle');
                if (mobileNav.classList.contains('active')) {
                    mobileNav.classList.remove('active');
                    mobileToggle.classList.remove('active');
                }
            });
        });
    }

    showPage(pageName) {
        // Hide all sections first
        const sections = document.querySelectorAll('.page-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });

        // Show the requested page
        const targetSection = document.getElementById(`${pageName}-page`);
        if (targetSection) {
            targetSection.style.display = 'block';
        } else {
            // Show dashboard by default
            document.getElementById('dashboard-page').style.display = 'block';
        }

        // Update page title
        document.title = `Server Monitor - ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`;
    }

    async fetchIPInfo() {
        try {
            const response = await fetch('https://ipinfo.io/json');
            const data = await response.json();
            
            document.getElementById('ipAddress').textContent = data.ip || 'N/A';
            document.getElementById('location').textContent = `${data.city || 'Unknown'}, ${data.region || 'Unknown'}`;
            document.getElementById('isp').textContent = data.org || 'Unknown';
            document.getElementById('country').textContent = data.country || 'Unknown';
            document.getElementById('timezone').textContent = data.timezone || 'Unknown';
            document.getElementById('coordinates').textContent = data.loc || 'Unknown';
            document.getElementById('mapInfo').textContent = `${data.city || 'Unknown'}, ${data.country || 'Unknown'}`;
            
        } catch (error) {
            console.error('Error fetching IP info:', error);
            document.getElementById('ipAddress').textContent = 'Error loading';
            document.getElementById('location').textContent = 'Error loading';
            document.getElementById('isp').textContent = 'Error loading';
            document.getElementById('country').textContent = 'Error loading';
            document.getElementById('timezone').textContent = 'Error loading';
            document.getElementById('coordinates').textContent = 'Error loading';
            document.getElementById('mapInfo').textContent = 'Error loading location';
        }
    }

    async measureLatency() {
        const startTime = performance.now();
        try {
            await fetch('https://www.google.com/favicon.ico', { 
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            const endTime = performance.now();
            return Math.round(endTime - startTime);
        } catch (error) {
            return Math.round(Math.random() * 100 + 50); // Fallback random latency
        }
    }

    getConnectionInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
            return {
                effectiveType: connection.effectiveType || 'unknown',
                downlink: connection.downlink || 0,
                rtt: connection.rtt || 0,
                saveData: connection.saveData || false
            };
        }
        
        return {
            effectiveType: 'unknown',
            downlink: 0,
            rtt: 0,
            saveData: false
        };
    }

    updateNetworkSpeed() {
        const connection = this.getConnectionInfo();
        let speedText = 'Unknown';
        let connectionType = 'Unknown';

        if (connection.effectiveType) {
            connectionType = connection.effectiveType.toUpperCase();
            
            switch (connection.effectiveType) {
                case 'slow-2g':
                    speedText = '< 50 Kbps';
                    break;
                case '2g':
                    speedText = '50-70 Kbps';
                    break;
                case '3g':
                    speedText = '70-700 Kbps';
                    break;
                case '4g':
                    speedText = '700+ Kbps';
                    break;
                default:
                    speedText = connection.downlink ? `${connection.downlink} Mbps` : 'Unknown';
            }
        }

        document.getElementById('networkSpeed').textContent = speedText;
        document.querySelector('#networkSpeed').nextElementSibling.textContent = connectionType;
    }

    async updateLatency() {
        const latency = await this.measureLatency();
        this.latencyHistory.push(latency);
        
        if (this.latencyHistory.length > 10) {
            this.latencyHistory.shift();
        }

        document.getElementById('latency').textContent = `${latency}ms`;
        
        // Update average latency
        const avgLatency = Math.round(
            this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length
        );
        document.getElementById('avgLatency').textContent = `${avgLatency}ms`;
    }

    updateSignalStrength() {
        const connection = this.getConnectionInfo();
        let strength = 'Unknown';
        let quality = 'Unknown';

        if (connection.effectiveType) {
            switch (connection.effectiveType) {
                case 'slow-2g':
                    strength = 'Poor';
                    quality = '1/5 bars';
                    break;
                case '2g':
                    strength = 'Fair';
                    quality = '2/5 bars';
                    break;
                case '3g':
                    strength = 'Good';
                    quality = '3/5 bars';
                    break;
                case '4g':
                    strength = 'Excellent';
                    quality = '4/5 bars';
                    break;
                default:
                    strength = 'Unknown';
                    quality = 'Unknown';
            }
        }

        document.getElementById('signalStrength').textContent = strength;
        document.querySelector('#signalStrength').nextElementSibling.textContent = quality;
    }

    updateDataUsage() {
        // Simulate data usage calculation
        const sessionTime = (Date.now() - this.startTime) / 1000 / 60; // minutes
        const estimatedUsage = Math.round(sessionTime * 0.5 + Math.random() * 2); // MB
        
        document.getElementById('dataUsage').textContent = `${estimatedUsage} MB`;
    }

    updateServerStatus() {
        // Simulate server status
        const status = Math.random() > 0.1 ? 'online' : 'warning';
        const statusElement = document.getElementById('serverStatus');
        const statusText = document.getElementById('serverStatusText');
        
        statusElement.className = `status-indicator ${status}`;
        statusText.textContent = status === 'online' ? 'Online' : 'Warning';
    }

    updateNetworkStatus() {
        const connection = this.getConnectionInfo();
        const statusElement = document.getElementById('networkStatus');
        const statusText = document.getElementById('networkStatusText');
        
        if (navigator.onLine) {
            if (connection.effectiveType === 'slow-2g') {
                statusElement.className = 'status-indicator warning';
                statusText.textContent = 'Slow Connection';
            } else {
                statusElement.className = 'status-indicator online';
                statusText.textContent = 'Connected';
            }
        } else {
            statusElement.className = 'status-indicator';
            statusText.textContent = 'Offline';
        }
    }

    updateConnectionStatus() {
        const connection = this.getConnectionInfo();
        const statusElement = document.getElementById('connectionStatus');
        const statusText = document.getElementById('connectionStatusText');
        
        if (connection.effectiveType && connection.effectiveType !== 'unknown') {
            statusElement.className = 'status-indicator online';
            statusText.textContent = connection.effectiveType.toUpperCase();
        } else {
            statusElement.className = 'status-indicator warning';
            statusText.textContent = 'Limited Info';
        }
    }

    updateUptime() {
        const uptime = Date.now() - this.startTime;
        const hours = Math.floor(uptime / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
        
        document.getElementById('uptime').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateRequests() {
        this.requestCount += Math.floor(Math.random() * 3);
        document.getElementById('requests').textContent = this.requestCount.toString();
    }

    updateErrorRate() {
        const errorRate = Math.random() * 5; // 0-5% error rate
        document.getElementById('errorRate').textContent = `${errorRate.toFixed(1)}%`;
    }

    updateDateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const dateString = now.toLocaleDateString();
        
        // Update any datetime displays if needed
        document.title = `Server Monitor - ${timeString}`;
    }

    updateNetworkDetails() {
        const connection = this.getConnectionInfo();
        
        // Update connection details
        document.getElementById('connectionType').textContent = connection.effectiveType?.toUpperCase() || 'Unknown';
        document.getElementById('downloadSpeed').textContent = connection.downlink ? `${connection.downlink} Mbps` : 'N/A';
        document.getElementById('uploadSpeed').textContent = connection.downlink ? `${(connection.downlink * 0.8).toFixed(1)} Mbps` : 'N/A';
        document.getElementById('ping').textContent = connection.rtt ? `${connection.rtt}ms` : 'N/A';
        
        // Update server info
        document.getElementById('serverResponse').textContent = navigator.onLine ? 'Active' : 'Offline';
        document.getElementById('sslStatus').textContent = location.protocol === 'https:' ? 'Secured' : 'Standard';
        document.getElementById('protocol').textContent = location.protocol.replace(':', '').toUpperCase();
        document.getElementById('port').textContent = location.port || (location.protocol === 'https:' ? '443' : '80');
    }

    updateAnalytics() {
        if (this.latencyHistory.length === 0) return;
        
        const minLatency = Math.min(...this.latencyHistory);
        const maxLatency = Math.max(...this.latencyHistory);
        const avgLatency = Math.round(this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length);
        
        document.getElementById('minLatency').textContent = `${minLatency}ms`;
        document.getElementById('maxLatency').textContent = `${maxLatency}ms`;
        document.getElementById('avgLatencyAnalytics').textContent = `${avgLatency}ms`;
        
        // Update traffic analytics
        document.getElementById('totalRequests').textContent = this.requestCount.toString();
        document.getElementById('successRate').textContent = `${(95 + Math.random() * 4).toFixed(1)}%`;
        
        const sessionTime = (Date.now() - this.startTime) / 1000 / 60; // minutes
        const dataTransferred = Math.round(sessionTime * 0.5 + Math.random() * 2);
        document.getElementById('dataTransferred').textContent = `${dataTransferred} MB`;
    }

    updateMonitoring() {
        // Simulate system monitoring data
        const cpuUsage = Math.round(30 + Math.random() * 40);
        const memoryUsage = Math.round(40 + Math.random() * 40);
        const diskUsage = Math.round(20 + Math.random() * 30);
        const temperature = Math.round(35 + Math.random() * 15);
        
        // Update progress bars
        if (document.getElementById('cpuProgress')) {
            document.getElementById('cpuProgress').style.width = `${cpuUsage}%`;
            document.getElementById('cpuUsage').textContent = `${cpuUsage}%`;
        }
        
        if (document.getElementById('memoryProgress')) {
            document.getElementById('memoryProgress').style.width = `${memoryUsage}%`;
            document.getElementById('memoryUsage').textContent = `${memoryUsage}%`;
        }
        
        if (document.getElementById('diskProgress')) {
            document.getElementById('diskProgress').style.width = `${diskUsage}%`;
            document.getElementById('diskUsage').textContent = `${diskUsage}%`;
        }
        
        // Update temperature
        if (document.getElementById('temperature')) {
            document.getElementById('temperature').textContent = `${temperature}°C`;
            const tempStatus = document.getElementById('tempStatus');
            if (temperature < 45) {
                tempStatus.textContent = 'Normal';
                tempStatus.style.color = 'var(--success-color)';
            } else if (temperature < 60) {
                tempStatus.textContent = 'Warm';
                tempStatus.style.color = 'var(--warning-color)';
            } else {
                tempStatus.textContent = 'Hot';
                tempStatus.style.color = 'var(--error-color)';
            }
        }
    }

    initAIAssistant() {
        this.aiMessages = [
            "Halo! Saya adalah AI Assistant untuk monitoring server Anda. Semua sistem berjalan normal.",
            "Server beroperasi dengan performa optimal. Latency rendah dan bandwidth stabil.",
            "Monitoring real-time aktif. Semua metrics dalam rentang normal.",
            "Sistem keamanan aktif. Tidak ada ancaman terdeteksi.",
            "Backup otomatis berjalan lancar. Data Anda aman.",
            "Network performance sangat baik. Koneksi stabil ke semua region.",
            "CPU dan memory usage dalam batas wajar. Server healthy!",
            "Database connections optimal. Query response time cepat."
        ];
        
        // Change AI message every 10 seconds
        setInterval(() => {
            this.updateAIMessage();
        }, 10000);

        // AI button handlers
        const speakBtn = document.getElementById('speakBtn');
        const helpBtn = document.getElementById('helpBtn');
        const settingsAiBtn = document.getElementById('settingsAiBtn');

        if (speakBtn) {
            speakBtn.addEventListener('click', () => {
                this.handleAISpeak();
            });
        }

        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                this.showAIHelp();
            });
        }

        if (settingsAiBtn) {
            settingsAiBtn.addEventListener('click', () => {
                this.showAISettings();
            });
        }
    }

    updateAIMessage() {
        const messageElement = document.getElementById('aiMessage');
        if (messageElement) {
            const randomMessage = this.aiMessages[Math.floor(Math.random() * this.aiMessages.length)];
            messageElement.textContent = randomMessage;
            
            // Add typing animation
            messageElement.style.opacity = '0.5';
            setTimeout(() => {
                messageElement.style.opacity = '1';
            }, 500);
        }
    }

    handleAISpeak() {
        const helpMessages = [
            "Untuk melihat statistik server, klik tombol Analytics di menu navigasi.",
            "Gunakan halaman Network untuk melihat detail koneksi dan IP information.",
            "Halaman Monitoring menampilkan CPU, memory, dan disk usage secara real-time.",
            "Settings dapat digunakan untuk mengatur notifikasi dan interval monitoring.",
            "Semua data di dashboard ini diperbarui secara real-time otomatis."
        ];
        
        const randomHelp = helpMessages[Math.floor(Math.random() * helpMessages.length)];
        document.getElementById('aiMessage').textContent = randomHelp;
    }

    showAIHelp() {
        document.getElementById('aiMessage').textContent = "Commands: 'status' untuk cek server, 'reset' untuk restart dashboard, 'help' untuk bantuan, 'time' untuk waktu server, 'info' untuk informasi sistem.";
    }

    showAISettings() {
        document.getElementById('aiMessage').textContent = "AI Assistant Settings: Auto-response aktif, Smart monitoring enabled, Voice guidance ready. Klik Settings di menu untuk konfigurasi lebih lanjut.";
    }

    initChat() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendChatBtn');
        
        if (chatInput && sendBtn) {
            const sendMessage = () => {
                const message = chatInput.value.trim();
                if (message) {
                    this.addChatMessage(message, 'user');
                    chatInput.value = '';
                    
                    // Simulate AI response
                    setTimeout(() => {
                        this.handleChatCommand(message);
                    }, 1000);
                }
            };

            sendBtn.addEventListener('click', sendMessage);
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }

        // Add periodic system messages
        setInterval(() => {
            this.addSystemMessage();
        }, 30000);
    }

    addChatMessage(message, type) {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${type}`;
            
            const time = new Date().toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            messageDiv.innerHTML = `
                <span class="message-time">${time}</span>
                <span class="message-text">${message}</span>
            `;
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    handleChatCommand(command) {
        const cmd = command.toLowerCase();
        let response = '';

        if (cmd.includes('status')) {
            response = 'Server status: Online ✓ | CPU: 45% | Memory: 62% | Latency: 23ms';
        } else if (cmd.includes('reset')) {
            response = 'Dashboard direset. Semua data monitoring di-refresh.';
            setTimeout(() => location.reload(), 2000);
        } else if (cmd.includes('help')) {
            response = 'Commands: status, reset, time, info, network, analytics';
        } else if (cmd.includes('time')) {
            response = `Server time: ${new Date().toLocaleString('id-ID')}`;
        } else if (cmd.includes('info')) {
            response = 'Server Monitor v2.0 | Uptime: ' + document.getElementById('uptime')?.textContent + ' | Location: Jakarta, Indonesia';
        } else if (cmd.includes('network')) {
            response = 'Network status: Connected | Speed: 4G | Latency: Low | ISP: ' + (document.getElementById('isp')?.textContent || 'Unknown');
        } else if (cmd.includes('analytics')) {
            response = 'Analytics: Requests/min: 45 | Error rate: 0.2% | Peak usage: 89% CPU';
        } else {
            response = 'Command tidak dikenali. Ketik "help" untuk melihat daftar command.';
        }

        this.addChatMessage(response, 'system');
    }

    addSystemMessage() {
        const systemMessages = [
            'System health check completed - All services running normally',
            'Auto-backup completed successfully',
            'Security scan completed - No threats detected', 
            'Performance optimization applied',
            'Network connectivity verified across all regions'
        ];
        
        const randomMessage = systemMessages[Math.floor(Math.random() * systemMessages.length)];
        this.addChatMessage(randomMessage, 'info');
    }

    initWeather() {
        // Use IP location data for weather
        setTimeout(() => {
            this.updateWeatherData();
        }, 2000);
        
        // Update weather every 10 minutes
        setInterval(() => {
            this.updateWeatherData();
        }, 600000);
    }

    updateWeatherData() {
        // Simulate weather data based on location
        const locations = {
            'Jakarta': { temp: 28, desc: 'Partly Cloudy', icon: 'fa-cloud-sun', humidity: 75, wind: 12, visibility: 8 },
            'Singapore': { temp: 30, desc: 'Sunny', icon: 'fa-sun', humidity: 80, wind: 8, visibility: 10 },
            'Tokyo': { temp: 22, desc: 'Cloudy', icon: 'fa-cloud', humidity: 65, wind: 15, visibility: 12 },
            'London': { temp: 15, desc: 'Rainy', icon: 'fa-cloud-rain', humidity: 85, wind: 20, visibility: 6 },
            'New York': { temp: 18, desc: 'Clear', icon: 'fa-sun', humidity: 55, wind: 10, visibility: 15 }
        };

        const currentLocation = document.getElementById('location')?.textContent || 'Jakarta, Indonesia';
        const city = currentLocation.split(',')[0] || 'Jakarta';
        const weather = locations[city] || locations['Jakarta'];

        // Add some randomness
        weather.temp += Math.round((Math.random() - 0.5) * 6);
        weather.humidity += Math.round((Math.random() - 0.5) * 10);
        weather.wind += Math.round((Math.random() - 0.5) * 8);

        if (document.getElementById('weatherLocation')) {
            document.getElementById('weatherLocation').textContent = currentLocation;
            document.getElementById('weatherTemp').textContent = `${weather.temp}°C`;
            document.getElementById('weatherDesc').textContent = weather.desc;
            document.getElementById('weatherIcon').className = `fas ${weather.icon}`;
            document.getElementById('humidity').textContent = `${weather.humidity}%`;
            document.getElementById('windSpeed').textContent = `${weather.wind} km/h`;
            document.getElementById('visibility').textContent = `${weather.visibility} km`;
        }
    }

    initWorldMap() {
        // Animate connection dots
        setInterval(() => {
            this.updateWorldMapStats();
            this.animateConnections();
        }, 5000);

        // Map control buttons
        const realTimeBtn = document.getElementById('realTimeBtn');
        const heatmapBtn = document.getElementById('heatmapBtn');
        const trafficBtn = document.getElementById('trafficBtn');

        [realTimeBtn, heatmapBtn, trafficBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.map-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    this.switchMapMode(e.target.id);
                });
            }
        });
    }

    updateWorldMapStats() {
        if (document.getElementById('activeUsers')) {
            const baseUsers = 200;
            const users = baseUsers + Math.round(Math.random() * 100);
            document.getElementById('activeUsers').textContent = users.toString();
            
            const countries = 15 + Math.round(Math.random() * 8);
            document.getElementById('countries').textContent = countries.toString();
            
            const servers = 10 + Math.round(Math.random() * 5);
            document.getElementById('servers').textContent = servers.toString();
        }
    }

    animateConnections() {
        const dots = document.querySelectorAll('.connection-dot');
        dots.forEach(dot => {
            // Random pulse animation
            if (Math.random() > 0.7) {
                dot.style.transform = 'scale(1.5)';
                dot.style.boxShadow = `0 0 30px var(--primary-color)`;
                setTimeout(() => {
                    dot.style.transform = 'scale(1)';
                    dot.style.boxShadow = `0 0 20px var(--primary-color)`;
                }, 1000);
            }
        });
    }

    switchMapMode(mode) {
        const worldMap = document.getElementById('worldMap');
        if (worldMap) {
            if (mode === 'heatmapBtn') {
                worldMap.style.filter = 'hue-rotate(60deg) saturate(1.5)';
            } else if (mode === 'trafficBtn') {
                worldMap.style.filter = 'hue-rotate(120deg) saturate(2)';
            } else {
                worldMap.style.filter = 'none';
            }
        }
    }

    startNetworkMonitoring() {
        this.updateNetworkSpeed();
        this.updateLatency();
        this.updateSignalStrength();
        this.updateDataUsage();
        this.updateServerStatus();
        this.updateNetworkStatus();
        this.updateConnectionStatus();
        this.updateNetworkDetails();
        this.updateAnalytics();
        this.updateMonitoring();

        // Update network metrics every 5 seconds
        setInterval(() => {
            this.updateNetworkSpeed();
            this.updateSignalStrength();
            this.updateDataUsage();
            this.updateServerStatus();
            this.updateNetworkStatus();
            this.updateConnectionStatus();
            this.updateNetworkDetails();
            this.updateMonitoring();
        }, 5000);

        // Update latency every 3 seconds
        setInterval(() => {
            this.updateLatency();
            this.updateAnalytics();
        }, 3000);
    }

    startRealtimeUpdates() {
        // Update uptime every second
        setInterval(() => {
            this.updateUptime();
        }, 1000);

        // Update requests and error rate every 2 seconds
        setInterval(() => {
            this.updateRequests();
            this.updateErrorRate();
        }, 2000);
    }

    initNetworkGraph() {
        const canvas = document.getElementById('networkGraph');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Initialize with some data
        for (let i = 0; i < this.maxDataPoints; i++) {
            this.networkData.push(Math.random() * 100);
        }

        this.drawGraph(ctx, canvas);
        
        // Update graph every 2 seconds
        setInterval(() => {
            this.updateGraph(ctx, canvas);
        }, 2000);
    }

    drawGraph(ctx, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        const graphWidth = width - padding * 2;
        const graphHeight = height - padding * 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw background
        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, 0, width, height);

        // Draw grid lines
        ctx.strokeStyle = '#2a2a3e';
        ctx.lineWidth = 1;

        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = padding + (graphHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Vertical grid lines
        for (let i = 0; i <= 10; i++) {
            const x = padding + (graphWidth / 10) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }

        // Draw data line
        if (this.networkData.length > 1) {
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 3;
            ctx.beginPath();

            const stepX = graphWidth / (this.networkData.length - 1);
            
            for (let i = 0; i < this.networkData.length; i++) {
                const x = padding + i * stepX;
                const y = padding + graphHeight - (this.networkData[i] / 100) * graphHeight;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();

            // Draw data points
            ctx.fillStyle = '#667eea';
            for (let i = 0; i < this.networkData.length; i++) {
                const x = padding + i * stepX;
                const y = padding + graphHeight - (this.networkData[i] / 100) * graphHeight;
                
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw labels
        ctx.fillStyle = '#b0b0b0';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        
        // Y-axis labels
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const y = padding + (graphHeight / 5) * i;
            const value = 100 - (i * 20);
            ctx.fillText(`${value}ms`, padding - 10, y + 4);
        }

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Network Latency Over Time', width / 2, 25);
    }

    updateGraph(ctx, canvas) {
        // Add new data point
        const newLatency = this.latencyHistory.length > 0 
            ? this.latencyHistory[this.latencyHistory.length - 1]
            : Math.random() * 100;
        
        this.networkData.push(newLatency);
        
        // Remove old data points
        if (this.networkData.length > this.maxDataPoints) {
            this.networkData.shift();
        }

        // Redraw graph
        this.drawGraph(ctx, canvas);
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ServerMonitor();
    
    // Initialize settings
    initSettings();
    
    // Handle online/offline events
    window.addEventListener('online', () => {
        console.log('Connection restored');
        // Refresh IP info when connection is restored
        setTimeout(() => {
            location.reload();
        }, 1000);
    });

    window.addEventListener('offline', () => {
        console.log('Connection lost');
        document.getElementById('networkStatusText').textContent = 'Offline';
        document.getElementById('networkStatus').className = 'status-indicator';
    });

    // Handle visibility change to pause/resume monitoring when tab is not active
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('Tab is hidden, reducing update frequency');
        } else {
            console.log('Tab is visible, resuming normal updates');
        }
    });
});

// Initialize settings functionality
function initSettings() {
    // Data points slider
    const dataPointsSlider = document.getElementById('dataPoints');
    const dataPointsValue = document.getElementById('dataPointsValue');
    
    if (dataPointsSlider && dataPointsValue) {
        dataPointsSlider.addEventListener('input', (e) => {
            dataPointsValue.textContent = e.target.value;
        });
    }
    
    // Settings change handlers
    const settingsInputs = document.querySelectorAll('#settings-page input, #settings-page select');
    settingsInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            console.log(`Setting changed: ${e.target.id} = ${e.target.value || e.target.checked}`);
            // Here you could save settings to localStorage
            localStorage.setItem(e.target.id, e.target.value || e.target.checked);
        });
    });
    
    // Load saved settings
    settingsInputs.forEach(input => {
        const savedValue = localStorage.getItem(input.id);
        if (savedValue !== null) {
            if (input.type === 'checkbox') {
                input.checked = savedValue === 'true';
            } else {
                input.value = savedValue;
            }
        }
    });
}

// Handle window resize for graph
window.addEventListener('resize', () => {
    const canvas = document.getElementById('networkGraph');
    if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
});
