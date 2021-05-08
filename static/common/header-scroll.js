function headerScroll() {
    const distanceY = window.pageYOffset || document.documentElement.scrollTop;
    const miniHeader = document.getElementById('miniheader');
    
    if (distanceY > 430) {
        miniHeader.classList.add("show-title");
    } else {
        miniHeader.classList.remove("show-title");
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
  
window.addEventListener('scroll', headerScroll);
