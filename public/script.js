let chartGlobal;

async function loadArtistes() {
    const res = await fetch("/api/artistes");
    const artistes = await res.json();

    const select = document.getElementById("artiste");
    select.innerHTML = "";

    artistes.forEach(a => {
        select.innerHTML += `<option value="${a.id}">${a.nom}</option>`;
    });
}

document.getElementById("ticketForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
        date: document.getElementById("date").value,
        artiste_id: document.getElementById("artiste").value,
        type_vente: document.getElementById("type_vente").value,
        tickets_vendus: parseInt(document.getElementById("tickets_vendus").value),
        prix_ticket: parseFloat(document.getElementById("prix_ticket").value)
    };

    await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    loadStats();
});

async function loadStats() {
    const res = await fetch("/api/stats/global");
    const stats = await res.json();

    const ctx = document.getElementById("chartGlobal");

    if (chartGlobal) chartGlobal.destroy();

    chartGlobal = new Chart(ctx, {
        type: "bar",
        data: {
            labels: stats.map(s => s.nom),
            datasets: [{
                label: "Total Tickets (Initial + Ajouts)",
                data: stats.map(s => s.total)
            }]
        }
    });
}

loadArtistes();
loadStats();