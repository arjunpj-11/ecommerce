document.addEventListener('DOMContentLoaded', function() {
    initSalesChart();
    initSidebarToggle();
    initLogout();
    loadTopCategories();
    handleResponsiveLayout();
});

let salesChart = null;

// Handle responsive layout changes
function handleResponsiveLayout() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const toggleBtn = document.querySelector('.toggle-btn');
    
    function adjustLayout() {
        if (window.innerWidth <= 767) {
            // On mobile, don't adjust margin automatically
            mainContent.style.marginLeft = '0';
            // Show toggle button
            toggleBtn.style.display = 'flex';
        } else {
            // On desktop, always show sidebar
            sidebar.classList.add('active');
            mainContent.style.marginLeft = `${sidebar.offsetWidth}px`;
            // Hide toggle button
            toggleBtn.style.display = 'none';
        }
    }
    
    window.addEventListener('resize', adjustLayout);
    adjustLayout();
}

async function loadTopCategories() {
    try {
        const response = await fetch('/admin/dashboard/top-categories');
        const categories = await response.json();
        
        if (!categories || categories.length === 0) {
            document.getElementById('top-categories-container').innerHTML = `
                <div class="no-data">No category data available</div>
            `;
            return;
        }
        
        const container = document.getElementById('top-categories-container');
        container.innerHTML = categories.map(category => `
            <div class="category-card">
                <div class="category-header">
                    <h3>${category.name}</h3>
                    <span class="sales-value">₹${(category.totalSales || 0).toLocaleString()}</span>
                </div>
                <div class="progress-bar">
                    <div class="fill" style="width: ${category.percentage || 0}%"></div>
                </div>
                <div class="subcategories">
                    ${(category.subcategories || []).map(sub => `
                        <div class="subcategory">
                            <div class="sub-header">
                                <span>${sub.name}</span>
                                <span class="sub-sales">₹${(sub.sales || 0).toLocaleString()}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="fill" style="width: ${sub.percentage || 0}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading top categories:', error);
        document.getElementById('top-categories-container').innerHTML = `
            <div class="no-data">Error loading categories</div>
        `;
    }
}

async function initSalesChart() {
    const timeframeSelect = document.getElementById('timeframe-select');
    const chartContainer = document.querySelector('.chart-container');
    
    async function updateChart() {
        try {
            const response = await fetch(`/admin/dashboard/sales-chart?timeframe=${timeframeSelect.value}`);
            const chartData = await response.json();

            // Get the canvas context
            const canvas = document.getElementById('salesChart');
            const ctx = canvas.getContext('2d');
            
            // Destroy previous chart instance if it exists
            if (salesChart) {
                salesChart.destroy();
            }
            
            // Ensure canvas dimensions match container
            canvas.width = chartContainer.clientWidth;
            canvas.height = chartContainer.clientHeight;
            
            // Responsive font size based on screen width
            const fontSize = window.innerWidth < 768 ? 10 : 12;
            
            salesChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartData.map(d => d.label),
                    datasets: [{
                        label: 'Sales (₹)',
                        data: chartData.map(d => d.value),
                        backgroundColor: 'rgba(234, 179, 8, 0.8)',
                        borderColor: '#eab308',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: { 
                                color: '#f3f4f6',
                                font: {
                                    size: fontSize
                                }
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: '#1f2937',
                            titleColor: '#f3f4f6',
                            bodyColor: '#f3f4f6',
                            borderColor: '#374151',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    return '₹' + context.raw.toLocaleString();
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { 
                                color: 'rgba(255, 255, 255, 0.1)' 
                            },
                            ticks: {
                                color: '#f3f4f6',
                                font: {
                                    size: fontSize
                                },
                                callback: value => '₹' + value.toLocaleString()
                            }
                        },
                        x: {
                            grid: { 
                                color: 'rgba(255, 255, 255, 0.1)' 
                            },
                            ticks: { 
                                color: '#f3f4f6',
                                font: {
                                    size: fontSize
                                },
                                maxRotation: 45,
                                minRotation: 45
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        } catch (error) {
            console.error('Error updating sales chart:', error);
            document.querySelector('.chart-section').innerHTML = `
                <div class="no-data">Error loading sales chart</div>
            `;
        }
    }

    timeframeSelect.addEventListener('change', updateChart);
    
    // Handle chart resizing when window resizes
    window.addEventListener('resize', () => {
        if (salesChart) {
            // Resize the canvas to match container
            const canvas = document.getElementById('salesChart');
            canvas.width = chartContainer.clientWidth;
            canvas.height = chartContainer.clientHeight;
            
            // Update the chart
            salesChart.resize();
        }
    });
    
    // Initial chart update
    updateChart();
}

function initSidebarToggle() {
    const toggleBtn = document.querySelector('.toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    // Function to update toggle button visibility
    function updateToggleButtonVisibility() {
        if (window.innerWidth <= 767) {
            // On mobile, show toggle button only when sidebar is hidden
            toggleBtn.style.display = sidebar.classList.contains('active') ? 'none' : 'flex';
        } else {
            // On desktop, always hide toggle button
            toggleBtn.style.display = 'none';
        }
    }

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('active');
        
        // Adjust margin based on sidebar state
        if (window.innerWidth <= 767) {
            // On mobile, just toggle the sidebar visibility without adjusting margin
            // The sidebar will overlay on top of content
        } else {
            // On larger screens, adjust the margin
            mainContent.style.marginLeft = sidebar.classList.contains('active') ? 
                `${sidebar.offsetWidth}px` : '0';
        }
        
        // Update toggle button visibility
        updateToggleButtonVisibility();
    });

    // Close sidebar when clicking outside on small screens
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 767 && 
            !sidebar.contains(e.target) && 
            !toggleBtn.contains(e.target) && 
            sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            updateToggleButtonVisibility();
        }
    });
    
    // Prevent click inside sidebar from closing it
    sidebar.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Update toggle button visibility on resize
    window.addEventListener('resize', updateToggleButtonVisibility);
    
    // Initial setup
    updateToggleButtonVisibility();
}

function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/admin/dashboard/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin'
            });

            const data = await response.json();
            
            if (data.success) {
                window.location.href = data.redirect;
            } else {
                throw new Error(data.message || 'Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('An error occurred during logout. Please try again.');
        }
    });
}