﻿/**
 * Module dependencies.
 */

var express = require('express.io');
var http = require('http');
var path = require('path');
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
var sql = require('mssql');
var usersInRoom = [];
var numberOfQuestions = 2;
var rooms = ['Public', 'Elfs', 'Random'];
var lockedRooms = ['Public'];
var app = express();
//setup socket.io
app.http().io()

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);



//var User = [{ username: "dana", password: "no" }, { username: "admin", password: "yo" }, { username: "dm", password: "dmsecretpass" }];
var DMSocket;
var indexMessage = '';
var config = {
   // server: "localhost\\MSSQLSERVER",    //MARIN
   server: "localhost\\SQLEXPRESS",    //LINA
    database: "LieToMeDB",
    user: "sa",
   // password: "n4KmgANB"        //MARIN
    password : "tbbt"           //LINA
    //  password: "projekt"          //MARTINA

};


var questionsInRoom = [];
questionsInRoom["Elfs"] = [];
questionsInRoom["Random"] = [];
usersInRoom["Elfs"] = [];
usersInRoom["Random"] = [];

//var randomCounterForRoom = [];
//randomCounterForRoom["Elfs"] = 0;
//randomCounterForRoom["Random"] = 0;

var correctAnswerForRoom = [];
var answeresInRoom = [];
answeresInRoom["Elfs"] = 0;
answeresInRoom["Random"] = 0;

var questionCounter = 1;


passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}
app.get('/', function (req, res) {
    
    res.render('index');

});
app.get('/create', function (req, res) {
    
    res.render('createroom', { title: 'LieToMe Room Create' });

});
app.get('/about', function (req, res) {
    
    res.render('about', { title: '' });

});
app.get('/rooms/:id', function (req, res) {
    
    //check if there is another user with same username
    var doubleUser = isInRoom(req.params.id, req.query.username);
    if (doubleUser) {
        indexMessage = 'Postoji već korisnik s istim korisničkim imenom.';
        res.redirect('home');
    }

    //check if username is empty string
    if (req.query.username === "") {
        indexMessage = 'Unesite ispravno korisničko ime.';
        res.redirect('home');
    }
    

    if (rooms.indexOf(req.params.id) === -1) {
        rooms.push(req.params.id);
        console.log(rooms);
    }
    
    //check if room is locked
    if (!isInArray(lockedRooms, req.params.id)) {
        //render the room template with the name of the room for the underlying data model
        res.render('room', { title : req.params.id, username : req.query.username });
    } else {

        indexMessage = 'Soba je zaključana.';
        res.redirect('home');
    }
        
});
/*app.get('/dm/:user', function (req, res) {
	console.log(req.params.user);
	res.render('dmview', { title: 'Server.', rooms: rooms, user: req.params.user });

});*/

app.get('/server', function (req, res) {
    
    if (indexMessage !== '') {
        indexMessage = '';
        res.render('server', { rooms: rooms, message: 'Već postoji server za odabranu sobu.' });
    } else {
        res.render('server', { rooms: rooms, message: '' });
    }
});
app.get('/home', function (req, res) {
    var x = [];
    for (var i in rooms) {
        if ( !isInArray(lockedRooms, rooms[i]) ){ 
            x.push(rooms[i]);
        }
    }
    if (indexMessage !== '') {
        indexMessage = '';
        res.render('home', { title: 'LieToMe' , rooms: x, message: 'Unesite ispravno korisničko ime.' });
    } else {
        res.render('home', { title: 'LieToMe' , rooms: x, message: '' });
    }
});

app.get('/serverRoom/:id', function (req, res) {
    
    if (isInArray(lockedRooms, req.params.id)) {
        indexMessage = 'Već postoji server za odabranu sobu.';
        res.redirect('server');
    }

    if (rooms.indexOf(req.params.id) === -1) {
        rooms.push(req.params.id);
        console.log(rooms);
        questionsInRoom[req.params.id] = [];
        usersInRoom[req.params.id] = [];
        //randomCounterForRoom[req.params.id] = 0;
        answeresInRoom[req.params.id] = 0;
    }
    //render the room template with the name of the room for the underlying data model
    res.render('serverRoom', { title : req.params.id, username: 'root' });
    
});
/*app.post('/login', passport.authenticate('local'), function (req, res) {
	// If this function gets called, authentication was successful.
	// `req.user` contains the authenticated user.
	res.end(req.user.username);
});*/

