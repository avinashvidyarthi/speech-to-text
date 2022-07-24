const socket = io();
const uid = new ShortUniqueId();
const constraints = { audio: true };

let isRecording = false;
let mediaRecorderCopy, mediaStreamCopy;

const recordBtn = document.getElementById('record-btn');
const outputArea = document.getElementById('output-area');

const blobToBase64 = (blob) => {
	return new Promise((resolve, _) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result);
		reader.readAsDataURL(blob);
	});
};

const recordBtnClick = async () => {
	if (!isRecording) {
		isRecording = true;
		recordBtn.innerText = 'Stop';
		recordBtn.classList.remove('btn-primary');
		recordBtn.classList.add('btn-danger');
        outputArea.innerText = "";
		navigator.mediaDevices
			.getUserMedia(constraints)
			.then(async function (mediaStream) {
				let mediaRecorder = new MediaRecorder(mediaStream);
				// console.log(mediaStream.getTracks()[0].getSettings());
				mediaRecorder.onstart = function (e) {
					this.chunks = [];
				};
				mediaRecorder.ondataavailable = function (e) {
					this.chunks.push(e.data);
				};
				mediaRecorder.onstop = async function (e) {
					const blob = new Blob(this.chunks, {
						type: 'audio/webm codecs=opus',
					});
					const base64string = await blobToBase64(blob);
					socket.emit('voice:recording', {
						base64string,
						metadata: {
							type: 'audio/webm codecs=opus',
							sampleRate: mediaStream.getTracks()[0].getSettings().sampleRate,
						},
					});
				};
				mediaRecorderCopy = mediaRecorder;
				mediaStreamCopy = mediaStream;
				// Start recording
				mediaRecorder.start();
			});
	} else {
		isRecording = false;
		recordBtn.innerText = 'Processing...';
		recordBtn.classList.remove('btn-danger');
		recordBtn.classList.add('btn-secondary');
		recordBtn.disabled = true;
		mediaRecorderCopy.stop();
		mediaStreamCopy.getTracks().forEach(function (track) {
			track.stop();
		});
	}
};

socket.on('voice:result', (transcription) => {
	recordBtn.innerText = 'Record';
	recordBtn.classList.remove('btn-secondary');
	recordBtn.classList.add('btn-primary');
	recordBtn.disabled = false;
    outputArea.innerText = transcription;
});
