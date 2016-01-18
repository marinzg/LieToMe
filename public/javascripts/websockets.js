var io = io.connect();
io.on('announce', function (data) {
    $('#answers').append('<button style=\'visibility:hidden\'>' + data.message + '</button>');

});

io.on('userConnected', function (data) {
    $('#console').append('<p>' + data.message + '</p>');
});

io.on('questionSent', function (data) {
    document.getElementById('question').innerHTML = "";
    $('#question').append('<p>' + data.message + '</p>');
});

io.on('setQuestion', function (data) {
    $('#question').append('<p>' + data.message + '</p>');
    console.log('tu sam');
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
    document.getElementById('lockButton').style.visibility = 'hidden';
    document.getElementById('newQuestion').style.visibility = 'visible';
});

$('#newQuestion').click(function (evt) {
    io.emit('getQuestion', { roomName : roomName });
});

io.on('userDisconected', function (data) {
    $('#conversation').append('<p>' + data.username + 'has disconnected. </p>');
        
});