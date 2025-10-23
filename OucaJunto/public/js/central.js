// define os elementos do DOM a serem utilizados
const btn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');

/* fallback: evita erro quando elementos não existem no DOM */
if (!btn || !sidebar) {
    console.warn('hamburgerBtn ou sidebar não encontrados — script de toggle abortado.');
} else {

    // Acessibilidade inicial
    btn.setAttribute('aria-controls', 'sidebar');
    btn.setAttribute('aria-expanded', 'false');
    sidebar.setAttribute('aria-hidden', 'true');
    sidebar.tabIndex = -1;

    // abre o sidebar
    const toggleSidebar = () => {
        const isOpen = sidebar.classList.toggle('open');
        btn.classList.toggle('open', isOpen);
        btn.setAttribute('aria-expanded', String(isOpen));
        sidebar.setAttribute('aria-hidden', String(!isOpen));
    };

    // clique no botão hambuguer abre/fecha
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar();
    });

}