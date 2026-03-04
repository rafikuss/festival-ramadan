const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const db = new sqlite3.Database("./database.db", (err) => {
    if (err) {
        console.error("❌ Erreur connexion DB:", err);
    } else {
        console.log("✅ Base de données connectée");
    }
});

const JOURNEES_ARTISTES = [
    { jour: 1,  nom: "djazouli&friends",        genre: "Chaâbi" },
    { jour: 2,  nom: "tikoubaouine",             genre: "Kabyle" },
    { jour: 3,  nom: "groupe el dey",            genre: "Pop/Rock" },
    { jour: 4,  nom: "karaoke ya lil ya 3in",    genre: "Karaoké" },
    { jour: 5,  nom: "karaoke ya zina",          genre: "Karaoké" },
    { jour: 6,  nom: "karaoke n3ichou la vida",  genre: "Karaoké" },
    { jour: 7,  nom: "karaoke el bareh",         genre: "Karaoké" },
    { jour: 8,  nom: "hassiba amrouche",         genre: "Kabyle" },
    { jour: 9,  nom: "m'hamed yacine",           genre: "Chaâbi" },
    { jour: 10, nom: "cheb wahid",               genre: "Raï" },
    { jour: 11, nom: "nawel skander",            genre: "Pop" },
    { jour: 12, nom: "karaoke houbek hekaya",    genre: "Karaoké" },
    { jour: 13, nom: "karaoke ya 9mer",          genre: "Karaoké" },
    { jour: 14, nom: "karaoke kifek enta",       genre: "Karaoké" },
    { jour: 15, nom: "naima dziria",             genre: "Chaâbi" },
    { jour: 16, nom: "mourad djaafri",           genre: "Chaâbi" },
    { jour: 17, nom: "hamidou",                  genre: "Raï" },
    { jour: 18, nom: "karaoke 9ahwa w latay",    genre: "Karaoké" },
    { jour: 19, nom: "karaoke 3amri ma nensak",  genre: "Karaoké" },
    { jour: 20, nom: "karaoke el wada3",         genre: "Karaoké" }
];

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS artistes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT UNIQUE NOT NULL,
            genre TEXT DEFAULT 'Non spécifié'
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS journees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_jour INTEGER UNIQUE NOT NULL,
            artiste_id INTEGER NOT NULL,
            capacite_max INTEGER DEFAULT 5000,
            prix_presentiel REAL DEFAULT 1500,
            prix_en_ligne REAL DEFAULT 1200,
            FOREIGN KEY (artiste_id) REFERENCES artistes(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            journee_id INTEGER NOT NULL,
            type_vente TEXT NOT NULL CHECK(type_vente IN ('presentiel', 'en_ligne')),
            tickets_vendus INTEGER NOT NULL,
            prix_ticket REAL NOT NULL,
            date_vente DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (journee_id) REFERENCES journees(id) ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS historique (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            journee_id INTEGER,
            artiste_nom TEXT,
            type_vente TEXT,
            tickets INTEGER,
            ancien_total INTEGER,
            nouveau_total INTEGER,
            date_action DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.get("SELECT COUNT(*) as count FROM artistes", [], (err, row) => {
        if (err) return console.error(err);

        if (!row || row.count === 0) {
            console.log("🌙 Initialisation des 20 journées...");

            let done = 0;

            JOURNEES_ARTISTES.forEach((item) => {
                db.run(
                    "INSERT INTO artistes (nom, genre) VALUES (?, ?)",
                    [item.nom, item.genre],
                    function (err) {
                        if (err) return console.error("Erreur artiste:", err);

                        const artiste_id = this.lastID;

                        db.run(
                            "INSERT INTO journees (numero_jour, artiste_id) VALUES (?, ?)",
                            [item.jour, artiste_id],
                            function (err2) {
                                if (err2) return console.error("Erreur journée:", err2);

                                done++;
                                if (done === JOURNEES_ARTISTES.length) {
                                    console.log("✅ 20 artistes et 20 journées créés !");
                                }
                            }
                        );
                    }
                );
            });
        } else {
            console.log(`✅ ${row.count} artistes déjà en mémoire`);
        }
    });
});

