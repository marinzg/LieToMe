var io = io.connect();
/*
 *  put answers on server not as buttons
 *  hide answes on server until all answered 
 * 
 */


io.on('announce', function (data) {
    //$('#answers').append('<button class="btn btn-default" onClick=\"gotAnswer(\'' + data.answer + '\')\">' + data.answer + '</button><p></p>');
    //$('#answersList').append('<p class="answer">' + data.answer + '</p>');
});

io.on('userConnected', function (data) {
    if (document.getElementById('consoleHolder').style.display === 'none')
        document.getElementById('consoleHolder').style.display = 'block';
    $('#console').append('<p>' + data.message + '</p>');
});

io.on('questionSent', function (data) {
    if (document.getElementById('questionHolder').style.display === 'none')
        document.getElementById('questionHolder').style.display = 'block';
    document.getElementById('question').innerHTML = "";
    $('#question').append('<p class="question">' + data.message + '</p>');
    
    
    
    document.getElementById('answersHolder').style.display = 'none';
});

io.on('nonExistingRoom', function () {
    alert('Tražena soba ne postoji!');
    window.location = '/';

});

io.on('showUsersAndPoints', function (data) {
    document.getElementById('lockButton').style.display = 'none';
    document.getElementById('console').innerHTML = "";
    document.getElementById('console').style.display = 'none';
    document.getElementById('leaderBoard').style.display = 'block';
    $('#leaderBoard').append('<tr><th>korisnici</th><th >bodovi</th></tr>');
    for (var i in data.users) {
        $('#leaderBoard').append('<tr><td>'+ data.users[i].username +'</td>  <td>'+data.users[i].points+'</td></tr>');
    };
    //for (var i in data.users) {
    //    $('#console').append('<p>' + data.users[i].username + ' ' + data.users[i].points + '</p>');
    //}
});

io.on('clientAddAnswer', function () {
    spinner.stop(target);
    document.getElementById('sendButton').style.display = 'block';
    document.getElementById('chatTextBox').style.display = 'block';
    document.getElementById('answers').innerHTML = "";
    document.getElementById('answersList').innerHTML = "";
});

io.on('notEnoughUsers', function () { 
    alert('Nije moguće zaključati sobu. Nije dovoljan broj igrača!');
});

io.on('answersReady', function (data) {
    for (var i in data.users) {
        var user = data.users[i];
        //alert(user.username + ' === ' + userName + '->' +user.username.localeCompare(userName) + ' '+ user.answer + ' cmp (ništa) ' + user.answer.localeCompare(''));
        if (user.username.localeCompare(userName)) {
            $('#answers').append('<button class="btn btn-default" onClick=\"gotAnswer(\'' + user.answer + '\')\">' + user.answer + '</button><p></p>');
        }
        //$('#answers').append('<button class="btn btn-default" onClick=\"gotAnswer(\'' + data.answers[i].answer + '\')\">' + data.answers[i].answer + '</button><p></p>');
        $('#answersList').append('<p class="answer">' + user.answer + '</p>');
    };
    document.getElementById('answersHolder').style.display = 'block';
    spinner.stop(target);
});

io.on('allAnswered', function (data) {
    //alert('all answered');
    if (userName === 'root') {
        //alert('its root');
        document.getElementById('answersList').innerHTML = "";
        document.getElementById('answersHolder').style.display = 'none';
        document.getElementById('authorsList').innerHTML = "";
        
        //updateLeaderBoard
        document.getElementById('leaderBoard').innerHTML = '';
        if (document.getElementById('consoleHolder').style.display === 'none')
            document.getElementById('consoleHolder').style.display = 'block';
        $('#leaderBoard').append('<tr><th>korisnici</th><th>bodovi</th></tr>');
        for (var i in data.users) {
            $('#leaderBoard').append('<tr><td>' + data.users[i].username + '</td>  <td >' + data.users[i].points + '</td></tr>');
        };
        

        showAuthors(data);
       // alert("poslije");
        setTimeout(function () {
            document.getElementById('authorsHolder').style.display = 'none';
            io.emit('getQuestion', { roomName : roomName, newRound: 0 });
        }, 6000);
        
        //prikaz autora i odgovora
    }
});

