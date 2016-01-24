/**
 * Module dependencies.
 */
var express = require('express.io');
var http = require('http');
var path = require('path');
var sql = require('mssql');
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
app.use(app.router);

//db connection string
var config = {
    server: "localhost\\MSSQLSERVER",   //MARIN
    //server: "localhost\\SQLEXPRESS",    //LINA
    database: "LieToMeDB",
    user: "sa",
    password: "n4KmgANB"                //MARIN
    //password : "tbbt"                   //LINA
    //password: "projekt"                 //MARTINA
};

//define variables
var correctAnswerPoints = 100;
var minUsersPerRoom = 3;
var numberOfQuestions = 2;
var questionsInRoom = [];
var usersInRoom = [];
var rooms = [];
var lockedRooms = [];
var correctAnswerForRoom = [];
var answeresInRoom = [];
var indexMessage = '';


if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}
    
//controllers, HTTP GET
app.get('/', function (req, res) {
    res.render('index', { title: 'LieToMe' });
});    
app.get('/create', function (req, res) {
    res.render('createroom', { title: 'LieToMe Room Create' });
});
app.get('/serverRoom/:id', function (req, res) {
    /* Contidion is true when creating room. 
     * It's here for user control.
     */ 
    if (rooms.indexOf(req.params.id) === -1) {
        rooms.push(req.params.id);
        console.log(rooms);
        questionsInRoom[req.params.id] = [];
        usersInRoom[req.params.id] = [];
        answeresInRoom[req.params.id] = 0;
    }
    res.render('serverRoom', { title : req.params.id, username: 'root' });
});
app.get('/home', function (req, res) {
    var x = [];
    
    //"Hide" locked rooms from users
    for (var i in rooms) {
        if (!isInArray(lockedRooms, rooms[i])) {
            x.push(rooms[i]);
        }
    }
    res.render('home', { title: 'LieToMe' , rooms: x });
});  
app.get('/rooms/:id', function (req, res) {
    /** Room doesn't exist.
     * Trigered when user presses back button
     * after he's been kicked out of the room
     * after the end of the game.
     */
    if (rooms.indexOf(req.params.id) === -1) {
        var argMessage = 'Soba ne postoji!';
        var argLocation = '/';
        var argArgument = '';
        req.io.emit('errorHandle', { message: argMessage, location: argLocation, argument: argArgument });
        return;
    }
    
    //normal room joining
     res.render('room', { title : req.params.id, username : req.query.username });
});



//Routes (Setup the ready routes)
/*handle wrong username or roomName*/
app.io.route('checkUsernameAndRoom', function (req) {
    var argMessage = '';
    var argLocation = 'home';
    var argArgument = '';
    
    //room doesn't exist
    if (rooms.indexOf(req.data.roomName) === -1) {
        argMessage = 'Tražena soba ne postoji!';
        req.io.emit('errorHandle', { message: argMessage, location: argLocation, argument: argArgument });
        return;
    }
    
    //empty username
    if (req.data.username === "") {
        argMessage = 'Unesite ispravno korisničko ime.';
        req.io.emit('errorHandle', { message: argMessage, location: argLocation, argument: argArgument });
        return;
    }
    
    //room is locked
    if (isInArray(lockedRooms, req.data.roomName)) {
        argMessage = 'Soba je zaključana';
        req.io.emit('errorHandle', { message: argMessage, location: argLocation, argument: argArgument });
        return;
    }
    
    //username is duplicate
    var doubleUser = isInRoom(req.data.roomName, req.data.username);
    if (doubleUser) {
        argMessage = 'Već postoji korisnik s istim korisničkim imenom.';
        argLocation = '';
        argArgument = '#usernameTextBox';
        req.io.emit('errorHandle', { message: argMessage, location: argLocation, argument: argArgument });
        return;
    }
    
    req.io.emit('logonOK');
});
app.io.route('checkRoomName', function (req) {
    var doubleRoom = isInArray(rooms, req.data.roomName);
    if (doubleRoom) {
        req.io.emit('roomChecked', "");
    } else {
        req.io.emit('roomChecked', "ok");
    }
});

/*Connect user (browser) to a room. Save sockets for further communication.*/
app.io.route('userConnected', function (req) {
    req.io.join(req.data.roomName);
    req.io.room(req.data.roomName).broadcast('userConnected', {
        message: req.data.username + ' je u sobi. ',
        username: req.data.username
    });
    
    //room doesn't exist
    if (rooms.indexOf(req.data.roomName) === -1) {
        var argMessage = 'Soba ne postoji';
        var argLocation = '/';
        var argArgument = '';
        req.io.emit('errorHandle', { message: argMessage, location: argLocation, argument: argArgument });
        return;
    }
    usersInRoom[req.data.roomName][req.data.username] = { answer: "", points: 0 };
});