// Setup the ready route, join room and broadcast to room.
app.io.route('userConnected', function (req) {
    req.io.join(req.data.room);
    req.io.room(req.data.room).broadcast('userConnected', {
            message: req.data.username + ' je u sobi. ',
            username: req.data.username
        });
        
    

    usersInRoom[req.data.room][req.data.username] = {answer: "", points: 0};
    
});

function isInRoom(atmRoom, atmUser) {
    
    for (var i in usersInRoom[atmRoom]) {
        if (i === atmUser) {
            return true;
        }
    }
    return false;
}


app.io.route('sendMessage', function (req) {
    
    if (req.data.message.toUpperCase() === correctAnswerForRoom[req.data.room].toUpperCase()) {
        req.io.emit('wrongInput');
        return;
    };
    req.io.emit('correctInput');
    var answers = [];
    
    req.io.join(req.data.room);
    
    var user = usersInRoom[req.data.room][req.data.username];
    usersInRoom[req.data.room][req.data.username] = { answer: req.data.message.toUpperCase(), points: user.points }; //u bodovanju prebrisati odgovore
    var counterUserInRoom = -1;
    var counterAnswerInRoom = 0;
    
    for (var i in usersInRoom[req.data.room]) {
        counterUserInRoom++;
       
       

        if (usersInRoom[req.data.room][i].answer !== "") {
            counterAnswerInRoom++;
            answers.push(usersInRoom[req.data.room][i].answer);
        }
        //console.log(i);
    };
    
    
    if (counterUserInRoom === counterAnswerInRoom) {
        console.log("svi su odgovorili");
        

        var randomizedUsersInRoom = randomizeUsersInRoom(req.data.room);
        

        req.io.room(req.data.room).broadcast('answersReady', {
            users : randomizedUsersInRoom
        });
        req.io.emit('answersReady', {
            users : randomizedUsersInRoom
        });
        
    }
   
});
app.io.route('lockRoom', function (req) {
    lockedRooms.push(req.data.roomName);
    var j = 0;
    //get USERS!!!!!!!!!!!!!!!!!!!111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
    var users = getUsers(req.data.roomName);
    //var users = usersInRoom[req.data.roomName];
    //console.log(users);
    //var usernames = [];
    //var points = [];
    //for (var i in users) {
      //  usernames.push(i);
        //points.push(users[i].points);
        //console.log(i + ' ' + users[i].points);
    //};

    req.io.emit('showUsersAndPoints', { users: users });
    sendQuestion(req);
});
app.io.route('checkRoomName', function (req) {
    console.log("tu sam");
    console.log(req.data.roomName);

    var doubleRoom = isInArray(rooms, req.data.roomName);
    if (doubleRoom) {
        req.io.emit('roomChecked', "");
    } else {
        req.io.emit('roomChecked', "ok");
    }
});

function pronounceWinners(users, others) {
    var winners = [];
    var maxPoints = 0;
    for (var i in users.sort(function (a, b) { return b.points - a.points;})) {
        if (maxPoints <= users[i].points) {
            maxPoints = users[i].points;
            winners.push(users[i]);
        } else {
            
            others.push(users[i]);
        }
    }
    return winners;
}

