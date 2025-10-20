(function() {
  console.log('=== MOBILE MENU SCRIPT EXECUTING ===');
  
  function initMenu() {
    const menuButton = document.querySelector('button[aria-controls="header-sidebar-menu"]');
    const menuDrawer = document.getElementById('header-sidebar-menu');
    const closeButton = menuDrawer ? menuDrawer.querySelector('button[is="close-button"]') : null;
    
    console.log('Menu button found:', !!menuButton);
    console.log('Menu drawer found:', !!menuDrawer);
    console.log('Close button found:', !!closeButton);
    
    if (!menuButton || !menuDrawer) {
      console.error('MENU ELEMENTS NOT FOUND - retrying in 100ms');
      setTimeout(initMenu, 100);
      return;
    }
    
    function openMenu() {
      console.log('Opening menu...');
      menuDrawer.classList.add('drawer--open');
      document.body.classList.add('drawer-open');
      console.log('Menu opened');
    }
    
    function closeMenu() {
      console.log('Closing menu...');
      menuDrawer.classList.remove('drawer--open');
      document.body.classList.remove('drawer-open');
      console.log('Menu closed');
    }
    
    menuButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Menu button clicked');
      openMenu();
    });
    
    if (closeButton) {
      closeButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Close button clicked');
        closeMenu();
      });
    }
    
    const overlay = menuDrawer.querySelector('.drawer__overlay');
    if (overlay) {
      overlay.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Overlay clicked');
        closeMenu();
      });
    }
    
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && menuDrawer.classList.contains('drawer--open')) {
        console.log('ESC pressed - closing menu');
        closeMenu();
      }
    });
    
    console.log('=== MOBILE MENU READY ===');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMenu);
  } else {
    initMenu();
  }
})();
