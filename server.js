const express = require("express");
const initSqlJs = require("sql.js");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const cookieSession = require("cookie-session");

const app = express();
const PORT = process.env.PORT || 3000;

/* ═══════════════════════════════════════════════════════════════
   🔒 MOT DE PASSE - CHANGEZ-LE ICI
=================================================================== */

const MOT_DE_PASSE = "ramadan1447";

/* ═══════════════════════════════════════════════════════════════ */

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(cookieSession({
    name: 'festival_session',
    keys: ['ramadan_secret_key_2025_festival'],
    maxAge: 24 * 60 * 60 * 1000  // 24 heures
}));

const DB_PATH = path.join(__dirname, "database.db");
let db;

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

/* ═══════════════════════════════════════════════════════════════
   SAUVEGARDE BASE
=================================================================== */

function sauvegarderDB() {
    try {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
    } catch (err) {
        console.error("Erreur sauvegarde:", err);
    }
}

setInterval(sauvegarderDB, 30000);

/* ═══════════════════════════════════════════════════════════════
   FONCTIONS SQL
=================================================================== */

function queryAll(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
    } catch (err) {
        console.error("Erreur SQL:", err);
        return [];
    }
}

function queryOne(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        let row = null;
        if (stmt.step()) row = stmt.getAsObject();
        stmt.free();
        return row;
    } catch (err) {
        console.error("Erreur SQL:", err);
        return null;
    }
}

function runSQL(sql, params = []) {
    try {
        db.run(sql, params);
        sauvegarderDB();
        return true;
    } catch (err) {
        console.error("Erreur SQL:", err);
        return false;
    }
}

/* ═══════════════════════════════════════════════════════════════
   🔒 PAGE DE CONNEXION
=================================================================== */

