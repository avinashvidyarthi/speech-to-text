const express = require('express');
const speech = require('@google-cloud/speech');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const path = require('path');
const client = new speech.SpeechClient();
const port = process.env.PORT || 3000;

app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
	console.log('a user connected');
	socket.on('voice:recording', async ({ base64string, metadata }) => {
		// The audio file's encoding, sample rate in hertz, and BCP-47 language code
		const audio = {
			content: base64string.split(",")[1],
		};
		const config = {
			encoding: 'MP3',
			languageCode: 'en-US',
			sampleRateHertz: metadata.sampleRate,
		};
		const request = {
			audio: audio,
			config: config,
		};

		// Detects speech in the audio file
		const [response] = await client.recognize(request);
		const transcription = response.results
			.map((result) => result.alternatives[0].transcript)
			.join('\n');
        console.log(transcription);
        socket.emit('voice:result', transcription);
	});
	socket.on('disconnect', () => {
		console.log('user disconnected');
	});
});

server.listen(port, () => {
	console.log('listening on :', port);
});
