var io = io.connect();



/*create and join room*/
io.on('userConnected', function (data) {
    if (document.getElementById('consoleHolder').style.display === 'none')
        document.getElementById('consoleHolder').style.display = 'block';
    $('#console').append('<p>' + data.message + '</p>');
});
io.on('logonOK', function () {
    window.location = 'rooms/' + roomName + '?username=' + $('#usernameTextBox').val();
});
io.on('roomChecked', function (message) {
    if (message === 'ok') {
        window.location = 'serverRoom/' + $('#roomTextBox').val() + '?username=' + 'root';
    } else {
        alert("Soba već postoji");
        $('#roomTextBox').val("");
    }
});

/*start game*/
io.on('showUsersAndPoints', function (data) {
    document.getElementById('lockButton').style.display = 'none';
    document.getElementById('console').innerHTML = "";
    document.getElementById('console').style.display = 'none';
    document.getElementById('leaderBoard').style.display = 'block';
    $('#leaderBoard').append('<tr><th>korisnici</th><th >bodovi</th></tr>');
    for (var i in data.users) {
        $('#leaderBoard').append('<tr><td>' + data.users[i].username + '</td>  <td>' + data.users[i].points + '</td></tr>');
    };
});
io.on('questionSent', function (data) {
    if (document.getElementById('questionHolder').style.display === 'none')
        document.getElementById('questionHolder').style.display = 'block';
    document.getElementById('question').innerHTML = "";
    $('#question').append('<p class="question">' + data.message + '</p>');

    document.getElementById('answersHolder').style.display = 'none';
});
io.on('clientAddAnswer', function () {
    spinner.stop(target);
    document.getElementById('sendButton').style.display = 'block';
    document.getElementById('chatTextBox').style.display = 'block';
    document.getElementById('answers').innerHTML = "";
    document.getElementById('answersList').innerHTML = "";
});

/*control user input*/
io.on('wrongInput', function () {
    alert('Odgovor je istinit, unesite novi odgovor!');
    $('#chatTextBox').val(''); //clears the message text box
});
io.on('correctInput', function () {
    document.getElementById('sendButton').style.display = 'none';
    document.getElementById('chatTextBox').style.display = 'none';
    $('#chatTextBox').val(''); //clears the message text box
    document.getElementById('spin').style.display = 'block';
    spinner.spin(target);
});

/*all users submited their answers*/
io.on('answersReady', function (data) {
    for (var i in data.users) {
        var user = data.users[i];
        if (user.username.localeCompare(userName)) {
            $('#answers').append('<button class="btn btn-default" onClick=\"gotAnswer(\'' + user.answer + '\')\">' + user.answer + '</button><p></p>');
        }
        $('#answersList').append('<p class="answer">' + user.answer + '</p>');
    };
    document.getElementById('answersHolder').style.display = 'block';
    spinner.stop(target);
});

/*all users clicked on answer they think is correct*/
io.on('allAnswered', function (data) {
    if (userName === 'root') {
        document.getElementById('answersList').innerHTML = "";
        document.getElementById('answersHolder').style.display = 'none';
        document.getElementById('authorsList').innerHTML = "";
        document.getElementById('leaderBoard').innerHTML = '';
        if (document.getElementById('consoleHolder').style.display === 'none')
            document.getElementById('consoleHolder').style.display = 'block';
        $('#leaderBoard').append('<tr><th>korisnici</th><th>bodovi</th></tr>');
        for (var i in data.users) {
            $('#leaderBoard').append('<tr><td>' + data.users[i].username + '</td>  <td >' + data.users[i].points + '</td></tr>');
        };
        
        showAuthors(data);
        
        setTimeout(function () {
            document.getElementById('authorsHolder').style.display = 'none';
            io.emit('getQuestion', { roomName : roomName, newRound: 0 });
        }, 6000);
    }
});

