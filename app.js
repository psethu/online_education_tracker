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
  /* create here start/end date_obj for data consistency 
          Ex: string - "1/1/2000" vs object - Date("1/1/2000") */
var start_date_obj = null;
var end_date_obj = null;
// no end_date - will use new Date() to get date at this moment
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var data = {
      labels: [],
      datasets: [
          {
              label: "My First dataset",
              fillColor: "rgba(220,220,220,0.2)",
              strokeColor: "rgba(220,220,220,1)",
              pointColor: "rgba(220,220,220,1)",
              pointStrokeColor: "#fff",
              pointHighlightFill: "#fff",
              pointHighlightStroke: "rgba(220,220,220,1)",
              data: [33, 27, 46, 14, 12]
          }
      ]
  };

/*****************************************/
/* Create x-axis from last num_days days */
/*****************************************/
var num_days = 5;
var x_axis = [];
var current_date = new Date(24*60*60000*2);
var delta = num_days;
var month_name = "";
var day_of_month = 0;
var days_of_month = [];
var factor = 24*60*60000; // 1 day = 24 * 60 * (1 min = 60000 miliseconds)
var converted_date = null; // in case we are at Jan 1 and need to go to Dec 31

for (var i = 0; i<num_days; i++) {
    delta -= 1
    converted_date = new Date(current_date-(delta*factor))
    month_name = months[converted_date.getMonth()]
    days_of_month.push(converted_date.getDate())
    day_of_month = (days_of_month[i]).toString()
    x_axis.push(month_name+day_of_month)
}
console.log("The x-axis")
console.log(x_axis)
console.log(days_of_month)
data.labels = x_axis
/**************************/

app.put('/request', function(req, res) {
    start_date = req.body.input1;
    end_date = req.body.input2;

  start_date_obj = new Date(start_date)
  if (end_date == null) 
    end_date_obj = new Date()
  else
    end_date_obj = new Date(end_date);

    res.status(200).send('Ok');
})

/* Assigned start_date/end_date variables in find query so the view of tweets
   can be updated upon from/to selections in the form */
app.get('/tweets', function(req, res){
  // need to assign start/end date_obj when app first connects to /tweets
  start_date_obj = new Date(start_date)
  if (end_date == null) 
    end_date_obj = new Date()
  else
    end_date_obj = new Date(end_date);



    mongoose.model('tweets').find({date: {$gte: start_date_obj, $lte: end_date_obj }}).sort({date:-1}).find(function(err, all_tweets) {
        // the query result is an array of javascript objects
        console.log("\n\n\n\nTHE data")
        console.log(all_tweets)        
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
