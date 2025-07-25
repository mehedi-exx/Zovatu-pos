// Menu Toggle Functionality

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const closeSidebar = document.getElementById('closeSidebar');

    // Function to open sidebar
    function openSidebar() {
        if (sidebar) {
            sidebar.classList.add('visible');
        }
        if (mainContent) {
            mainContent.classList.add('expanded');
        }
    }

    // Function to close sidebar
    function closeSidebarFunc() {
        if (sidebar) {
            sidebar.classList.remove('visible');
        }
        if (mainContent) {
            mainContent.classList.remove('expanded');
        }
    }

    // Function to toggle sidebar visibility
    function toggleSidebar() {
        if (sidebar && sidebar.classList.contains('visible')) {
            closeSidebarFunc();
        } else {
            openSidebar();
        }
    }

    // Add click event listener to the menu toggle button
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }

    // Add click event listener to the close button
    if (closeSidebar) {
        closeSidebar.addEventListener('click', closeSidebarFunc);
    }

    // Close sidebar when clicking outside of it
    document.addEventListener('click', function(event) {
        if (sidebar && sidebar.classList.contains('visible') && 
            !sidebar.contains(event.target) && 
            !menuToggle.contains(event.target)) {
            closeSidebarFunc();
        }
    });

    // Initially hide sidebar
    if (sidebar) {
        sidebar.classList.remove('visible');
    }
    if (mainContent) {
        mainContent.classList.remove('expanded');
    }

    // Adjust sidebar visibility on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            closeSidebarFunc();
        }
    });
});

