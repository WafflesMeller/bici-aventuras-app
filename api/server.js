// server.js
import express from 'express';
import cors from 'cors';
// OJO: En modo moderno es obligatorio poner la extensión .js al importar archivos locales
import { consultaCedula } from './saime-flujo.js'; 

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Ruta para verificar estado
app.get('/', (req, res) => {
    res.send('🤖 Servidor SAIME (ESM Mode) activo.');
});

app.get('/api/cedula/:letra/:numero', async (req, res) => {
    const { letra, numero } = req.params;
    console.log(`🔎 Buscando: ${letra}-${numero}`);

    try {
        const data = await consultaCedula(letra, numero);
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ found: false, error: 'Error de servidor' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server corriendo en http://localhost:${PORT}`);
});