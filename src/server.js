import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import mqtt from "mqtt"

const app = express();


app.use(cors());
app.use(express.json());

const secretKey = 'teste123';


const mqttHost = 'mqtt://localhost';
const client = mqtt.connect(mqttHost);

let devices = {};

client.on('connect', () => {
    console.log('Conectado ao MQTT do Zigbee2MQTT');


    client.subscribe('zigbee2mqtt/bridge/response/devices', () => {
        client.publish('zigbee2mqtt/bridge/request/devices', '{}');
    });

    client.subscribe('zigbee2mqtt/bridge/devices', () => {
        client.publish('zigbee2mqtt/bridge/request/devices', '{}');
    })

    client.subscribe('zigbee2mqtt/+/+');
});

client.on('message', (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        console.log(topic)
        if (payload && topic === 'zigbee2mqtt/bridge/devices')
            devices = payload;
        return;

    } catch (err) {
        console.error('Erro ao processar mensagem MQTT:', err);
    }
});
app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    if (usuario === 'admin' && senha === 'teste123') {
        const token = jwt.sign({ usuario }, secretKey, { expiresIn: '30m' });
        return res.json({ token });
    }
    return res.status(401).json({ message: 'Credênciais invalidas!' });
});


app.get('/devices', (req, res) => {
    res.json(devices);
});



app.post('/device/:id/on', (req, res) => {
    const deviceId = req.params.id;
    const topic = `zigbee2mqtt/${deviceId}/set`;
    client.publish(topic, JSON.stringify({ state: "ON" }), (err) => {
        if (err) return res.status(500).send(err.message);
        res.send(`Dispositivo ${deviceId} ligado`);
    });
});

app.post('/device/:id/off', (req, res) => {
    const deviceId = req.params.id;
    const topic = `zigbee2mqtt/${deviceId}/set`;
    client.publish(topic, JSON.stringify({ state: "OFF" }), (err) => {
        if (err) return res.status(500).send(err.message);
        res.send(`Dispositivo ${deviceId} desligado`);
    });
});



app.get('/lista-dispositivos-sem-token', (req, res) => {

    return res.json([
        {
            "id": "1",
            "tipo": "lampada",
            "nome": "lampada_sala_1",
            "grupo": "Salas",
            "status_conexao": true,
            "estado": true

        }, {
            "id": "2",
            "tipo": "lampada",
            "nome": "lampada_sala_2",
            "grupo": "Salas",
            "status_conexao": false,
            "estado": false
        },
        {
            "id": "3",
            "tipo": "lampada",
            "nome": "lampada_secretaria_1",
            "grupo": "Secretaria",
            "status_conexao": true,
            "estado": true
        },
        {
            "id": "4",
            "tipo": "lampada",
            "nome": "lampada_secretaria_2",
            "grupo": "Secretaria",
            "status_conexao": true,
            "estado": true
        },
        {
            "id": "5",
            "tipo": "lampada",
            "nome": "lampada_refeitorio_1",
            "grupo": "Refeitório",
            "status_conexao": true,
            "estado": false
        },
        {
            "id": "6",
            "tipo": "tv",
            "nome": "tv_sala_1",
            "grupo": "Salas",
            "status_conexao": true,
            "estado": false
        },
        {
            "id": "7",
            "tipo": "tv",
            "nome": "tv_biblioteca_1",
            "grupo": "Biblioteca",
            "status_conexao": true,
            "estado": false
        },
        {
            "id": "8",
            "tipo": "projetor",
            "nome": "projetor_sala_1",
            "grupo": "Salas",
            "status_conexao": true,
            "estado": false
        },
        {
            "id": "9",
            "tipo": "interruptor",
            "nome": "interruptor_sala_1",
            "grupo": "Salas",
            "status_conexao": true,
            "estado": false
        },

    ]);
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
                "tipo": "lampada",
                "nome": "lampada_sala_1",
                "grupo": "Salas",
                "status_conexao": true,
                "estado": true

            }, {
                "id": "2",
                "tipo": "lampada",
                "nome": "lampada_sala_2",
                "grupo": "Salas",
                "status_conexao": false,
                "estado": false
            },
            {
                "id": "3",
                "tipo": "lampada",
                "nome": "lampada_secretaria_1",
                "grupo": "Secretaria",
                "status_conexao": true,
                "estado": true
            },
            {
                "id": "4",
                "tipo": "lampada",
                "nome": "lampada_secretaria_2",
                "grupo": "Secretaria",
                "status_conexao": true,
                "estado": true
            },
            {
                "id": "5",
                "tipo": "lampada",
                "nome": "lampada_refeitorio_1",
                "grupo": "Refeitório",
                "status_conexao": true,
                "estado": false
            },
            {
                "id": "6",
                "tipo": "tv",
                "nome": "tv_sala_1",
                "grupo": "Salas",
                "status_conexao": true,
                "estado": false
            },
            {
                "id": "7",
                "tipo": "tv",
                "nome": "tv_biblioteca_1",
                "grupo": "Biblioteca",
                "status_conexao": true,
                "estado": false
            },
            {
                "id": "8",
                "tipo": "projetor",
                "nome": "projetor_sala_1",
                "grupo": "Salas",
                "status_conexao": true,
                "estado": false
            },
            {
                "id": "9",
                "tipo": "interruptor",
                "nome": "interruptor_sala_1",
                "grupo": "Salas",
                "status_conexao": true,
                "estado": false
            },

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
