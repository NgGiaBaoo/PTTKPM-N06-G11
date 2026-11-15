const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

let sslConfig;
try {
    sslConfig = {
        ca: fs.readFileSync(path.join(__dirname, "ca.pem")),
        rejectUnauthorized: true
    };
} catch {
    if (process.env.DB_SSL === "true") {
        sslConfig = { rejectUnauthorized: false };
        console.warn("Cảnh báo: Đang dùng TLS nhưng chưa có ca.pem; hãy bổ sung CA certificate của Aiven để xác thực máy chủ.");
    }
}

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,

    ...(sslConfig && { ssl: sslConfig })
});

connection.connect((err) => {
    if (err) {
        console.error("Lỗi kết nối:", err);
    } else {
        console.log("Kết nối Database thành công!");
    }
});

module.exports = connection;
