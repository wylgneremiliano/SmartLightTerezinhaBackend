import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import mqtt from 'mqtt';
import { formataGrupo } from './utils/formataGrupo/index.js';
import { formataEstado } from './utils/formataEstado/index.js';



const app = express();


app.use(cors());
app.use(express.json());

const secretKey = 'teste123';


const mqttHost = 'mqtt://localhost';
const client = mqtt.connect(mqttHost);
let dispositivos = [];

function iniciarMonitoramentoZigbee() {
    const client = mqtt.connect("mqtt://localhost:1883");

    client.on("connect", () => {
        console.log("✅ Conectado ao broker MQTT do Zigbee2MQTT");


        client.subscribe([
            "zigbee2mqtt/bridge/devices",
            "zigbee2mqtt/bridge/event",
            "zigbee2mqtt/+/state",
            "zigbee2mqtt/#"
        ], (err) => {
            if (err) console.error("Erro ao se inscrever nos tópicos:", err);
        });

    });

    client.on("message", (topic, message) => {
        try {
            const payload = JSON.parse(message.toString());


            if (topic === "zigbee2mqtt/bridge/devices") {
                dispositivos = payload.map((device) => ({
                    id: device.ieee_address,
                    tipo: device.type || "Desconhecido",
                    nome: device.friendly_name || device.ieee_address,
                    modelo: device.model_id || "N/D",
                    grupo: formataGrupo(device.friendly_name),
                    status_conexao: device.interview_state === "SUCCESSFUL",
                    estado: false,
                })).filter(d => d.tipo !== "Coordinator");


                console.log("Lista de dispositivos atualizada");
            }
            const parts = topic.split("/");
            const deviceName = parts[1];

            if (!deviceName) return;
            if (dispositivos)
                dispositivos.map((d) => d.nome === deviceName ? d.estado = formataEstado(payload.state_left) : false);


            console.log(`Estado completo atualizado: ${deviceName}`);

        } catch (err) {
            console.error("Erro ao processar mensagem MQTT:", err);
        }
    });

    client.on("error", (err) => {
        console.error("Erro no MQTT:", err);
    });
}

app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    if (usuario === 'admin' && senha === 'teste123') {
        const token = jwt.sign({ usuario }, secretKey, { expiresIn: '30m' });
        return res.json({ token });
    }
    return res.status(401).json({ message: 'Credênciais invalidas!' });
});


app.get("/devices", (req, res) => {
    res.json(dispositivos);
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
    res.json(dispositivos);
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
    console.log(`🚀 Servidor Express rodando em http://localhost:${3000}`);
    dispositivos = iniciarMonitoramentoZigbee();
});
