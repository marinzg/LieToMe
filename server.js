/*var http = require('http');
var port = process.env.port || 1337;
http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World\n');
}).listen(port);*/


/**
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
    //server: "localhost\\MSSQLSERVER",    //MARIN
    server: "localhost\\SQLEXPRESS",    //LINA
    database: "LieToMeDB",
    user: "sa",
    //password: "n4KmgANB"        //MARIN
    password : "tbbt"           //LINA
};


var questionsInRoom = [];
questionsInRoom["Elfs"] = [];
questionsInRoom["Random"] = [];
usersInRoom["Elfs"] = [];
usersInRoom["Random"] = [];

var randomCounterForRoom = [];
//randomCounterForRoom["Elfs"] = 0;
//randomCounterForRoom["Random"] = 0;

var correctAnswerForRoom = [];
var answeresInRoom = [];
answeresInRoom["Elfs"] = 0;
answeresInRoom["Random"] = 0;



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
    
    if (indexMessage !== '') {
        indexMessage = '';
        res.render('home', { title: 'LieToMe' , rooms: rooms, message: 'Unesite ispravno korisničko ime.' });
    } else {
        res.render('home', { title: 'LieToMe' , rooms: rooms, message: '' });
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
        randomCounterForRoom[req.params.id] = 0;
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

function isAnswerCopy(atmRoom, atmAnswer){
    for (var i in usersInRoom[atmRoom]) {
        
        if (usersInRoom[atmRoom][i].answer === atmAnswer) {
            return true;
        }
    }
    return false;

}
app.io.route('sendMessage', function (req) {
    
    var doubleAnswer = isAnswerCopy(req.data.room, req.data.message);
    if (req.data.message === correctAnswerForRoom[req.data.room] || doubleAnswer) {
    }
    
    var answers = [];
    
    req.io.join(req.data.room);
    
    //display correct answer
    if (randomCounterForRoom[req.data.room] === 0) {
        var questionID = questionsInRoom[req.data.room].pop(); //dobio id točnog odgovora
        questionsInRoom[req.data.room].push(questionID);
        getRightAnswer(questionID, req);
        
        //console.log('right answer sent: ' + correctAnswer);
    };
    randomCounterForRoom[req.data.room]--;
    req.io.room(req.data.room).broadcast('announce', {
        answer: req.data.message,
        i: req.data.username,
    });
    var user = usersInRoom[req.data.room][req.data.username];
    usersInRoom[req.data.room][req.data.username] = { answer: req.data.message, points: user.points }; //u bodovanju prebrisati odgovore
    var counterUserInRoom = -1;
    var counterAnswerInRoom = 0;
    var answers = [];
    
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
        
        req.io.room(req.data.room).broadcast('answersReady', {
            answers: answers
        });
        req.io.emit('answersReady', {
            answers: answers
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

app.io.route('getQuestion', function (req) {
    sendQuestion(req);
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
            if (usersInRoom[req.data.room][i].answer === req.data.answer) {
                user = usersInRoom[req.data.room][i];
                usersInRoom[req.data.room][i] = { answer: user.answer, points: (user.points + correctAnswerPoints) };
                console.log('user ' + i + ' gets points for lying');
                break;
            }
        }
    }
    
   
    console.log(answeresInRoom[req.data.room] + '===' + objectsInArray(usersInRoom[req.data.room]));
    if (answeresInRoom[req.data.room] === objectsInArray(usersInRoom[req.data.room])) {
        for (var i in usersInRoom[req.data.room]) {
            user = usersInRoom[req.data.room][i];
            usersInRoom[req.data.room][i] = { answer: "", points: user.points }
        }

        app.io.room(req.data.room).broadcast('allAnswered');
        console.log('all checked their answers');
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
    randomCounterForRoom[req.data.roomName] = rnd;
    console.log('rcfr: ' + randomCounterForRoom[req.data.roomName]);
    

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
                //console.log("SELECT * FROM Question WHERE questionID = " + x.toString());
                request.query("SELECT * FROM Question WHERE questionID = " + x.toString(), function (err, recordset) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        var users = getUsers(req.data.roomName);
                        correctAnswerForRoom[req.data.roomName] = recordset[0].answer;
                        

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

  
