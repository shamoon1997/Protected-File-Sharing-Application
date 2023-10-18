const express = require('express');
require('dotenv').config();
const ejs = require('ejs');
const app = express();
const multer = require('multer');
const upload = multer({ dest: 'uploads' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const File = require('./models/File.js');
const port = process.env.PORT || 3005;

mongoose.connect(process.env.DATABASE_URL);
app.set('view engine', ejs);
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
	res.render('index.ejs');
});

app.post('/upload', upload.single('file'), async (req, res) => {
	const fileData = {
		path: req.file.path,
		originalName: req.file.originalname,
	};
	if (req.body.password != null && req.body.password != '') {
		fileData.password = await bcrypt.hash(req.body.password, 10);
	}
	const file = await File.create(fileData);
	res.render('index.ejs', {
		fileLink: `${req.headers.origin}/files/${file.id}`,
	});
});

app.route('/files/:id').get(handleDownload).post(handleDownload);

app.listen(port, () => {
	console.log(`Server is listening on port ${port}`);
});

async function handleDownload(req, res) {
	console.log('Downloading...');
	const file = await File.findById({ _id: req.params.id });
	if (file.password != null) {
		if (req.body.password != null) {
			if (!(await bcrypt.compare(req.body.password, file.password))) {
				res.render('password.ejs', { error: true });
				return;
			}
		} else {
			res.render('password.ejs', { error: false });
			return;
		}
	}
	file.downloadCount++;
	file.save();
	console.log(file.downloadCount);
	res.download(file.path, file.originalName);
}