/*manage end of a round*/
io.on('roundOver', function (data) {
    document.getElementById('questionHolder').style.display = 'none';
    document.getElementById('answersHolder').style.display = 'none';
    document.getElementById('consoleHolder').style.display = 'none';
    
    document.getElementById('newRound').style.display = 'block';
    document.getElementById('quitGame').style.display = 'block';
    document.getElementById('winner').innerHTML = '';
    document.getElementById('finalLeaderBoardTable').innerHTML = '';
    document.getElementById('finalLeaderBoard').style.display = 'block';
    
    var winners = "";
    var noOfWinners = 0;
    for (var i in data.winners) {
        winners += data.winners[i].username + ', ';
        noOfWinners++;
    }
    
    winners = winners.substring(0, winners.length - 2);
    if (noOfWinners <= 1) {
        $('#winner').append('<h2>Pobjednik je ' + winners + '    (broj bodova: ' + data.winnerPoints + ')' + '</h2>');
    } else {
        $('#winner').append('<h2>Pobjednici su ' + winners + '    (broj bodova: ' + data.winnerPoints + ')' + '</h2>');
    }
    $('#winner').append('<p></p>')
    for (var i in data.others) {
        $('#finalLeaderBoardTable').append('<tr><td style="text-align: end">' + data.others[i].username + '</td>  <td >' + data.others[i].points + '</td></tr>');
    }
});

/*manage end of the game*/
io.on('endGame', function () {
    window.location = '/';
});
io.on('userDisconected', function (data) {
    $('#conversation').append('<p>' + data.username + 'has disconnected. </p>');
});

/*handle errors*/
io.on('errorHandle', function (data) {
    alert(data.message);
    if (data.location !== '') {
        window.location = data.location;
    };
    if (data.argument !== '') {
        $(data.argument).val('');
    };
    
});



//buttons
$('#joinButton').click(function (evt) {
    if (roomName === undefined) alert("Odaberi sobu");
    else {
        io.emit('checkUsernameAndRoom', { username: $('#usernameTextBox').val(), roomName: roomName });
    }
    return;
});
$('#lockButton').click(function (evt) {
    io.emit('lockRoom', { roomName: roomName });
});
$('#sendButton').click(function () {
    var messageText = $('#chatTextBox').val();
    if (messageText === "" || messageText === "undefined") {
        alert("Nije dozvoljen prazan unos!");
    } else {
        var messagePayload = { message: messageText, roomName: roomName, username: userName };
        io.emit('sendMessage', messagePayload);
    }
});
$('#newRound').click(function (evt) {
    document.getElementById('consoleHolder').style.display = 'block';
    document.getElementById('newRound').style.display = 'none';
    document.getElementById('quitGame').style.display = 'none';
    document.getElementById('finalLeaderBoard').style.display = 'none';
    document.getElementById('authorsHolder').style.display = 'none';
    
    io.emit('getQuestion', { roomName : roomName, newRound: 1 });
});
$('#quitGame').click(function (evt) {
    io.emit('gameOver', { roomName : roomName });
});



//functions
/*Function gets called when user presses an 
 * answer they think is correct.
 * It's added to button html in io.on('answersReady').
 */
function gotAnswer(ans) {
    document.getElementById('answersHolder').style.display = 'none';
    spinner.spin(target);
    io.emit('answered', { username: userName, answer: ans, roomName: roomName });
}

/*Function displays correct answer
 * and who gave each of the given answers. 
 */ 
function showAuthors(author) {
    document.getElementById('authorsHolder').style.display = 'block';

    $('#authorsList').append('<h3>' + 'Točan odgovor je : ' + '<font color=\"green\"> ' + author.corrans + '</font>' +'</h3>'); //<font color="red">This is some text!</font>
    setTimeout(function () {
        for (var i in author.users) {
            $('#authorsList').append('<p>' + author.users[i].username + ': ' + author.users[i].answer + '</p>');
        };
    }, 1000);
}