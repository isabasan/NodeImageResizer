var config = {}

config.port = process.env.WEB_PORT || 1337;
config.paths = {};
config.paths.upload = '/node/uploads';

module.exports = config;