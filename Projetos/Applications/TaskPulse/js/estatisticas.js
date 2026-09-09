

// ==================== MENU ====================

const btnMenu = document.querySelector("#btn-menu");
const menu = document.querySelector("#menu");
const iconMenu = btnMenu.querySelector("i");


btnMenu.addEventListener("click", () => {
    menu.classList.toggle("ativo");
    iconMenu.classList.toggle("fa-bars");
    iconMenu.classList.toggle("fa-xmark");

    overlay.classList.toggle("ativo", menu.classList.contains("ativo"));
});



const indicadorConluidas = document.querySelector("#indicador-concluidas")
const indicadorPendentes = document.querySelector("#indicador-concluidas")
const indicadorAtrasadas= document.querySelector("#indicador-concluidas")
const indicadorAndamento = document.querySelector("#indicador-concluidas")

const indicadores = {
    conluidas: indicadorConluidas,
    pendentes: indicadorPendentes,
    atrasadas:indicadorAtrasadas,
    andamento:indicadorAndamento
}


const ctx = document.getElementById("tasksChart");
new Chart(ctx, {
    type: "bar",

    data: {
        labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],

        datasets: [
            {
                data: [8, 12, 6, 14, 10, 4, 2],
                backgroundColor: "#6366F1",
                borderRadius: 6,
                borderSkipped: false,
                barThickness: 34
            },
            {
                data: [5, 9, 11, 7, 8, 3, 1],
                backgroundColor: "#D1D5DB",
                borderRadius: 6,
                borderSkipped: false,
                barThickness: 34
            }
        ]
    },

    options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: {
                display: false
            },

            tooltip: {
                enabled: true
            }
        },

        scales: {
            x: {
                grid: {
                    display: false
                },

                border: {
                    display: false
                },

                ticks: {
                    color: "#9699A8",
                    font: {
                        size: 14
                    }
                }
            },

            y: {
                beginAtZero: true,
                max: 15,

                ticks: {
                    stepSize: 5,
                    color: "#9699A8",
                    font: {
                        size: 14
                    }
                },

                grid: {
                    color: "#E5E7EB"
                },

                border: {
                    display: false
                }
            }
        }
    }
});
