const express = require('express');
const path = require('path');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Conexión a la base de datos
const connection = mysql.createConnection({
    host: 'data.ca7oss6qu6bb.us-east-1.rds.amazonaws.com',
    user: 'yon',
    password: 'kokopato8383',
    database: 'test2'
});

connection.connect((err) => {
    if (err) {
        console.log('Error de conexión a la base de datos:', err.stack);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// Middleware para archivos estáticos y formularios
app.use(express.static(path.join(__dirname, 'pagina_principal')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Ruta para guardar un nuevo reporte
app.post('/guardar_reporte', (req, res) => {
    const { tipo, ubicacion, descripcion, urgencia, nombre, correo } = req.body;
    const sql = `
        INSERT INTO REPORTES 
        (tipo, ubicacion, descripcion, urgencia, nombre, correo) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    connection.query(
        sql,
        [tipo, ubicacion, descripcion, urgencia, nombre, correo],
        (err, result) => {
            if (err) {
                console.error('Error al guardar el reporte:', err);
                return res.status(500).send('Error al guardar el reporte');
            }
            console.log('Reporte guardado en la base de datos');
            res.redirect('/');
        }
    );
});

// Ruta para obtener todos los reportes (puedes usarla para estadísticas)
app.get('/reportes', (req, res) => {
    connection.query('SELECT * FROM REPORTES', (err, results) => {
        if (err) {
            console.error('Error al obtener reportes:', err);
            return res.status(500).send('Error al obtener reportes');
        }
        res.json(results);
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});