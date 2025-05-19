const express = require('express');
const path = require('path');
const mysql = require('mysql');
const session = require('express-session');

const app = express();
const port = 3000;

// Configuración sesión
app.use(session({
    secret: 'clave-secreta-1234',
    resave: false,
    saveUninitialized: true
}));

// Conexión a la base de datos
const connection = mysql.createConnection({
    host: 'data.ca7oss6qu6bb.us-east-1.rds.amazonaws.com',
    user: 'yon',
    password: 'kokopato8383',
    database: 'test2'
});

connection.connect(err => {
    if (err) {
        console.log('Error de conexión a la base de datos:', err.stack);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// Middleware para archivos estáticos y parseo de formularios
app.use(express.static(path.join(__dirname, 'pagina_principal')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware para proteger rutas
function authMiddleware(req, res, next) {
    if (req.session && req.session.user === 'root') {
        next();
    } else {
        // Si es una petición AJAX (fetch), responde con 401 para que el frontend maneje redirección
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        // Si es petición normal, redirige a login
        res.redirect('/login.html');
    }
}

// Ruta para login POST
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'root' && password === '123') {
        req.session.user = 'root';
        res.redirect('/admin/reportes');
    } else {
        res.send('<h2>Usuario o contraseña incorrectos</h2><a href="/login.html">Volver al login</a>');
    }
});

// Ruta para logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login.html');
    });
});

// Ruta para guardar un nuevo reporte
app.post('/guardar_reporte', (req, res) => {
    const { tipo, ubicacion, descripcion, urgencia, nombre, correo } = req.body;
    const sql = `
        INSERT INTO REPORTES 
        (tipo, ubicacion, descripcion, urgencia, nombre, correo) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    connection.query(sql, [tipo, ubicacion, descripcion, urgencia, nombre, correo], (err, result) => {
        if (err) {
            console.error('Error al guardar el reporte:', err);
            return res.status(500).send('Error al guardar el reporte');
        }
        console.log('Reporte guardado en la base de datos');
        res.redirect('/');
    });
});

// Página principal protegida con reportes (solo para usuario root)
app.get('/admin/reportes', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'pagina_principal', 'reportes.html'));
});

// Obtener reportes en JSON (protegido)
app.get('/admin/reportes/json', authMiddleware, (req, res) => {
    connection.query('SELECT * FROM REPORTES', (err, results) => {
        if (err) {
            console.error('Error al obtener reportes:', err);
            return res.status(500).json({ error: 'Error al obtener reportes' });
        }
        res.json(results);
    });
});

// Editar reporte (solo descripción) - protegido
app.post('/admin/reportes/editar', authMiddleware, (req, res) => {
    const { id, descripcion } = req.body;
    const sql = 'UPDATE REPORTES SET descripcion = ? WHERE id = ?';
    connection.query(sql, [descripcion, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar reporte:', err);
            return res.status(500).json({ error: 'Error al actualizar reporte' });
        }
        res.json({ mensaje: 'Reporte actualizado' });
    });
});

// Servir login.html
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'pagina_principal', 'login.html'));
});

// Página principal (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pagina_principal', 'index.html'));
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
// Eliminar reporte
app.delete('/admin/reportes/eliminar', authMiddleware, (req, res) => {
    const { id } = req.body;
    const sql = 'DELETE FROM REPORTES WHERE id = ?';
    connection.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar reporte:', err);
            return res.status(500).json({ error: 'Error al eliminar reporte' });
        }
        res.json({ mensaje: 'Reporte eliminado' });
    });
});
