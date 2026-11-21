const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
const exploreButton = document.querySelector('.search');
const spaceVideo = document.querySelector('.space-background');

exploreButton?.addEventListener('click', () => {
    document.querySelector('#explorar')?.scrollIntoView({ behavior: 'smooth' });
});

if (window.gsap && spaceVideo && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.to(spaceVideo, {
        scale: 1.1,
        duration: 36,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        transformOrigin: '50% 50%'
    });

    gsap.to('.space-atmosphere', {
        opacity: 0.76,
        duration: 9,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
    });
}

if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
        const isOpen = menuButton.getAttribute('aria-expanded') === 'true';

        menuButton.setAttribute('aria-expanded', String(!isOpen));
        menuButton.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
        mobileNav.classList.toggle('is-open', !isOpen);
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            menuButton.setAttribute('aria-expanded', 'false');
            menuButton.setAttribute('aria-label', 'Abrir menu');
            mobileNav.classList.remove('is-open');
        });
    });
}
