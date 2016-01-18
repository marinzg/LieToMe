var io = io.connect();
io.on('announce', function (data) {
    $('#conversation').append('<button>' + data.message + '</button>');
});

io.on('userConnected', function (data) {
    $('#console').append('<p>' + data.message + '</p>');
});

io.on('lock', function (data) {
    alert("u lock  sam u soketima" + data.message);
    $('#question').append('<p>' + data.message + '</p>'); //'<p>' + data.message + '</p>'
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
        $('#conversation').append('<button style="color: rgb(191, 62, 17)">' + messagePayload.message + '</button>'); ///adds  message to conversation
    }
});

$('#lockButton').click(function (evt) {
    io.emit('lockRoom', { roomName: roomName });
    alert('soba zakljucana');
});

io.on('userDisconected', function (data) {
    $('#conversation').append('<p>' + data.username + 'has disconnected. </p>');
        
});