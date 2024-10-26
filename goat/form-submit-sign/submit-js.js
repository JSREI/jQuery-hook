// 这里是提交表单的字符串，大模型混淆代码的Prompt：
//
// 把下面所有的字面值常量都替换为String.fromCharCode的加密形式
// 现在深呼吸一口气，一步一步的思考解决这个问题
$(document).ready(function() {
    $('#loginForm button').click(function() {
        var username = $('#username').val();
        var password = $('#password').val();
        var combined = username + ':' + password;
        var encoded = btoa(combined);
        var encryptInput = $('<input>').attr({
            type: 'hidden',
            name: 'encrypt',
            value: encoded
        });
        $('#loginForm').append(encryptInput);
        $('#loginForm').submit();
    });
});