app.io.route('getQuestion', function (req) {
    console.log(questionCounter + ' < '+questionsInRoom[req.data.roomName].length);
    if (questionCounter <= questionsInRoom[req.data.roomName].length) {
        var users = getUsers(req.data.roomName);
        var others = [];
        var winners = pronounceWinners(users, others);
        var winnerPoints = 0;
        for (var i in winners) {
            winnerPoints = winners[i].points;
            break;
        }
        console.log('winners: ' + winners);
        console.log('others: ' + users);
        req.io.emit('gameOver', {winners: winners, winnerPoints: winnerPoints, others: others});
    } else {
        sendQuestion(req);
    }
});
/*app.io.route('DMWatching', function (req) {
	rooms.forEach(function (room) {
		req.io.join(room);
	});
	console.log(req.io.socket);
	DMSocket = req.io;
});*/
app.io.route('answered', function (req) {
    console.log('user: ' + req.data.username + ' in room: ' + req.data.room + ' answered: ' + req.data.answer);
    var user = usersInRoom[req.data.room][req.data.username];
    var correctAnswerPoints = 100;
    answeresInRoom[req.data.room] += 1;
    if (correctAnswerForRoom[req.data.room] === req.data.answer) {
        console.log('user ' + req.data.username + ' answered correctly');
        usersInRoom[req.data.room][req.data.username] = { answer: user.answer, points: (user.points + correctAnswerPoints) };
    } else {
        console.log('user ' + req.data.username + ' answered incorrectly');
        for (var i in usersInRoom[req.data.room]) {
            if (usersInRoom[req.data.room][i].answer === req.data.answer && i !== req.data.username) {
                user = usersInRoom[req.data.room][i];
                usersInRoom[req.data.room][i] = { answer: user.answer, points: (user.points + correctAnswerPoints) };
                console.log('user ' + i + ' gets points for lying');
            }
        }
    }
    
   
    console.log(answeresInRoom[req.data.room] + '===' + objectsInArray(usersInRoom[req.data.room]));
    if (answeresInRoom[req.data.room] === objectsInArray(usersInRoom[req.data.room])) {
        app.io.room(req.data.room).broadcast('allAnswered', { users: getUsers(req.data.room) , corrans: correctAnswerForRoom[req.data.room] });
        for (var i in usersInRoom[req.data.room]) {
            user = usersInRoom[req.data.room][i];
            usersInRoom[req.data.room][i] = { answer: "", points: user.points }
        }
    }
    
});

app.listen(app.get('port'));

function isInArray(array, obj) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === obj)
            return true;
    }
    return false;
}

function objectsInArray(array) {
    var counter = -1;
    for (var i in array) { counter++;}
    return (counter);
}

function sendQuestion(req) {
    var conn = new sql.Connection(config);
    var request = new sql.Request(conn);
    var contains = true;
    var numberOfRecordsInDB = 0;
    var questionID = 0;
    answeresInRoom[req.data.roomName] = 0;
    console.log('users in room: ' + objectsInArray(usersInRoom[req.data.roomName]));
    var rnd = (Math.floor(Math.random() * objectsInArray(usersInRoom[req.data.roomName])));
    console.log(rnd);
    //randomCounterForRoom[req.data.roomName] = rnd;
    //console.log('rcfr: ' + randomCounterForRoom[req.data.roomName]);
    

    conn.connect(function (err) {
        if (err) {
            console.log(err);
            return;
        };
        
        
        request.query("SELECT COUNT(*) AS numberOfRecords FROM Question", function (err, recordset) {
            if (err) {
                console.log(err);
            }
            else {
                console.log('recordset: ' + recordset[0].numberOfRecords);
                do {
                    var x = Math.floor(Math.random() * recordset[0].numberOfRecords);
                    console.log('x: ' + x);
                    contains = isInArray(questionsInRoom[req.data.roomName], x);
                } while (contains);
                console.log("izašo sam iz vajl petlje");
                questionsInRoom[req.data.roomName].push(x);
                request.query("SELECT * FROM Question WHERE questionID = " + x.toString(), function (err, recordset) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        var users = getUsers(req.data.roomName).sort(function (a, b) { return b.points - a.points });
                        correctAnswerForRoom[req.data.roomName] = recordset[0].answer.toUpperCase();
                        

                        req.io.emit('questionSent', { message: recordset[0].question, users: users });
                        req.io.room(req.data.roomName).broadcast('clientAddAnswer');
                    } 
                });

            } conn.close();
        });
        
    });  
}

