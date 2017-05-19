$(function () {
    $('.booking').on('click', function () {
        if ($('.total').text().slice(8) > 0) {
            $.ajax({
                url:'/booking',
                method:'POST',
                data:{
                    total: $('.total').text().slice(8)
                },
                success:function (res) {
                    console.log(res, "success");
                    window.location.reload()
                },
                error:function (res) {
                    console.log(res, "error")
                }
            })
        }
    })
});