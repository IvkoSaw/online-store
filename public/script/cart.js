$(function () {
    //change header if user was logged
    if (userName !== "false") {
        $('button[data-target="#sign-in"], button[data-target="#sign-up"]').addClass('hidden');
        var form = '<li><form class="form-inline" action="/sign-out" method="post"><p class="form-control-static">'+userName+'</p><button type="submit" class="btn btn-primary sign-out">Sign out</button></form></li>';
        $('.liForCart').before(form);
    }

    //finally order
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

    //remove-item from cart
    $('.remove-item').on('click', function () {
        var id = this.dataset.id;
        $.ajax({
            url:'/cart/remove-item',
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

    // increase the number of item in the cart
    $('.quantity-up').on('click', function () {
        var id = this.dataset.id;
        $.ajax({
            url:'/cart/quantity-up',
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

    // reduce the number of item in the cart
    $('.quantity-down').on('click', function () {
        var id = this.dataset.id;
        if ($('tr[data-id='+id+']>.quantity').text() <= 1) {
            //remove from card if quantity less then 1
            if (confirm("Do you want to remove this item?")) {
                $.ajax({
                    url:'/cart/remove-item',
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
            }
        }else{
            // just reduce the number of item
            $.ajax({
                url:'/cart/quantity-down',
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

    $(".submitToSignUp").on("click", function () {
        var isName = false,
            isEmail = false,
            isPass = false,
            isRepass = false,
            name = $('#nameSU').val(),
            email = $('#emailSU').val(),
            password = $('#passwordSU').val(),
            rePassword = $('#rePasswordSU').val();

        function validateEmail(email) {
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }

        $('.divNameSU').removeClass('has-error');
        $('label[for="nameSU"]').removeClass("control-label");
        $('.divEmailSU').removeClass('has-error');
        $('label[for="emailSU"]').removeClass("control-label");
        $('.divPassSU').removeClass('has-error');
        $('label[for="passwordSU"]').removeClass("control-label");
        $('.divRepassSU').removeClass('has-error');
        $('label[for="rePasswordSU"]').removeClass("control-label");
        $('.registeredSU').remove();

        //client validation
        if (name.length <= 1) {
            $('.divNameSU').addClass('has-error');
            $('label[for="nameSU"]').addClass("control-label");
            isName = false;
        }else{
            isName = true;
        }
        if (!validateEmail(email)) {
            $('.divEmailSU').addClass('has-error');
            $('label[for="emailSU"]').addClass("control-label");
            isEmail = false;
        }else{
            isEmail = true;
        }
        if (password.length < 6) {
            $('.divPassSU').addClass('has-error');
            $('label[for="passwordSU"]').addClass("control-label");
            isPass = false;
        }else{
            isPass = true;
        }
        if (password != rePassword || rePassword == "" || isPass == false) {
            $('.divRepassSU').addClass('has-error');
            $('label[for="rePasswordSU"]').addClass("control-label");
            isRepass = false;
        }else{
            isRepass = true
        }

        if (isName && isEmail && isPass && isRepass) {
            $.ajax({
                url:"/sign-up",
                method:"post",
                data:{
                    name:name,
                    email:email,
                    password:password,
                    rePassword:rePassword
                },
                success:function(res){
                    $('#sign-up').modal("hide");
                    var userName = res.name;
                    $('button[data-target="#sign-in"], button[data-target="#sign-up"]').addClass('hidden');
                    var form = '<li><form class="form-inline" action="/sign-out" method="post"><p class="form-control-static">'+userName+'</p><button type="submit" class="btn btn-primary">Sign out</button></form></li>';
                    $('.liForCart').before(form);
                },
                error:function(res){
                    if (res.responseJSON.errorEmail) {
                        var response = $('<div class="registered bg-danger h3">'+res.responseJSON.errorEmail+'</div>');
                        $('form').append(response);
                    }else{
                        var response = $('<div class="registered bg-danger h3">There was a mistake, try again please!</div>');
                        $('form').append(response);
                    }
                }
            });
        }
    })
});