app.io.route('lockRoom', function (req) {
    var usersInThisRoom = objectsInArray(usersInRoom[req.data.roomName]);
    
    //handle not enough users in room error
    if (usersInThisRoom < minUsersPerRoom) {
        var dif = minUsersPerRoom - usersInThisRoom;
        var argMessage = 'Nije moguće zaključati sobu. '
        if (dif !== 1)
            argMessage += 'Nedostaju još ' + (minUsersPerRoom - usersInThisRoom) + ' korisnika.';
        else
            argMessage += 'Nedostaje još ' + (minUsersPerRoom - usersInThisRoom) + ' korisnik.';
        
        var argLocation = '';
        var argArgument = '';
        req.io.emit('errorHandle', { message: argMessage, location: argLocation, argument: argArgument });
        return;
    }
    
    //lock room
    lockedRooms.push(req.data.roomName);
    
    //show initial leaderboard
    var users = getUsers(req.data.roomName);
    req.io.emit('showUsersAndPoints', { users: users });
    
    sendQuestion(req);
});
app.io.route('getQuestion', function (req) {
    var length = questionsInRoom[req.data.roomName].length;
    
    if (!(length % numberOfQuestions)) {
        var users = getUsers(req.data.roomName);
        var others = [];
        var winners = pronounceWinners(users, others);
        var winnerPoints = 0;
        for (var i in winners) {
            winnerPoints = winners[i].points;
            break;
        }
        //add one element for next modulo operation
        questionsInRoom[req.data.roomName].push(-1);
        req.io.emit('roundOver', { winners: winners, winnerPoints: winnerPoints, others: others });
    } else {
        //remove -1 if exsists
        var indexOf = questionsInRoom[req.data.roomName].indexOf(-1);
        if (indexOf !== -1)
            questionsInRoom[req.data.roomName].splice(indexOf, 1);
        
        sendQuestion(req);
    }
});
app.io.route('sendMessage', function (req) {
    //users are not allowed to provide correct answer, they have to LIE
    if (req.data.message.toUpperCase() === correctAnswerForRoom[req.data.roomName].toUpperCase()) {
        req.io.emit('wrongInput');
        return;
    };

    req.io.emit('correctInput');
        
    var user = usersInRoom[req.data.roomName][req.data.username];
    usersInRoom[req.data.roomName][req.data.username] = { answer: req.data.message.toUpperCase(), points: user.points };
    var counterUserInRoom = objectsInArray(usersInRoom[req.data.roomName]);
    var counterAnswerInRoom = 0;
    
    for (var i in usersInRoom[req.data.roomName]) {
        if (usersInRoom[req.data.roomName][i].answer !== "") {
            counterAnswerInRoom++;
        }
    }
    
    //everyone answered
    if (counterUserInRoom === counterAnswerInRoom) {
        var randomizedUsersInRoom = randomizeUsersInRoom(req.data.roomName);
        app.io.room(req.data.roomName).broadcast('answersReady', { users : randomizedUsersInRoom });
    }
});
app.io.route('answered', function (req) {
    var user = usersInRoom[req.data.roomName][req.data.username];
    answeresInRoom[req.data.roomName] += 1;
    
    //user answered correctly
    if (correctAnswerForRoom[req.data.roomName] === req.data.answer) {
        console.log('user ' + req.data.username + ' answered correctly');
        usersInRoom[req.data.roomName][req.data.username] = { answer: user.answer, points: (user.points + correctAnswerPoints) };
    //user bought a lie
    } else {
        console.log('user ' + req.data.username + ' answered incorrectly');
        for (var i in usersInRoom[req.data.roomName]) {
            if (usersInRoom[req.data.roomName][i].answer === req.data.answer && i !== req.data.username) {
                user = usersInRoom[req.data.roomName][i];
                usersInRoom[req.data.roomName][i] = { answer: user.answer, points: (user.points + correctAnswerPoints) };
                console.log('user ' + i + ' gets points for lying');
            }
        }
    }
    
    //everyone clicked given answers
    if (answeresInRoom[req.data.roomName] === objectsInArray(usersInRoom[req.data.roomName])) {
        app.io.room(req.data.roomName).broadcast('allAnswered', { users: getUsers(req.data.roomName).sort(function (a, b) { return b.points - a.points }) , corrans: correctAnswerForRoom[req.data.roomName] });
        for (var i in usersInRoom[req.data.roomName]) {
            user = usersInRoom[req.data.roomName][i];
            usersInRoom[req.data.roomName][i] = { answer: "", points: user.points }
        }
    }
});