function getRightAnswer(questionID, req, type) {
    /*var conn = new sql.Connection(config);
    var request = new sql.Request(conn);
    
    conn.connect(function (err) {
        if (err) {
            console.log(err);
            console.log('returning: empty string');
            return '';
        };
        request.query("SELECT answer FROM Question WHERE questionID = " + questionID.toString(), function (err, recordset) {
            if (err) {
                console.log(err);
                console.log('returning: empty string');
                return '';
            }
            else {
                console.log(recordset[0].answer);
                correctAnswerForRoom[req.data.room] = recordset[0].answer;
                console.log('correct answer: ' + correctAnswerForRoom[req.data.room]);*/
                req.io.room(req.data.room).broadcast('announce', {
                    answer: correctAnswerForRoom[req.data.room],
                    i: 'root',
                });
                req.io.emit('announce', {
                    answer: correctAnswerForRoom[req.data.room],
                    i: 'root'
                });/*
                
                
                console.log('returning: ' + recordset[0].answer);
                return recordset[0].answer;
            }
            conn.close();
        });
    });
    return '';*/
}


function getUsers(roomName) {
    var users = [];
    for (var i in usersInRoom[roomName]) {
        if (i !== 'root') {
            users.push({ username: i,answer: usersInRoom[roomName][i].answer, points: usersInRoom[roomName][i].points });
        }
    }
    return users;
}

function isAnswerCopy(atmRoom, atmAnswer) {
    for (var i in usersInRoom[atmRoom]) {
        if (usersInRoom[atmRoom][i].answer === atmAnswer) {
            console.log(i);
            console.log(atmAnswer);
            return true;
        }
    }
    return false;
}



function randomizeArray(array) {
    var newIndex = 0;
    var oldValue = "";
    for (var i = 0; i < array.length; i++) {
        newIndex = Math.floor(Math.random() * array.length);
        oldValue = array[i];
        array[i] = array[newIndex];
        array[newIndex] = oldValue;
    }
}

function randomizeUsersInRoom(room) {
    var usernames = [];
    var usersInRoomRandomized = [];
    var answers = [];
    var blockedUsernames = [];
    var sameAnswerCounter = 0;
    console.log('randomiziram sobu: ' + room);
    for (var i in usersInRoom[room]) {
        usernames.push(i);
        if (typeof blockedUsernames[usersInRoom[room][i].answer.toUpperCase()] === 'undefined') 
            blockedUsernames[usersInRoom[room][i].answer.toUpperCase()] = [i];
        else {
            blockedUsernames[usersInRoom[room][i].answer.toUpperCase()].push(i);
            sameAnswerCounter++;
        }
    }
    console.log(blockedUsernames);
    randomizeArray(usernames);
    console.log('randomizirani usernameovi: ' + usernames);
    
    var arrayLength = usernames.length - sameAnswerCounter - 2;
    console.log('arrayLenght: ' + arrayLength);
    var indexForCorrectAnswer = Math.floor(Math.random() * arrayLength);

    for (var i = 0; i < usernames.length; i++) {
        var answer = usersInRoom[room][usernames[i]].answer;
        if (isInArray(answers, answer)) {
            answer = '';
        } else {
            answers.push(answer);
        }
        if(i === indexForCorrectAnswer)
            usersInRoomRandomized.push({ username: '', answer: correctAnswerForRoom[room] });
        if (answer !== '' && usernames[i] !== 'root') {
            console.log('količina istih odgovora: ' + blockedUsernames[answer.toUpperCase()].length);
            if (blockedUsernames[answer.toUpperCase()].length > 1) {
                usersInRoomRandomized.push({ username: '', answer: answer });
            } else {
                usersInRoomRandomized.push({ username: usernames[i], answer: answer });
            }

        };
        
    }
  
    console.log(usersInRoomRandomized);
    return usersInRoomRandomized;
};
