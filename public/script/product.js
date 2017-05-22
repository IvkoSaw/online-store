$(function () {
    $('.addToCard').on("click" ,function () {
        $.ajax({
            url:"/card",
            method:"POST",
            data:{
                id: id,
                quantity: $('.quantity').val()
            },
            success:function (res) {
                console.log(res, "success");
                var ok = $('<span class="glyphicon glyphicon-ok"></span>');
                ok.appendTo($('.forBuying'));
                if (res.unique) {
                    var numOfItems = $('.numOfItems').text();
                    $('.numOfItems').text(++numOfItems);
                }
            },
            error:function (res) {
                console.log(res,"error")
                var notOk = $('<span class="glyphicon glyphicon-remove"></span>');
                notOk.appendTo($('.forBuying'))
            }
        })
    })
});