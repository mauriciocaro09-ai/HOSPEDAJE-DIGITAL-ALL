const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "Hospedaje",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  connectionLimit: 3,
  waitForConnections: true,
  queueLimit: 0,
  typeCast(field, next) {
    if (field.type === 'BLOB' || field.type === 'MEDIUM_BLOB' || field.type === 'LONG_BLOB' || field.type === 'TINY_BLOB' ||
        field.type === 'VAR_STRING' || field.type === 'STRING') {
      const val = field.string('utf8');
      return val === null ? null : val;
    }
    return next();
  },
});

module.exports = db;
