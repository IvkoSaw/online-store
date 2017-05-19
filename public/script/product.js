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
                alert('you bought something');
                console.log(res, "success")
            },
            error:function (res) {
                console.log(res,"error")
            }
        })
    })
});