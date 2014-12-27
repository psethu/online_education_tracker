var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tweetsSchema = new Schema({
	tweet: String, 
	date: Date
});

var Tweet = mongoose.model('tweets', tweetsSchema)

module.exports = Tweet