/*free resources*/
app.io.route('gameOver', function (req) {
    var room = req.data.roomName;
    
    var roomIndex = rooms.indexOf(room);
    var deletedRooms = rooms.splice(roomIndex, 1);
    
    var lockedRoomIndex = lockedRooms.indexOf(room);
    var unlockedRoom = lockedRooms.splice(lockedRoomIndex, 1);
    
    var removedQuestionInRoom = delete questionsInRoom[room];
    
    var removedUsersInRoom = delete usersInRoom[room];
    
    var deletedCorrectAnswersForRoom = delete correctAnswerForRoom[room];
    
    var deletedAnswersInRoom = delete answeresInRoom[room];
    
    app.io.room(room).broadcast('endGame');
    console.log('Game in room ' + room + 'has ended.');
});
app.listen(app.get('port'));



//functions
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

/* Function gets question from
 * database, and sends it to
 * main screen.
 */
function sendQuestion(req) {
    var conn = new sql.Connection(config);
    var request = new sql.Request(conn);
    var contains = true;
    var numberOfRecordsInDB = 0;
    var questionID = 0;
    answeresInRoom[req.data.roomName] = 0;
    var rnd = (Math.floor(Math.random() * objectsInArray(usersInRoom[req.data.roomName])));

    conn.connect(function (err) {
        if (err) { console.log(err); return; };
        request.query("SELECT COUNT(*) AS numberOfRecords FROM Question", function (err, recordset) {
            if (err) { console.log(err);}
            else {
                //find new question
                do {
                    var x = Math.floor(Math.random() * recordset[0].numberOfRecords);
                    contains = isInArray(questionsInRoom[req.data.roomName], x);
                } while (contains);
                questionsInRoom[req.data.roomName].push(x);
                
                request.query("SELECT * FROM Question WHERE questionID = " + x.toString(), function (err, recordset) {
                    if (err) {console.log(err);}
                    else {
                        correctAnswerForRoom[req.data.roomName] = recordset[0].answer.toUpperCase();
                        req.io.emit('questionSent', { message: recordset[0].question});
                        req.io.room(req.data.roomName).broadcast('clientAddAnswer');
                    } 
                });
            } conn.close();
        });
                
    });
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
function randomizeUsersInRoom(roomName) {
    var usernames = [];
    var usersInRoomRandomized = [];
    var answers = [];
    var usersWhoAnswered = [];
    var sameAnswerCounter = 0;
    
    /* Check how many same answers or
     * groups of same answers are there.
     */
    for (var i in usersInRoom[roomName]) {
        usernames.push(i);
        if (typeof usersWhoAnswered[usersInRoom[roomName][i].answer] === 'undefined') 
            usersWhoAnswered[usersInRoom[roomName][i].answer] = [i];
        else {
            usersWhoAnswered[usersInRoom[roomName][i].answer].push(i);
            sameAnswerCounter++;
        }
    }
    
    randomizeArray(usernames);
    
    var arrayLength = usernames.length - sameAnswerCounter - 1;
    var indexForCorrectAnswer = Math.floor(Math.random() * arrayLength);
 
    for (var i = 0; i < usernames.length; i++) {
        var answer = usersInRoom[roomName][usernames[i]].answer;
        if (isInArray(answers, answer)) {
            answer = '';
        } else {
            answers.push(answer);
        }
        if (i === indexForCorrectAnswer)
            usersInRoomRandomized.push({ username: '', answer: correctAnswerForRoom[roomName] });
        if (answer !== '' && usernames[i] !== 'root') {
            if (usersWhoAnswered[answer].length > 1) {
                usersInRoomRandomized.push({ username: '', answer: answer });
            } else {
                usersInRoomRandomized.push({ username: usernames[i], answer: answer });
            }
        };
    }
    return usersInRoomRandomized;
}    
function isInRoom(atmRoom, atmUser) {
    for (var i in usersInRoom[atmRoom]) {
        if (i === atmUser) {
            return true;
        }
    }
    return false;
    }
function pronounceWinners(users, others) {
    var winners = [];
    var maxPoints = 0;
    for (var i in users.sort(function (a, b) { return b.points - a.points; })) {
        if (maxPoints <= users[i].points) {
            maxPoints = users[i].points;
            winners.push(users[i]);
        } else {
            others.push(users[i]);
        }
    }
    return winners;
}