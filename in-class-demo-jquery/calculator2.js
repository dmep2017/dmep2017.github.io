$(function() {

    var calculate = function() {
        // console.log('clicked');
        var num1 = $('#num1').val()
        var num2 = $('#num2').val()
        var result = +num1 + +num2;
        $('#result').val(result);
    }

    console.log('Calculate function:');
    console.log(calculate);

    $('#num1').keyup(
        calculate
    )
    $('#num2').keyup(
        calculate
    )
})

console.log('Test')