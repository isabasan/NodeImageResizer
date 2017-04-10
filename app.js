
var config = require('./config');
var http = require('http'),
    fs = require('fs'),
    uuid = require('uuid'),
    express = require('express'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    multipart = require('connect-multiparty'),
    lwip = require('lwip');
var app = express();
var multipartMiddleware = multipart({ uploadDir: config.paths.upload });

app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', function (req, res) {
    console.log('GET /');
    var html = fs.readFileSync('index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
});

app.post('/', multipartMiddleware, function (req, res) {

    var filePath = req.files.file.path;
    var extension = filePath.split('.').pop();
    var fileName = filePath.split(/(\\|\/)/g).pop().replace('.' + extension, '');

    var newFilePath = MoveFile(filePath, config.paths.upload + '/' + fileName);

    var params = JSON.parse(req.body.params);

    if (params.type == 'image') {
        for (var i = 0; i < params.operations.length; i++) {
            generateImage(params.operations[i], newFilePath, extension);
        }
    }
    else if (params.type == 'video') {

    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('thanks');
});

var port = config.port;
app.listen(port);
console.log('Listening at http://localhost:' + port);

function generateImage(operations, filePath, ext) {

    lwip.open(filePath, function (err, image) {
        var batch = image.batch();

        for (var i = 0; i < operations.length; i++) {

            var operation = operations[i];

            if (operations[i].name == 'resize') {
                if (operation.mode == 'cover') {
                    batch.cover(operations[i].width, operations[i].height);
                }
                else if (operation.mode == 'contain') {
                    batch.contain(operations[i].width, operations[i].height, operations[i].color);
                }
                else if (operation.mode == 'resize') {
                    batch.resize(operations[i].width, operations[i].height);
                }
                console.log('resized to : ' + operations[i].width + 'x' + operations[i].height + 'x' + operations[i].mode);
            }
            if (operations[i].name == 'scale') {
                batch.scale(operations[i].wRatio, operations[i].hRatio);
                console.log('scaled to : ' + operations[i].wRatio + 'x' + operations[i].hRatio);
            }
            if (operations[i].name == 'rotate') {
                batch.scale(operations[i].degs, operations[i].color);
                console.log('rotated to : ' + operations[i].degs + '-' + operations[i].color);
            }
            if (operations[i].name == 'crop') {
                batch.crop(operations[i].left, operations[i].top, operations[i].width, operations[i].height);
                console.log('croped to : ' + operations[i].left + 'x' + operations[i].top + 'x' + operations[i].width + 'x' + operations[i].height);
            }

        }

        var guid = uuid.v4();

        if (ext == 'png') {
            batch.writeFile(filePath.replace('original', guid), "png", { compression: "none" }, function (err) {
                console.log('writeFile-' + guid);
            });
        }
        else if (ext == 'jpg' || ext == 'jpeg') {
            batch.writeFile(filePath.replace('original', guid), "jpeg", { quality: 100 }, function (err) {
                console.log('writeFile-' + guid);
            });
        }
        else {
            batch.writeFile(filePath.replace('original', guid), function (err) {
                console.log('writeFile-' + guid);
            });
        }

    });
}

function MoveFile(filePath, newFolderPath) {
    var newFilePath = newFolderPath + '/original.' + filePath.split('.').pop();

    try {
        var stats = fs.lstatSync(newFolderPath);
        if (!stats.isDirectory()) {
            fs.mkdirSync(newFolderPath);
        }
    }
    catch (e) {
        fs.mkdirSync(newFolderPath);
    }

    fs.renameSync(filePath, newFilePath);

    return newFilePath;
}