const PAGE_LOGIN = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔒 Connexion - Festival Ramadan 1447H</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Cairo', sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: #ecf0f1;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .login-container {
            background: rgba(26, 26, 46, 0.95);
            padding: 50px 40px;
            border-radius: 20px;
            border: 2px solid #D4AF37;
            box-shadow: 0 0 40px rgba(212, 175, 55, 0.3);
            text-align: center;
            width: 90%;
            max-width: 450px;
        }

        .moon {
            font-size: 4rem;
            margin-bottom: 15px;
            animation: glow 2s ease-in-out infinite;
        }

        @keyframes glow {
            0%, 100% { text-shadow: 0 0 20px rgba(212,175,55,0.5); }
            50% { text-shadow: 0 0 40px rgba(212,175,55,0.8); }
        }

        h1 {
            color: #D4AF37;
            font-size: 1.8rem;
            margin-bottom: 10px;
        }

        .subtitle {
            color: #ecf0f1;
            opacity: 0.7;
            margin-bottom: 30px;
            font-size: 0.95rem;
        }

        .form-group {
            margin-bottom: 25px;
            text-align: left;
        }

        label {
            display: block;
            color: #D4AF37;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 0.95rem;
        }

        input[type="password"] {
            width: 100%;
            padding: 15px;
            border: 2px solid rgba(212, 175, 55, 0.3);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.05);
            color: #ecf0f1;
            font-family: 'Cairo', sans-serif;
            font-size: 1.1rem;
            text-align: center;
            letter-spacing: 3px;
            transition: all 0.3s;
        }

        input[type="password"]:focus {
            outline: none;
            border-color: #D4AF37;
            box-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
        }

        input[type="password"]::placeholder {
            letter-spacing: 0;
            color: rgba(255,255,255,0.3);
        }

        .btn-login {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #D4AF37, #B8960F);
            color: #1a1a2e;
            border: none;
            border-radius: 12px;
            font-family: 'Cairo', sans-serif;
            font-weight: 700;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s;
        }

        .btn-login:hover {
            transform: translateY(-3px);
            box-shadow: 0 0 25px rgba(212, 175, 55, 0.5);
        }

        .error-msg {
            background: rgba(231, 76, 60, 0.2);
            border: 1px solid #e74c3c;
            color: #e74c3c;
            padding: 12px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-weight: 600;
            display: DISPLAY_ERROR;
        }

        .footer {
            margin-top: 30px;
            opacity: 0.5;
            font-size: 0.85rem;
        }

        .lanterns {
            font-size: 1.5rem;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="moon">🌙</div>
        <h1>Festival Ramadan 1447H</h1>
        <p class="subtitle">🔒 Accès sécurisé - Entrez le mot de passe</p>

        <div class="error-msg">
            ❌ Mot de passe incorrect
        </div>

        <form method="POST" action="/login">
            <div class="form-group">
                <label>🔑 Mot de passe</label>
                <input type="password" name="password" placeholder="Entrez le mot de passe" required autofocus>
            </div>

            <button type="submit" class="btn-login">
                🔓 Entrer
            </button>
        </form>

        <div class="footer">
            <p>رمضان مبارك</p>
            <div class="lanterns">🏮✨🏮</div>
        </div>
    </div>
</body>
</html>
`;

/* ═══════════════════════════════════════════════════════════════
   🔒 ROUTES DE CONNEXION
=================================================================== */

// Page de connexion
app.get("/login", (req, res) => {
    const html = PAGE_LOGIN.replace("DISPLAY_ERROR", "none");
    res.send(html);
});

// Traitement du mot de passe
app.post("/login", (req, res) => {
    const { password } = req.body;

    if (password === MOT_DE_PASSE) {
        // Mot de passe correct
        req.session.authenticated = true;
        res.redirect("/");
    } else {
        // Mot de passe incorrect
        const html = PAGE_LOGIN.replace("DISPLAY_ERROR", "block");
        res.send(html);
    }
});

// Déconnexion
app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/login");
});

/* ═══════════════════════════════════════════════════════════════
   🔒 MIDDLEWARE DE PROTECTION
=================================================================== */

function proteger(req, res, next) {
    // Pages autorisées sans mot de passe
    if (req.path === "/login") return next();

    // Vérifier la session
    if (req.session && req.session.authenticated) {
        return next();
    }

    // API : retourner erreur 401
    if (req.path.startsWith("/api/")) {
        return res.status(401).json({ error: "Non autorisé. Connectez-vous." });
    }

    // Pages : rediriger vers login
    res.redirect("/login");
}

// Appliquer la protection à TOUTES les routes
app.use(proteger);

/* ═══════════════════════════════════════════════════════════════
   INITIALISER LA BASE
=================================================================== */

async function initialiserDB() {
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
        console.log("✅ Base de données chargée");
    } else {
        db = new SQL.Database();
        console.log("✅ Nouvelle base de données créée");
    }

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
            prix_en_ligne REAL DEFAULT 1200
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            journee_id INTEGER NOT NULL,
            type_vente TEXT NOT NULL,
            tickets_vendus INTEGER NOT NULL,
            prix_ticket REAL NOT NULL,
            date_vente DATETIME DEFAULT CURRENT_TIMESTAMP
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

    const result = db.exec("SELECT COUNT(*) as count FROM artistes");
    const count = result[0].values[0][0];

    if (count === 0) {
        console.log("🌙 Initialisation des 20 journées...");

        JOURNEES_ARTISTES.forEach((item) => {
            db.run("INSERT INTO artistes (nom, genre) VALUES (?, ?)", [item.nom, item.genre]);
            const artisteResult = db.exec("SELECT last_insert_rowid() as id");
            const artiste_id = artisteResult[0].values[0][0];
            db.run("INSERT INTO journees (numero_jour, artiste_id) VALUES (?, ?)", [item.jour, artiste_id]);
        });

        sauvegarderDB();
        console.log("✅ 20 artistes et 20 journées créés !");
    } else {
        console.log(`✅ ${count} artistes déjà en mémoire`);
    }

    demarrerServeur();
}

/* ═══════════════════════════════════════════════════════════════
   ROUTES API (PROTÉGÉES)
=================================================================== */

function demarrerServeur() {

    app.get("/api/journees", (req, res) => {
        const rows = queryAll(`
            SELECT 
                j.id, j.numero_jour, j.capacite_max, j.prix_presentiel, j.prix_en_ligne,
                a.nom as artiste_nom, a.genre as artiste_genre,
                IFNULL(SUM(CASE WHEN t.type_vente = 'presentiel' THEN t.tickets_vendus ELSE 0 END), 0) as tickets_presentiel,
                IFNULL(SUM(CASE WHEN t.type_vente = 'en_ligne' THEN t.tickets_vendus ELSE 0 END), 0) as tickets_en_ligne,
                IFNULL(SUM(t.tickets_vendus * t.prix_ticket), 0) as recette_totale
            FROM journees j
            JOIN artistes a ON j.artiste_id = a.id
            LEFT JOIN tickets t ON j.id = t.journee_id
            GROUP BY j.id
            ORDER BY j.numero_jour
        `);

        const journees = rows.map(row => ({
            ...row,
            tickets_total: row.tickets_presentiel + row.tickets_en_ligne,
            taux_remplissage: ((row.tickets_presentiel + row.tickets_en_ligne) / row.capacite_max * 100).toFixed(1),
            est_complet: (row.tickets_presentiel + row.tickets_en_ligne) >= row.capacite_max
        }));

        res.json({ success: true, journees });
    });

    app.get("/api/journees/:jour", (req, res) => {
        const row = queryOne(`
            SELECT j.*, a.nom as artiste_nom, a.genre as artiste_genre,
                IFNULL(SUM(CASE WHEN t.type_vente = 'presentiel' THEN t.tickets_vendus ELSE 0 END), 0) as tickets_presentiel,
                IFNULL(SUM(CASE WHEN t.type_vente = 'en_ligne' THEN t.tickets_vendus ELSE 0 END), 0) as tickets_en_ligne,
                IFNULL(SUM(t.tickets_vendus * t.prix_ticket), 0) as recette_totale
            FROM journees j
            JOIN artistes a ON j.artiste_id = a.id
            LEFT JOIN tickets t ON j.id = t.journee_id
            WHERE j.numero_jour = ?
            GROUP BY j.id
        `, [parseInt(req.params.jour)]);

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

    app.post("/api/tickets", (req, res) => {
        const { journee_id, type_vente, tickets_vendus, prix_ticket } = req.body;

        if (!journee_id || !type_vente || !tickets_vendus || !prix_ticket) {
            return res.status(400).json({ error: "Données manquantes" });
        }

        const row = queryOne(`
            SELECT j.capacite_max, a.nom as artiste_nom,
                IFNULL(SUM(t.tickets_vendus), 0) as tickets_actuels
            FROM journees j
            JOIN artistes a ON j.artiste_id = a.id
            LEFT JOIN tickets t ON j.id = t.journee_id
            WHERE j.id = ?
            GROUP BY j.id
        `, [parseInt(journee_id)]);

        if (!row) return res.status(404).json({ error: "Journée non trouvée" });

        const ancien_total = row.tickets_actuels;
        const nouveau_total = ancien_total + parseInt(tickets_vendus);

        if (nouveau_total > row.capacite_max) {
            return res.status(400).json({
                error: `Capacité dépassée ! Max: ${row.capacite_max}`,
                places_restantes: row.capacite_max - ancien_total
            });
        }

        runSQL(
            "INSERT INTO tickets (journee_id, type_vente, tickets_vendus, prix_ticket) VALUES (?, ?, ?, ?)",
            [parseInt(journee_id), type_vente, parseInt(tickets_vendus), parseFloat(prix_ticket)]
        );

        runSQL(
            "INSERT INTO historique (action, journee_id, artiste_nom, type_vente, tickets, ancien_total, nouveau_total) VALUES (?, ?, ?, ?, ?, ?, ?)",
            ["VENTE", parseInt(journee_id), row.artiste_nom, type_vente, parseInt(tickets_vendus), ancien_total, nouveau_total]
        );

        res.json({
            success: true,
            message: `${tickets_vendus} tickets vendus`,
            ancien_total,
            nouveau_total,
            places_restantes: row.capacite_max - nouveau_total
        });
    });

    app.get("/api/stats/global", (req, res) => {
        const row = queryOne(`
            SELECT COUNT(DISTINCT j.id) as nb_journees, SUM(j.capacite_max) as capacite_totale,
                IFNULL(SUM(CASE WHEN t.type_vente = 'presentiel' THEN t.tickets_vendus ELSE 0 END), 0) as total_presentiel,
                IFNULL(SUM(CASE WHEN t.type_vente = 'en_ligne' THEN t.tickets_vendus ELSE 0 END), 0) as total_en_ligne,
                IFNULL(SUM(t.tickets_vendus), 0) as total_tickets,
                IFNULL(SUM(t.tickets_vendus * t.prix_ticket), 0) as recette_totale
            FROM journees j LEFT JOIN tickets t ON j.id = t.journee_id
        `);

        const total = row ? row.total_tickets || 0 : 0;

        res.json({
            success: true,
            stats: {
                nb_journees: row ? row.nb_journees : 0,
                capacite_totale: row ? row.capacite_totale : 0,
                total_tickets: total,
                total_presentiel: row ? row.total_presentiel || 0 : 0,
                total_en_ligne: row ? row.total_en_ligne || 0 : 0,
                recette_totale: row ? row.recette_totale || 0 : 0,
                pourcentage_presentiel: total > 0 ? ((row.total_presentiel || 0) / total * 100).toFixed(1) : "0",
                pourcentage_en_ligne: total > 0 ? ((row.total_en_ligne || 0) / total * 100).toFixed(1) : "0"
            }
        });
    });

    app.get("/api/stats/classement", (req, res) => {
        const rows = queryAll(`
            SELECT a.nom as artiste_nom, a.genre, j.numero_jour,
                IFNULL(SUM(CASE WHEN t.type_vente = 'presentiel' THEN t.tickets_vendus ELSE 0 END), 0) as presentiel,
                IFNULL(SUM(CASE WHEN t.type_vente = 'en_ligne' THEN t.tickets_vendus ELSE 0 END), 0) as en_ligne,
                IFNULL(SUM(t.tickets_vendus), 0) as total_tickets,
                IFNULL(SUM(t.tickets_vendus * t.prix_ticket), 0) as recette
            FROM journees j JOIN artistes a ON j.artiste_id = a.id
            LEFT JOIN tickets t ON j.id = t.journee_id
            GROUP BY j.id ORDER BY total_tickets DESC
        `);
        res.json({ success: true, classement: rows });
    });

    app.get("/api/stats/classement-presentiel", (req, res) => {
        const rows = queryAll(`
            SELECT a.nom as artiste_nom, j.numero_jour,
                IFNULL(SUM(CASE WHEN t.type_vente = 'presentiel' THEN t.tickets_vendus ELSE 0 END), 0) as presentiel,
                IFNULL(SUM(t.tickets_vendus * t.prix_ticket), 0) as recette
            FROM journees j JOIN artistes a ON j.artiste_id = a.id
            LEFT JOIN tickets t ON j.id = t.journee_id
            GROUP BY j.id ORDER BY presentiel DESC
        `);
        res.json({ success: true, classement: rows });
    });

    app.get("/api/stats/classement-en-ligne", (req, res) => {
        const rows = queryAll(`
            SELECT a.nom as artiste_nom, j.numero_jour,
                IFNULL(SUM(CASE WHEN t.type_vente = 'en_ligne' THEN t.tickets_vendus ELSE 0 END), 0) as en_ligne,
                IFNULL(SUM(t.tickets_vendus * t.prix_ticket), 0) as recette
            FROM journees j JOIN artistes a ON j.artiste_id = a.id
            LEFT JOIN tickets t ON j.id = t.journee_id
            GROUP BY j.id ORDER BY en_ligne DESC
        `);
        res.json({ success: true, classement: rows });
    });

    app.get("/api/historique", (req, res) => {
        const rows = queryAll("SELECT * FROM historique ORDER BY date_action DESC LIMIT 100");
        res.json({ success: true, historique: rows });
    });

    app.get("/api/artistes", (req, res) => {
        const rows = queryAll("SELECT * FROM artistes ORDER BY id");
        res.json({ success: true, artistes: rows });
    });

    /* ═══ PAGE PRINCIPALE ═══ */

    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "views/index.html"));
    });

    /* ═══ DÉMARRAGE ═══ */

    app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════════════════╗
║      🌙 FESTIVAL RAMADAN 1447H - SERVEUR DÉMARRÉ 🌙       ║
╠════════════════════════════════════════════════════════════╣
║  URL         : http://localhost:${PORT}                      ║
║  Mot de passe: ${MOT_DE_PASSE}                              ║
║  Mémoire     : ✅ Persistante                              ║
║  Sécurité    : 🔒 Protégé par mot de passe                 ║
╚════════════════════════════════════════════════════════════╝
        `);
    });
}

/* ═══════════════════════════════════════════════════════════════
   LANCER
=================================================================== */

initialiserDB().catch(err => {
    console.error("❌ Erreur:", err);
});

process.on('SIGINT', () => {
    sauvegarderDB();
    process.exit(0);
});

process.on('SIGTERM', () => {
    sauvegarderDB();
    process.exit(0);
});