app.get("/api/journees", (req, res) => {
    db.all(`
        SELECT 
            j.id,
            j.numero_jour,
            j.capacite_max,
            j.prix_presentiel,
            j.prix_en_ligne,
            a.nom as artiste_nom,
            a.genre as artiste_genre,
            IFNULL(SUM(CASE WHEN t.type_vente = 'presentiel' THEN t.tickets_vendus ELSE 0 END), 0) as tickets_presentiel,
            IFNULL(SUM(CASE WHEN t.type_vente = 'en_ligne' THEN t.tickets_vendus ELSE 0 END), 0) as tickets_en_ligne,
            IFNULL(SUM(t.tickets_vendus * t.prix_ticket), 0) as recette_totale
        FROM journees j
        JOIN artistes a ON j.artiste_id = a.id
        LEFT JOIN tickets t ON j.id = t.journee_id
        GROUP BY j.id
        ORDER BY j.numero_jour
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const journees = rows.map(row => ({
            ...row,
            tickets_total: row.tickets_presentiel + row.tickets_en_ligne,
            taux_remplissage: ((row.tickets_presentiel + row.tickets_en_ligne) / row.capacite_max * 100).toFixed(1),
            est_complet: (row.tickets_presentiel + row.tickets_en_ligne) >= row.capacite_max
        }));

        res.json({ success: true, journees });
    });
});

app.get("/api/journees/:jour", (req, res) => {
    db.get(`
        SELECT 
            j.*,
            a.nom as artiste_nom,
            a.genre as artiste_genre,
            IFNULL(SUM(CASE WHEN t.type_vente = 'presentiel' THEN t.tickets_vendus ELSE 0 END), 0) as tickets_presentiel,
            IFNULL(SUM(CASE WHEN t.type_vente = 'en_ligne' THEN t.tickets_vendus ELSE 0 END), 0) as tickets_en_ligne,
            IFNULL(SUM(t.tickets_vendus * t.prix_ticket), 0) as recette_totale
        FROM journees j
        JOIN artistes a ON j.artiste_id = a.id
        LEFT JOIN tickets t ON j.id = t.journee_id
        WHERE j.numero_jour = ?
        GROUP BY j.id
    `, [req.params.jour], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Journée non trouvée" });

        res.json({
            success: true,
            journee: {
                ...row,
                tickets_total: row.tickets_presentiel + row.tickets_en_ligne,
                taux_remplissage: ((row.tickets_presentiel + row.tickets_en_ligne) / row.capacite_max * 100).toFixed(1)
            }
        });
    });
});

app.post("/api/tickets", (req, res) => {
    const { journee_id, type_vente, tickets_vendus, prix_ticket } = req.body;

    if (!journee_id || !type_vente || !tickets_vendus || !prix_ticket) {
        return res.status(400).json({ error: "Données manquantes" });
    }

    db.get(`
        SELECT 
            j.capacite_max,
            a.nom as artiste_nom,
            IFNULL(SUM(t.tickets_vendus), 0) as tickets_actuels
        FROM journees j
        JOIN artistes a ON j.artiste_id = a.id
        LEFT JOIN tickets t ON j.id = t.journee_id
        WHERE j.id = ?
        GROUP BY j.id
    `, [journee_id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Journée non trouvée" });

        const ancien_total = row.tickets_actuels;
        const nouveau_total = ancien_total + parseInt(tickets_vendus);

        if (nouveau_total > row.capacite_max) {
            return res.status(400).json({
                error: `Capacité dépassée ! Max: ${row.capacite_max}`,
                capacite_max: row.capacite_max,
                tickets_actuels: ancien_total,
                places_restantes: row.capacite_max - ancien_total
            });
        }

        db.run(`
            INSERT INTO tickets (journee_id, type_vente, tickets_vendus, prix_ticket)
            VALUES (?, ?, ?, ?)
        `, [journee_id, type_vente, parseInt(tickets_vendus), parseFloat(prix_ticket)], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            db.run(`
                INSERT INTO historique (action, journee_id, artiste_nom, type_vente, tickets, ancien_total, nouveau_total)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, ["VENTE", journee_id, row.artiste_nom, type_vente, parseInt(tickets_vendus), ancien_total, nouveau_total]);

            res.json({
                success: true,
                message: `${tickets_vendus} tickets vendus`,
                ancien_total,
                nouveau_total,
                places_restantes: row.capacite_max - nouveau_total
            });
        });
    });
});

