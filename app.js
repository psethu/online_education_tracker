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
var factor = 24*60*60*1000; // 1 day = 24 * 60 * (1 min = 1000 miliseconds * 60)

var start_date = null;
var temp = new Date(new Date()-(5*factor)) // make this 5 days before
start_date = ""+(temp.getMonth()+1)+"/"+temp.getDate()+"/"+temp.getFullYear()
// if current_date 12/30/14, start_date 12/25/14

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
var num_days = 5; // default to 5 if start/end dates unspecified
var days_of_month = []; // populated in xaxis_create, used in dataset_add

function xaxis_create(from_date_obj, to_date_obj) {
    console.log("\n\n\nDate objects")
    console.log(from_date_obj)
    console.log(to_date_obj)

    num_days = Math.floor((to_date_obj-from_date_obj)/(factor))
    var current_date_obj = to_date_obj
    var start_date_obj = from_date_obj

    var delta = num_days;
    console.log("\n\n After put")
    console.log(num_days)
    var xaxis = [];
    var month_name = "";
    var day_numerical = 0;
    var converted_date = null; // in case we are at Jan 1 and need to go to Dec 31

    for (var i = 0; i<num_days; i++) {
        delta -= 1
        converted_date = new Date(current_date_obj-(delta*factor))
        
        console.log(converted_date)
        
        month_name = months[converted_date.getMonth()]
        days_of_month.push(converted_date.getDate())
        
        console.log(converted_date.getDate())
        //console.log(days_of_month)
        day_numerical = (days_of_month[i]).toString()
        xaxis.push(month_name+day_numerical)
    }

console.log("\n\n\n Final xaxis")
console.log(xaxis)
data.labels = xaxis
}
/**************************/


/*****************************************************/
/* Function to assign the total tweets for each day */
/****************************************************/
/*
Sample input:
[ { _id: { day: 30 }, count: 1 },
  { _id: { day: 29 }, count: 7 },
  { _id: { day: 28 }, count: 2 },
  { _id: { day: 27 }, count: 4 } ]
 */
function dataset_add(total_tweets) {
  // this for loop is so the correct count goes to the correct day
  //    since we can have a group that does not have all days like in Sample input
  var day_found = false;
  for (var i=0; i < num_days; i++) {
      for (var j = 0; j < total_tweets.length; j++) {
          if (total_tweets[j]._id.day === days_of_month[i]) {
              data.datasets[0].data[i] = total_tweets[j].count
              day_found = true
          }
      }
      // if went through entire loop and still false, then assign 0 counts
      if (!day_found) {
          data.datasets[0].data[i] = 0
      }
      day_found = false;
  }
}

/******************************************/

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
  console.log("\n\n The dates")
  console.log(start_date)
  console.log(end_date)
  start_date_obj = new Date(start_date)
  if (end_date == null) 
    end_date_obj = new Date()
  else
    end_date_obj = new Date(end_date);

    mongoose.model('tweets').find({date: {$gte: start_date_obj, $lte: end_date_obj }}).sort({date:-1}).find(function(err, all_tweets) {
      // the query result is an array of javascript objects
      mongoose.model('tweets').aggregate( [ { $group: { _id : {day: {$dayOfMonth:"$date"} }, count : {$sum:1} } } ], function(err, tweets_per_day) {

        xaxis_create(start_date_obj, end_date_obj)
        dataset_add(tweets_per_day)
        days_of_month = []; // need to reset this global
        res.render('tweets_data', { title: 'Twitter', tweets_data : all_tweets, from_date: start_date, to_date: end_date, graph_data : data});
      });
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
