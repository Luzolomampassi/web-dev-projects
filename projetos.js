const initializeProjectFilters = () => {
    const filterButtons = [...document.querySelectorAll(".btn-filtros")];
    const projectCards = [...document.querySelectorAll(".cards_projets .item")];
    const searchInput = document.querySelector("#search");
    const noResults = document.querySelector(".no-results");

    if (projectCards.length === 0 || !searchInput || !noResults) {
        return;
    }

    let selectedCategory = "todos";

    filterButtons.forEach((button) => {
        const isSelected = button.dataset.categoria === selectedCategory;
        button.classList.toggle("is-active", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
    });

    const normalizeText = (value) => value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase()
        .trim();

    const updateProjects = () => {
        const searchTerm = normalizeText(searchInput.value);
        let visibleProjects = 0;

        projectCards.forEach((project) => {
            const matchesCategory = selectedCategory === "todos" ||
                project.dataset.categoria === selectedCategory;
            const projectName = normalizeText(project.querySelector("h3")?.textContent ?? "");
            const matchesSearch = projectName.includes(searchTerm);
            const isVisible = matchesCategory && matchesSearch;

            project.hidden = !isVisible;
            visibleProjects += Number(isVisible);
        });

        noResults.hidden = visibleProjects > 0;
    };

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            selectedCategory = button.dataset.categoria ?? "todos";

            filterButtons.forEach((filterButton) => {
                const isSelected = filterButton === button;
                filterButton.classList.toggle("is-active", isSelected);
                filterButton.setAttribute("aria-pressed", String(isSelected));
            });

            updateProjects();
        });
    });

    searchInput.addEventListener("input", updateProjects);

    const completedProjects = document.querySelector(".projetos-completos");
    if (completedProjects) {
        completedProjects.textContent = String(projectCards.length);
    }

    const technologyCount = document.querySelector('[data-projet="main-technologies"]');
    if (technologyCount) {
        const technologies = new Set(
            projectCards.flatMap((project) =>
                [...project.querySelectorAll(".badge")].map((badge) => normalizeText(badge.textContent))
            )
        );
        technologyCount.textContent = String(technologies.size);
    }

    updateProjects();
};

initializeProjectFilters();
