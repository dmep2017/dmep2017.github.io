$(function() {
    $('#calculate').click(function() {
        console.log('clicked');
        var num1 = $('#num1').val()
        var num2 = $('#num2').val()
        var result = num1 + num2;
        $('#result').val(result);
    })
})

console.log('Test')