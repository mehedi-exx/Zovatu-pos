// Menu Toggle Functionality

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');

    // Function to toggle sidebar visibility
    function toggleSidebar() {
        sidebar.classList.toggle('visible');
        mainContent.classList.toggle('expanded');
    }

    // Add click event listener to the menu toggle button
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }

    // Initially hide sidebar on smaller screens
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('visible');
        mainContent.classList.remove('expanded');
    } else {
        // For larger screens, ensure sidebar is visible by default
        sidebar.classList.add('visible');
        mainContent.classList.add('expanded');
    }

    // Adjust sidebar visibility on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('visible');
            mainContent.classList.remove('expanded');
        } else {
            sidebar.classList.add('visible');
            mainContent.classList.add('expanded');
        }
    });
});


