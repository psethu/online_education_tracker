var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tweetsSchema = new Schema({
	tweet: String, 
	quote: String
});

mongoose.model('tweets', tweetsSchema)