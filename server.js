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
    server: "localhost\\MSSQLSERVER",
    database: "LieToMeDB",
    user: "sa",
    password: "n4KmgANB"
};
var questionsInRoom = [];
questionsInRoom["Elfs"] = [];
questionsInRoom["Random"] = [];

passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});
/*passport.use(new LocalStrategy(function (username, password, done) {
	if (username === "dana")
		return done(null, { id: 1, username: "dana", password: "no" });
}));*/

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}
app.get('/', function (req, res) {
    
    res.render('index');

});

app.get('/create', function (req, res) {
    
    res.render('createroom', { title: 'LieToMe Room Create' });

});
/*app.get('/login', function (req, res) {
	
	res.render('login', { title: 'DMITAR Chat Room Super Secret DM login' });

});*/
app.get('/about', function (req, res) {
    
    res.render('about', { title: '' });

});
app.get('/rooms/:id', function (req, res) {
    if (rooms.indexOf(req.params.id) === -1) {
        rooms.push(req.params.id);
        console.log(rooms);
    }
    if (!isInArray(lockedRooms, req.params.id)) {
        //render the room template with the name of the room for the underlying data model
        res.render('room', { title : req.params.id, username : req.query.username });
    } else {
        indexMessage = 'ne bu išlo';
        res.redirect('home');
    }
        
});
/*app.get('/dm/:user', function (req, res) {
	console.log(req.params.user);
	res.render('dmview', { title: 'Server.', rooms: rooms, user: req.params.user });

});*/

app.get('/server', function (req, res) {
    
    res.render('server', { rooms: rooms });
});
app.get('/home', function (req, res) {
    
    if (indexMessage !== '') {
        indexMessage = '';
        res.render('home', { title: 'LieToMe' , rooms: rooms, message: 'ne bu išlo' });
    } else {
        res.render('home', { title: 'LieToMe' , rooms: rooms, message: '' });
    }
});

app.get('/serverRoom/:id', function (req, res) {
    if (rooms.indexOf(req.params.id) === -1) {
        rooms.push(req.params.id);
        console.log(rooms);
        questionsInRoom[req.params.id] = [];
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
    console.log('Recieved real-time ready message from user: ' + req.data.username + ' for room: ' + req.data.room);
    req.io.join(req.data.room);
    req.io.room(req.data.room).broadcast('userConnected', {
        message: req.data.username + ' just joined the room. ',
        username: req.data.username
    });
});
app.io.route('sendMessage', function (req) {
    
    console.log('recieved message : ' + req.data.message + ' for room ' + req.data.room + ' from user ' + req.data.username);
    req.io.join(req.data.room);
    req.io.room(req.data.room).broadcast('announce', {
        message: req.data.message,
        username: req.data.username,
        room: req.data.room
    });
});
app.io.route('lockRoom', function (req) {
    lockedRooms.push(req.data.roomName);
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


app.listen(app.get('port'));

function isInArray(array, obj) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === obj)
            return true;
    }
    return false;
}

function nada () {};

function sendQuestion(req) {
    var conn = new sql.Connection(config);
    var request = new sql.Request(conn);
    
    
    conn.connect(function (err) {
        if (err) {
            console.log(err);
            return;
        };
        request.query("SELECT * FROM Question", function (err, recordset) {
            if (err) {
                console.log(err);
            }
            else {
                do {
                    var x = Math.floor(Math.random() * recordset.length);

                } while (questionsInRoom[req.data.roomName].contains(x));
                questionsInRoom[req.data.roomName].push(x);
                req.io.emit('questionSent', { message: recordset[x].question });
            }
            conn.close();
        });
        //while (wait) {};
        //console.log(questions);
        
    });
}

Array.prototype.contains = function (obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}