io.on('roomChecked', function (message) {
    if (message === 'ok') {
        window.location = 'serverRoom/' + $('#roomTextBox').val() + '?username=' + 'root';
    } else {
        alert("Soba već postoji");
        $('#roomTextBox').val("");
    }
});

io.on('allSubmitedAnswer', function (data) {
    for (var i in data.answers) {
        $('#answers').append('<button class="btn btn-default" onClick=\"gotAnswer(\'' + data.answers[i].answer + '\')\">' + data.answers[i].answer + '</button><p></p>');
        $('#answersList').append('<p class="answer">' + data.answers[i].answer + '</p>');
    };
});

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

io.on('roundOver', function (data) {
    //alert('gameOver');
    document.getElementById('questionHolder').style.display = 'none';
    document.getElementById('answersHolder').style.display = 'none';
    document.getElementById('consoleHolder').style.display = 'none';

    document.getElementById('newRound').style.display = 'block';
    document.getElementById('quitGame').style.display = 'block';
    //document.getElementById('finalLeaderBoard').style.display = 'block';
    document.getElementById('winner').innerHTML = '';
    document.getElementById('finalLeaderBoardTable').innerHTML = '';
    document.getElementById('finalLeaderBoard').style.display = 'block';
    
    var winners = "";
    var noOfWinners = 0;
    for (var i in data.winners) {
        winners += data.winners[i].username + ', ';
        noOfWinners++;
    }
    //alert(noOfWinners);
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

$('#sendButton').click(function () {
    var messageText = $('#chatTextBox').val();
    if (messageText === "" || messageText === "undefined") { 
        alert("Nije dozvoljen prazan unos!");
    } else {
        var messagePayload = { message: messageText, room: roomName, username: userName };
        io.emit('sendMessage', messagePayload);
    }
});

$('#lockButton').click(function (evt) {
    io.emit('lockRoom', { roomName: roomName });
    //alert('soba zakljucana');
    
    //document.getElementById('newQuestion').style.display = 'block';
});

$('#newRound').click(function (evt) {
    //document.getElementById('questionHolder').style.display = 'block';
    //document.getElementById('answersHolder').style.display = 'block';
    alert('newRound');
    
    document.getElementById('consoleHolder').style.display = 'block';
    alert('consoleHolder');

    document.getElementById('newRound').style.display = 'none';
    alert('newRound');
    
    document.getElementById('quitGame').style.display = 'none';
    alert('quitGame');
    
    document.getElementById('finalLeaderBoard').style.display = 'none';
    alert('finalLeaderBoard');
    
    document.getElementById('authorsHolder').style.display = 'none';
    alert('sve bi trebalo biti sakriveno');
    
    io.emit('getQuestion', { roomName : roomName, newRound: 1 });
    alert('gotov emit');
});

$('#quitGame').click(function (evt) {
    io.emit('gameOver', { room : roomName });
});

io.on('endGame', function () { 
    window.location = '/';
});
io.on('userDisconected', function (data) {
    $('#conversation').append('<p>' + data.username + 'has disconnected. </p>');
        
});
function gotAnswer(ans) {
    document.getElementById('answersHolder').style.display = 'none';
    spinner.spin(target);
    //document.getElementById('spin').style.display = 'block';
    io.emit('answered', { username: userName, answer: ans, room: roomName });
}

function showAuthors(author) {
    //alert("prije");
    document.getElementById('authorsHolder').style.display = 'block';

    $('#authorsList').append('<h3>' + 'Točan odgovor je : ' + '<font color=\"green\"> ' + author.corrans + '</font>' +'</h3>'); //<font color="red">This is some text!</font>
    setTimeout(function () {
        for (var i in author.users) {
            $('#authorsList').append('<p>' + author.users[i].username + ': ' + author.users[i].answer + '</p>');
        };
    }, 1000);
   
  //  alert("poslije");

 

}
