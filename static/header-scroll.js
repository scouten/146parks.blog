function resizeHeaderOnScroll() {
    const distanceY = window.pageYOffset || document.documentElement.scrollTop,
    shrinkOn = 40,
    titleAppear = 415,
    headerEl = document.getElementById('header');
    
    if (distanceY > titleAppear) {
        headerEl.classList.add("add-title");
    } else {
        headerEl.classList.remove("add-title");
    }

    if (distanceY > shrinkOn) {
        headerEl.classList.add("smaller");
    } else {
        headerEl.classList.remove("smaller");
    }
}
  
window.addEventListener('scroll', resizeHeaderOnScroll);
