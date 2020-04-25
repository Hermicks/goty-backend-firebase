import * as functions from 'firebase-functions';
/**
 * CONFIGURACIÓN ADMINISTRACIÓN CUENTA DE SERVICIOS DE FIREBASE
 * Con esta configuración podemos utilizar Firebase de manera local
 */
import * as admin from 'firebase-admin';

// Me traigo express
import * as express from 'express';
import * as cors from 'cors';

// Service account es un archivo con todas nuestras credenciales que generamos desde firebase desde ->
/**
 * Configuración del proyecto ->
 * Cuentas de servicio ->
 * Generar nuestra clave privada
 */
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://firestore-grafica-29a58.firebaseio.com"
});

// Referencia a base de datos
const db = admin.firestore();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//     response.json({
//         mensaje: "Hola mundo desde funciones de Firebase!"
//     });
// });

// Obtener colecciones GOTY
export const getGOTY = functions.https.onRequest(async (request, response) => {
    // const nombre = request.query.nombre || 'Sin nombre';

    // Obtengo mi colección
    const gotyRef = db.collection('goty');

    // Creo un snapshot/fotografía para obtener el estado actual de mi objeto con todos mis datos personales. NO ENVIAR NUNCA
    // El método get realiza un proceso asíncrono para obtener la información por lo que hay que asegurarnos que termine
    const docsSnap = await gotyRef.get();
    // Guardo toda mi info en una variable
    const juegos = docsSnap.docs.map(doc => doc.data());

    // Mando la información
    response.status(200).json(juegos);
});

// Express
const app = express();
// Permitimos cualquier petición de cualquier dominio
app.use(cors({ origin: true }));

// Tenemos tres pasos a la hora de acceder a los documentos
/**
 * 1. Obtenemos la referencia de la colección/documento -> Método collection
 * 2. Hacemos el snap/foto del estado actual del objeto -> Método get
 * 3. Obtenemos la data real de la BBDD -> Método data
 */

// Obtener juegos
app.get('/goty', async (req, res) => {
    // Obtengo mi colección
    const gotyRef = db.collection('goty');
    const docsSnap = await gotyRef.get();
    const juegos = docsSnap.docs.map(doc => doc.data());
    // Mando la información
    res.status(200).json(juegos);
});

// Incrementar el número de votos de un juego en 1
app.post('/goty/:id', async (req, res) => {
    const id = req.params.id;
    const gameRef = db.collection('goty').doc(id);
    const gameSnap = await gameRef.get();

    if (!gameSnap.exists) {
        res.status(404).json({
            ok: false,
            mensaje: 'No existe un juego con el ID: '.concat(id)
        });
    } else {
        // Obtengo la referencia actual del juego
        const juegoActual = gameSnap.data() || { votos: 0 };
        await gameRef.update({
            votos: juegoActual.votos + 1
        });

        res.status(200).json({
            ok: true,
            mensaje: `Gracias por su voto a ${ juegoActual.name }`
        });
    }

});

// Comunico a Firebase que tengo un servicio express corriendo. Nombro api a mi endpoint
// Ambas líneas hacen completamente lo mismo
// export const api = functions.https.onRequest(app);
exports.api = functions.https.onRequest(app);
