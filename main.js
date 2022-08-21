function Validator(options) {

    // Lấy thẻ cha của thẻ element có class là selector
    function getParent(element, selector) {
        while(element.parentElement){
            if(element.parentElement.matches(selector)){
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    var selectRules = {};


    //================================================================================================
    // Thực hiện validate
    function Validate(inputElement, rule) {
        // errorElement: .form-message
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
        // inputElement.value ? errorMessage = undefined : 'Vui lòng nhập...'
        var errorMessage;
        // Lấy ra các rule.test của selector
        // rule.selector là 1 mảng gồm nhiều rule.test
        var rules = selectRules[rule.selector];
        // Lặp qua từng rule và k.tra nếu lỗi thì dừng (lấy lỗi đầu tiên)
        for (var i = 0; i < rules.length; ++i) {
            switch(inputElement.type){
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            if (errorMessage)   break;
        }

        if (errorMessage) {
            errorElement.innerHTML = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add('invalid');
        } else {
            errorElement.innerHTML = '';
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
        }
        // Có lỗi => return false
        return !errorMessage;
    }


    //================================================================================================
    // Lấy Element của form cần validate
    var formElement = document.querySelector(options.form);
    if (formElement) {
        // Khi submit form
        formElement.onsubmit = function (e) {
            e.preventDefault();
            var isFormValid = true;

            // Lặp qua từng rule và validate
            options.rules.forEach(function (rule) {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = Validate(inputElement, rule);
                if (!isValid) {
                    // Nếu có ít nhất 1 lỗi => isFormValid = false
                    isFormValid = false;
                }
            });

            // Nếu submit k có lỗi (form đã nhập đúng hết) 
            // => return inputElement.value
            if (isFormValid) {
                // TH submit với javaScript form
                if (typeof options.onSubmit === 'function') {
                    var enableInputs = formElement.querySelectorAll('[name]:not([disabled])');
                    var formValues = Array.from(enableInputs).reduce(function (values, input) {
                        switch(input.type){
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                break;
                            case 'checkbox':
                                if (!input.matches(':checked')){
                                    values[input.name] = '';
                                    return values;
                                }
                                if(!Array.isArray(values[input.name])){
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;
                        }
                        return values;
                    }, {});
                    options.onSubmit(formValues);
                }

                // TH submit với hành vi mặc định 
                // Vì k phải lúc nào cũng dùng javaScript để submit
                else {
                    formElement.submit();
                }
            }
        };

        // Lặp qua mỗi rule và xử lý (lắng nghe s.kiện blur, input,...)
        options.rules.forEach(function (rule) {
            // Lưu lại các rule cho mỗi input
            if (Array.isArray(selectRules[rule.selector])) {
                // Nếu selectRules[rule.selector] là 1 mảng (khi đã có 1 p.tử đầu)
                selectRules[rule.selector].push(rule.test);
            } else {
                // Nếu selectRules[rule.selector] ko phải là 1 mảng (lần đầu chạy) => 
                // gán bằng 1 mảng có phần tử đầu tiên là rule đầu tiên
                selectRules[rule.selector] = [rule.test];
            }

            //  Lấy ra thẻ Input
            var inputElements = formElement.querySelectorAll(rule.selector);
            Array.from(inputElements).forEach(function (inputElement) {
                // Xử lý khi blur ra khỏi thẻ input
                inputElement.onblur = function () {
                    Validate(inputElement, rule);
                };

                // Xử lý mỗi khi người dùng nhập vào input
                inputElement.oninput = function () {
                    var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
                    errorElement.innerHTML = '';
                    getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
                }; 
            });
        });
    }
}

// =============================================================================================
//  Định nghĩa các rules
//  Nguyên tắc của các rules:
//      1. Khi có lỗi => trả ra message lỗi
//      2. Khi hợp lệ => undefined
Validator.isRequired = function (selector, message) {
    return {
        // selector: #fullname
        selector,
        //ktra xem người dùng đã nhâp chưa 
        test: function (value) {
            return value ? undefined : message || 'Vui lòng nhập trường này'
        }
    }
}

Validator.isEmail = function (selector, message) {
    return {
        // selector: #email
        selector,
        //ktra xem co phai Email k 
        test: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : message || 'Trường này phải là Email';
        }
    }
}

Validator.minLength = function (selector, min, message) {
    return {
        // selector: #password
        selector,
        //ktra password nhập có đủ min kí tự
        test: function (value) {
            return value.length >= min ? undefined : message || `Vui lòng nhập tối thiểu ${min} kí tự`;
        }
    }
}

Validator.isConfirmed = function (selector, getConfirmValue, message) {
    return {
        // selector: #password_confirmation
        selector,
        //ktra password nhập có đủ min kí tự
        test: function (value) {
            return value === getConfirmValue() ? undefined : message || 'Giá trị nhập vào không chính xác';
        }
    }
}