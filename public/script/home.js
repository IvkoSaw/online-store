$(function () {
    $('.showMore').on('click', function () {
        $.ajax({
            url:'/',
            method:'POST',
            success:function (res) {
                var products = res.products;
                products.forEach(function (elm) {
                    var post = $('<div class="col-xs-12 col-sm-6 col-md-4 col-lg-3 product"></div>'),
                        img = $('<img src='+elm.img+' height="200px">'),
                        name = $('<h4>'+elm.name+'</h4>'),
                        date = $('<small> Published: '+new Date(elm.date).toUTCString()+'</small><br>'),
                        price = $('<span> $'+elm.price +'</span>'),
                        button = $('<a class="btn btn-primary" href="/products/'+elm._id+'" role="button">Buy</a>');
                    $(post).append(img, name, date, price, button);
                    $('.row').append(post)
                })
            },
            error:function (res) {
                console.log(res, "error")
            }
        })
    });
});