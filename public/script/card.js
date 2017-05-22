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
                var price = $('tr[data-id='+id+']>.price').text().slice(2),
                    quantity = $('tr[data-id='+id+']>.quantity').text(),
                    totalBefore = $('.total').text().slice(8);
                $('.total').text('Total: $' + (totalBefore - price * quantity));
                $('tr[data-id='+id+']').css({display:'none'});
                var numOfItems = $('.numOfItems').text();
                $('.numOfItems').text(--numOfItems);
            },
            error:function (res) {
                console.log(res, "error")
            }
        })
    });

    $('.quantity-up').on('click', function () {
        var id = this.dataset.id;
        $.ajax({
            url:'/card/quantity-up',
            method:'POST',
            data:{
                id: id
            },
            success:function (res) {
                console.log(res, "success");
                var price = +$('tr[data-id='+id+']>.price').text().slice(2),
                    quantity = $('tr[data-id='+id+']>.quantity').text(),
                    totalBefore = +$('.total').text().slice(8);
                $('tr[data-id='+id+']>.quantity').text(++quantity);
                $('.total').text('Total: $' + (totalBefore + price));
            },
            error:function (res) {
                console.log(res, "error")
            }
        })
    });

    $('.quantity-down').on('click', function () {
        var id = this.dataset.id;
        if ($('tr[data-id='+id+']>.quantity').text() <= 1) {
            if (confirm("Do you want to remove this item?")) {
                $.ajax({
                    url:'/card/remove-item',
                    method:'POST',
                    data:{
                        id: id
                    },
                    success:function (res) {
                        console.log(res, "success");
                        var price = $('tr[data-id='+id+']>.price').text().slice(2),
                            quantity = $('tr[data-id='+id+']>.quantity').text(),
                            totalBefore = $('.total').text().slice(8);
                        $('.total').text('Total: $' + (totalBefore - price * quantity));
                        $('tr[data-id='+id+']').css({display:'none'});
                        var numOfItems = $('.numOfItems').text();
                        $('.numOfItems').text(--numOfItems);
                    },
                    error:function (res) {
                        console.log(res, "error")
                    }
                })
                // $('tr[data-id='+id+']>.remove-item').trigger('click'); //????????????????????????????????
            }
        }else{
            $.ajax({
                url:'/card/quantity-down',
                method:'POST',
                data:{
                    id: id
                },
                success:function (res) {
                    console.log(res, "success");
                    var price = +$('tr[data-id='+id+']>.price').text().slice(2),
                        quantity = $('tr[data-id='+id+']>.quantity').text(),
                        totalBefore = +$('.total').text().slice(8);
                    $('tr[data-id='+id+']>.quantity').text(--quantity);
                    $('.total').text('Total: $' + (totalBefore - price));
                },
                error:function (res) {
                    console.log(res, "error")
                }
            })
        }
    })
});