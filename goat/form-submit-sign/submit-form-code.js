// 这里是提交表单的原始代码，对其进行简单的混淆以防直接搜索就能定位让读者觉得太无聊
$(document).ready(function() {
    $('#loginForm button').click(function() {
        var username = $('#username').val();
        var password = $('#password').val();
        var combined = username + ':' + password;
        var encoded = btoa(combined);
        var encryptInput = $('<input>').attr({
            type: 'hidden',
            name: 'sign',
            value: encoded
        });
        $('#loginForm').append(encryptInput);
        $('#loginForm').submit();
    });
});