app.get("/api/stats/global", (req, res) => {
    db.get(`
        SELECT 
            COUNT(DISTINCT j.id) as nb_journees,
            SUM(j.capacite_max) as capacite_totale,
            IFNULL(SUM(CASE WHEN t.type_vente = 'presentiel' THEN t.tickets_vendus ELSE 0 END), 0) as total_presentiel,
            IFNULL(SUM(CASE WHEN t.type_vente = 'en_ligne' THEN t.tickets_vendus ELSE 0 END), 0) as total_en_ligne,
            IFNULL(SUM(t.tickets_vendus), 0) as total_tickets,
            IFNULL(SUM(t.tickets_vendus * t.prix_ticket), 0) as recette_totale
        FROM journees j
        LEFT JOIN tickets t ON j.id = t.journee_id
    `, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        const total = row.total_tickets || 0;

        res.json({
            success: true,
            stats: {
                nb_journees: row.nb_journees,
                capacite_totale: row.capacite_totale,
                total_tickets: total,
                total_presentiel: row.total_presentiel || 0,
                total_en_ligne: row.total_en_ligne || 0,
                recette_totale: row.recette_totale || 0,
                taux_remplissage: row.capacite_totale > 0
                    ? (total / row.capacite_totale * 100).toFixed(2)
                    : 0,
                pourcentage_presentiel: total > 0
                    ? ((row.total_presentiel || 0) / total * 100).toFixed(1)
                    : "0",
                pourcentage_en_ligne: total > 0
                    ? ((row.total_en_ligne || 0) / total * 100).toFixed(1)
                    : "0"
            }
        });
    });
});

app.get("/api/stats/classement", (req, res) => {
    db.all(`
        SELECT 
            a.nom as artiste_nom,
            a.genre,
            j.numero_jour,
            IFNULL(SUM(CASE WHEN t.type_vente = 'presentiel' THEN t.tickets_vendus ELSE 0 END), 0) as presentiel,
            IFNULL(SUM(CASE WHEN t.type_vente = 'en_ligne' THEN t.tickets_vendus ELSE 0 END), 0) as en_ligne,
            IFNULL(SUM(t.tickets_vendus), 0) as total_tickets,
            IFNULL(SUM(t.tickets_vendus * t.prix_ticket), 0) as recette
        FROM journees j
        JOIN artistes a ON j.artiste_id = a.id
        LEFT JOIN tickets t ON j.id = t.journee_id
        GROUP BY j.id
        ORDER BY total_tickets DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, classement: rows });
    });
});

app.get("/api/stats/classement-presentiel", (req, res) => {
    db.all(`
        SELECT 
            a.nom as artiste_nom,
            j.numero_jour,
            IFNULL(SUM(CASE WHEN t.type_vente = 'presentiel' THEN t.tickets_vendus ELSE 0 END), 0) as presentiel,
            IFNULL(SUM(t.tickets_vendus * t.prix_ticket), 0) as recette
        FROM journees j
        JOIN artistes a ON j.artiste_id = a.id
        LEFT JOIN tickets t ON j.id = t.journee_id
        GROUP BY j.id
        ORDER BY presentiel DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, classement: rows });
    });
});

app.get("/api/stats/classement-en-ligne", (req, res) => {
    db.all(`
        SELECT 
            a.nom as artiste_nom,
            j.numero_jour,
            IFNULL(SUM(CASE WHEN t.type_vente = 'en_ligne' THEN t.tickets_vendus ELSE 0 END), 0) as en_ligne,
            IFNULL(SUM(t.tickets_vendus * t.prix_ticket), 0) as recette
        FROM journees j
        JOIN artistes a ON j.artiste_id = a.id
        LEFT JOIN tickets t ON j.id = t.journee_id
        GROUP BY j.id
        ORDER BY en_ligne DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, classement: rows });
    });
});

app.get("/api/historique", (req, res) => {
    db.all(`
        SELECT * FROM historique
        ORDER BY date_action DESC
        LIMIT 100
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, historique: rows });
    });
});

app.get("/api/artistes", (req, res) => {
    db.all("SELECT * FROM artistes ORDER BY id", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, artistes: rows });
    });
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views/index.html"));
});

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║        🌙 FESTIVAL RAMADAN 1447H - SERVEUR DÉMARRÉ 🌙     ║
╠════════════════════════════════════════════════════════════╣
║  URL       : http://localhost:${PORT}                        ║
║  Database  : database.db                                   ║
║  Journées  : 20 jours / 20 artistes                       ║
║  Mémoire   : ✅ Persistante                                ║
╚════════════════════════════════════════════════════════════╝
    `);
});

process.on('SIGINT', () => {
    db.close(() => {
        console.log('\n💾 Base de données fermée');
        process.exit(0);
    });
});