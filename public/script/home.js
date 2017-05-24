$(function () {
    //change header if user was logged
    if (userName !== "false") {
        $('button[data-target="#sign-in"], button[data-target="#sign-up"]').addClass('hidden');
        var form = '<li><form class="form-inline" action="/sign-out" method="post"><p class="form-control-static">'+userName+'</p><button type="submit" class="btn btn-primary sign-out">Sign out</button></form></li>';
        $('.liForCart').before(form);
    }

    // infinite scroll with button
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

    // sign-in in modal window
    $('.submitSignIn').on("click", function () {
        var isEmail = false,// for validation before sending ajax
            isPass = false,
            email = $('#email').val(),
            password = $('#password').val();

        function validateEmail(email) {
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }

        //bootstrap helper classes for showing errors
        $('.divEmail').removeClass('has-error');
        $('label[for="email"]').removeClass("control-label");
        $('.divPass').removeClass('has-error');
        $('label[for="password"]').removeClass("control-label");
        $('.hasError').remove();

        // validation
        if (!validateEmail(email)) {
            $('.divEmail').addClass('has-error');
            $('label[for="email"]').addClass("control-label");
            isEmail = false;
        }else{
            isEmail = true;
        }
        if (password.length < 6) {
            $('.divPass').addClass('has-error');
            $('label[for="password"]').addClass("control-label");
            isPass = false;
        }else{
            isPass = true;
        }

        //if validation was successfully, send ajax
        if (isPass && isEmail) {
            $.ajax({
                url:'/sign-in',
                method:'post',
                data:{
                    email:email,
                    password:password
                },
                success:function (res) {
                    console.log("success");
                    $('#sign-in').modal("hide");
                    var userName = res.name;
                    $('button[data-target="#sign-in"], button[data-target="#sign-up"]').addClass('hidden');
                    var form = '<li><form class="form-inline" action="/sign-out" method="post"><p class="form-control-static">'+userName+'</p><button type="submit" class="btn btn-primary">Sign out</button></form></li>';
                    $('.liForCart').before(form);
                },
                error:function (res) {
                    console.log(res, "error");
                    if (res.responseJSON.passError) {
                        var response = $('<div class="hasError bg-danger h3">'+res.responseJSON.passError+'</div>');
                        $('.divPass').append(response);
                    }
                    if (res.responseJSON.emailError) {
                        var response = $('<div class="hasError bg-danger h3">'+res.responseJSON.emailError+'</div>');
                        $('.divPass').append(response);
                    }
                }
            })
        }
    });

    $('button[data-target="#sign-up"]').on("click", function () {
        alert('Soon!')
    })
});