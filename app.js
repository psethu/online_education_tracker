var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var fs = require('fs');

var routes = require('./routes/index');

var app = express();

// uses twitter API to store #onlineeducation tweets
/*************************************************/
var Tweet = require('./models/tweets.js')

var Twit = require('twit');

var twit = new Twit({
    consumer_key:         'OLqxvrpcYD0RYEHqU2PaSSAsy'
  , consumer_secret:      'LqmoKAVHHALYXFky4pBZ3q1KxmJJVYXkHDMzHBvQfHgwE6984Q'
  , access_token:         '2188939550-1j8tsOhitOOUaXuG9ksK7ijeNkz5xChx2FM3PzV'
  , access_token_secret:  'wcnKNAraDoQu8n3BgBLaHWtiWpb38OtR78krtDQH98oW9'
})

// filter the public stream by english tweets containing `#apple`

var stream = twit.stream('statuses/filter', { track: '#onlineeducation', language: 'en' })

stream.on('tweet', function (incoming_tweet) {
  var final_tweet = new Tweet({})
  final_tweet.tweet = incoming_tweet.text;
  final_tweet.date = incoming_tweet.created_at;
  final_tweet.save()
})
/*************************************************/


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

/*
globals for initial data access
  - updated once form is submitted
 */
var start_date = "1/1/2000"
var end_date = null;
// no end_date - will use new Date() to get date at this moment
var data = {
      labels: ["January", "February", "March", "April", "May", "June", "July"],
      datasets: [
          {
              label: "My First dataset",
              fillColor: "rgba(220,220,220,0.2)",
              strokeColor: "rgba(220,220,220,1)",
              pointColor: "rgba(220,220,220,1)",
              pointStrokeColor: "#fff",
              pointHighlightFill: "#fff",
              pointHighlightStroke: "rgba(220,220,220,1)",
              data: [85, 59, 80, 81, 56, 55, 40]
          }
      ]
  };


app.put('/request', function(req, res) {
    start_date = req.body.input1;
    end_date = req.body.input2;
    data.datasets[0].data[0] = 55;
    res.status(200).send('Ok');
})

/* Assigned start_date/end_date variables in find query so the view of tweets
   can be updated upon from/to selections in the form */
app.get('/tweets', function(req, res){
  /* create here start/end date_obj for data consistency 
          Ex: string - "1/1/2000" vs object - Date("1/1/2000") */
  var start_date_obj = new Date(start_date)
  if (end_date == null) 
    var end_date_obj = new Date()
  else
    var end_date_obj = new Date(end_date);

  console.log("\n\n\n date objects")
  console.log(start_date_obj)
  console.log(end_date_obj)

    mongoose.model('tweets').find({date: {$gte: start_date_obj, $lte: end_date_obj }}).sort({date:-1}).find(function(err, all_tweets) {
        // the query result is an array of javascript objects        
       res.render('tweets_data', { title: 'Twitter', tweets_data : all_tweets, from_date: start_date, to_date: end_date, graph_data : data});
    });
});

app.use('/', routes);

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
