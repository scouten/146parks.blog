function addMiniHeaderOnScroll() {
    const distanceY = window.pageYOffset || document.documentElement.scrollTop;
    const miniHeader = document.getElementById('mini-header');
    
    if (distanceY > 430) {
        miniHeader.classList.add("add-title");
    } else {
        miniHeader.classList.remove("add-title");
    }

    if (distanceY > 120) {
        miniHeader.classList.add("active");
    } else {
        miniHeader.classList.remove("active");
    }

    if (distanceY > 20) {
        miniHeader.classList.add("visible");
    } else {
        miniHeader.classList.remove("visible");
    }
}
  
window.addEventListener('scroll', addMiniHeaderOnScroll);
