function resizeHeaderOnScroll() {
    const distanceY = window.pageYOffset || document.documentElement.scrollTop,
    shrinkOn = 40,
    headerEl = document.getElementById('header');
    
    if (distanceY > shrinkOn) {
        headerEl.classList.add("smaller");
    } else {
        headerEl.classList.remove("smaller");
    }
}
  
window.addEventListener('scroll', resizeHeaderOnScroll);
