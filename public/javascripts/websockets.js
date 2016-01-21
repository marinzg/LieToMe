var io = io.connect();
/*
 *  put answers on server not as buttons
 *  hide answes on server until all answered 
 * 
 */


io.on('announce', function (data) {
    $('#answers').append('<button class="btn btn-default" onClick=\"gotAnswer(\'' + data.answer + '\')\">' + data.answer + '</button><p></p>');
    $('#answersList').append('<p class="answer">' + data.answer + '</p>');
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
    //updatePoints
    
    document.getElementById('leaderBoard').innerHTML = '';
    $('#leaderBoard').append('<tr><th>korisnici</th><th>bodovi</th></tr>');
    for (var i in data.users) {
        $('#leaderBoard').append('<tr><td>' + data.users[i].username + '</td>  <td >' + data.users[i].points + '</td></tr>');
    };
    
    
});

io.on('showUsersAndPoints', function (data) {
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
    document.getElementById('sendButton').style.display = 'block';
    document.getElementById('chatTextBox').style.display = 'block';
    document.getElementById('answersHolder').style.display = 'none';
    document.getElementById('answers').innerHTML = "";
    document.getElementById('answersList').innerHTML = "";
    
});

io.on('answersReady', function(data) {
    /*for (var i in data.answers) {
        $('#answers').append('<p id=\"' + data.answers[i] + '\">' + data.answers[i] + '</p>');
    }*/
    document.getElementById('answersHolder').style.display = 'block';
});

io.on('allAnswered', function () {
    //alert('all answered');
    if (userName === 'root') {
        //alert('its root');
        document.getElementById('answersList').innerHTML = "";
        io.emit('getQuestion', { roomName : roomName });
    }
});

$('#sendButton').click(function () {
    
    var messageText = $('#chatTextBox').val();
    if (messageText === "" || messageText === "undefined") alert("Nije dozvoljen prazan unos!");
    else {
        var messagePayload = { message: messageText, room: roomName, username: userName };
        io.emit('sendMessage', messagePayload);
        $('#chatTextBox').val(''); //clears the message text box
      //  $('#conversation').append('<button style="color: rgb(191, 62, 17)">' + messagePayload.message + '</button>'); ///adds  message to conversation
    }
});

$('#lockButton').click(function (evt) {
    io.emit('lockRoom', { roomName: roomName });
    alert('soba zakljucana');
    document.getElementById('lockButton').style.display = 'none';
    document.getElementById('newQuestion').style.display = 'block';
});

$('#newQuestion').click(function (evt) {
    io.emit('getQuestion', { roomName : roomName });
});

io.on('userDisconected', function (data) {
    $('#conversation').append('<p>' + data.username + 'has disconnected. </p>');
        
});
function gotAnswer(ans) {
    //alert('username: ' + user + '   answer: ' + ans);
    io.emit('answered', { username: userName, answer: ans, room: roomName });
}
