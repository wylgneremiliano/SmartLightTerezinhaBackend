import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();


app.use(cors());
app.use(express.json());

const secretKey = 'teste123';

app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    if (usuario === 'admin' && senha === 'teste123') {
        const token = jwt.sign({ usuario }, secretKey, { expiresIn: '30m' });
        return res.json({ token });
    }
    return res.status(401).json({ message: 'Credênciais invalidas!' });
});

app.get('/lista-dispositivos', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Usuário não autenticado!' });
    }

    jwt.verify(token, secretKey, (err) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }
        return res.json([
            {
                "id": "1",
                "tipo": "Sensor de Temperatura",
                "nome": "Sensor 1",
                "grupo": "Grupo A",
                "status_conexao": true,
                "estado": true

            }, {
                "id": "2",
                "tipo": "Sensor de Umidade",
                "nome": "Sensor 2",
                "grupo": "Grupo B",
                "status_conexao": false,
                "estado": false
            },
            {
                "id": "3",
                "tipo": "Atuador de Luz",
                "nome": "Atuador 1",
                "grupo": "Grupo A",
                "status_conexao": true,
                "estado": true

            }

        ]);
    });
});

app.get('/private', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Usuário não autenticado!' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }
        return res.json({ message: 'Protected data', user: decoded });
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
