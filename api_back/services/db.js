const mysql = require("mysql2");
const config = {
  db_host: "localhost",
  db_user: "root",
  db_password: "admin",
  db_database: "archicheck",
  db_port: 3306,
};

const pool = mysql.createPool({
  host: config.db_host,
  user: config.db_user,
  password: config.db_password,
  database: config.db_database,
  port: config.db_port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("connexion à MySQL échouée :", err.message);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("→ Connexion perdue.");
    }
    if (err.code === "ER_HOST_NOT_PRIVILEGED") {
      console.error("→ L'hôte n'a pas la permission de se connecter.");
    }
    if (err.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("→ Identifiants MySQL invalides.");
    }
    if (err.message.includes("flush-hosts")) {
      console.error("IP bloquée par MySQL : utilisez 'mysqladmin flush-hosts'");
    }
    process.exit(1); // Stoppe le script pour éviter d'enchaîner les erreurs
  } else {
    console.log("Connexion MySQL réussie");
    connection.release();
  }
});

module.exports = pool.promise();
