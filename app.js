var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var fs = require('fs');

var routes = require('./routes/index');
var users = require('./routes/users');


var app = express();

// twitter API
var Twit = require('twit');

var twit = new Twit({
    consumer_key:         'OLqxvrpcYD0RYEHqU2PaSSAsy'
  , consumer_secret:      'LqmoKAVHHALYXFky4pBZ3q1KxmJJVYXkHDMzHBvQfHgwE6984Q'
  , access_token:         '2188939550-1j8tsOhitOOUaXuG9ksK7ijeNkz5xChx2FM3PzV'
  , access_token_secret:  'wcnKNAraDoQu8n3BgBLaHWtiWpb38OtR78krtDQH98oW9'
})

// filter the public stream by english tweets containing `#apple`

var stream = twit.stream('statuses/filter', { track: '#onlineeducation', language: 'en' })

stream.on('tweet', function (tweet) {
  console.log(tweet)
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// using fs library to load files from models directory
fs.readdirSync(__dirname+'/models').forEach(function(filename){
    // only require if js
    if (~filename.indexOf('.js')) require(__dirname+'/models/'+filename)
})

app.get('/tweets', function(req, res){
    mongoose.model('tweets').find({ tweet:"test" }).find(function(err, all_tweets) {
       res.status(200).send(all_tweets);
    });
});


app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });

    mongoose.connect('mongodb://localhost/twitter_db');
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
