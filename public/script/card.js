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
    });

    $('.remove-item').on('click', function () {
        var id = this.dataset.id;
        $.ajax({
            url:'/card/remove-item',
            method:'POST',
            data:{
                id: id
            },
            success:function (res) {
                console.log(res, "success");
                $('tr[data-id='+id+']').css({display:'none'});
                var numOfItems = $('.numOfItems').text();
                $('.numOfItems').text(--numOfItems);
            },
            error:function (res) {
                console.log(res, "error")
            }
        })
    })
});