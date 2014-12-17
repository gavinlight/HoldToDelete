(function (scope, document) {
    // Initialize function. This function handles the plugin and sets the private variables
    HoldToDelete = function(element, setup){
        this.dom_element = this.getDomElement(element);
        this.options = this.getOptions(setup);
        this.timeout_settings = this.getTimeoutSettings();

        this.mouseup_check = false;
        this.reference_element = false;

        if(this.dom_element){
            this.registerClickEvents();
        }
    }

    // Check the type of the element parameter. Create a selector if needed
    HoldToDelete.prototype.getDomElement = function(element){
        if (element && typeof element === 'string'){
            return this.selector(element, false);
        } else if (element && this.isDomElement(element) === true){
            return element;
        } else {
            throw new Error('No element was specified for HoldToDelete to use. Please specify one.');
        }
    }

    // Set the timeout settings after the options have been overidden
    HoldToDelete.prototype.getTimeoutSettings = function(){
        var timeout_settings = {};

        timeout_settings.seconds = this.options.seconds * 1000;
        timeout_settings.callback_timeout = this.options.timeout * 1000;

        return timeout_settings;
    }

    // Simple selector function if the user doesn't use a selector engine of their own
    HoldToDelete.prototype.selector = function(element, single){
        var selector = document.querySelectorAll(element);

        if(single){
            return selector[0];
        } else {
            return selector;
        }
    }

    // Select the feedback element closest to the given element
    HoldToDelete.prototype.selectFeedbackElement = function(element){
        var feedback_element = element.nextSibling;

        // Check if the next sibling is indeed the feedback element
        if(feedback_element && feedback_element.className == 'holdtodelete' && feedback_element.nodeName == "I"){
            return feedback_element;
        } else {
            return false;
        }
    }

    // Override the options with the user's own preferences where needed
    HoldToDelete.prototype.getOptions = function(setup){
        // Standard options object
        var options = {
            height: '5px',
            color: '#FF0000',
            css: {},
            seconds: 3,
            timeout: 0,
            remove_feedback: true
        }

        if(setup && typeof setup === 'object'){
            for (var option in setup){
                if(setup.hasOwnProperty(option) && options.hasOwnProperty(option) && typeof options[option] === typeof setup[option]){
                    options[option] = setup[option];
                } else {
                    throw new Error(option + ' was not specified properly. It should be the data type ' + typeof options[option]);
                }
            }
        }



        return setup;
    }

    // Check if an object is a DOM element
    HoldToDelete.prototype.isDomElement = function(element){
        for (var i = 0; i < element.length; i++){
            if(typeof element[i] == "object" && "nodeType" in element[i] && element[i].nodeType === 1 && element[i].cloneNode){
                return true;
            }
        }
    }

    // Register the click events
    HoldToDelete.prototype.registerClickEvents = function(){
        for (var i = 0; i < this.dom_element.length; i++){
            var button = this.dom_element[i];

            button.addEventListener('mousedown', function(event){
                this.mouseDownHandler(event.srcElement);
            }.bind(this));

            button.addEventListener('mouseup', function(event){
                this.mouseUpHandler(event.srcElement);
                
                if( !this.anim_timer ){
                    this.removeReferenceElement();
                }
            }.bind(this));

            button.addEventListener('mouseleave', function(event){
                // Only call mouseUpHandler if the element the mouse left to is NOT the feedback element
                if(event.toElement != this.selectFeedbackElement(event.srcElement)){
                    this.mouseUpHandler(event.srcElement);

                    if( !this.anim_timer ){
                        this.removeReferenceElement();
                    }
                }
            }.bind(this));
        }
    }

    // Handle the mouse down event. This is where the interval is being called, the feedback element is inserted and later also deleted
    HoldToDelete.prototype.mouseDownHandler = function(reference_element){
        this.setMouseupCheck(true);
        this.setReferenceElement(reference_element);

        var feedback_object = this.getFeedbackObject(this.reference_element);
        var feedback_element = this.insertFeedbackElement(feedback_object);

        this.callEvent('holdtodelete_started');
        
        var start = new Date().getTime();
        this.anim_timer = setInterval(function() {
            var step = Math.min(1, (new Date().getTime() - start) / this.timeout_settings.seconds);
            feedback_element.style.width = ( 0 + step * (feedback_object.width - 0) ) + 'px';
            
            this.callEvent('holdtodelete_running');

            if(step === 1){
                this.setMouseupCheck(false);
                clearInterval(this.anim_timer);

                if(!this.mouseup_check){

                    this.callEvent('holdtodelete_before_timeout');

                    this.callback_timer = setTimeout(function() {

                        this.callEvent('holdtodelete_finished');

                        if( this.options.remove_feedback ){
                            this.setMouseupCheck(true);
                            this.mouseUpHandler(this.reference_element);
                        }
                           
                        this.removeReferenceElement();

                    }.bind(this), this.timeout_settings.callback_timeout);
                }
            }

        }.bind(this), 1)
    }

    // Handle the mouse up event. This function clears the current interval and checks if the feedback element can be removed
    HoldToDelete.prototype.mouseUpHandler = function(button){
        clearInterval(this.anim_timer);

        // Control the mouseUpHandler function
        if(this.mouseup_check == true){
            this.removeFeedbackElement(button);
        }
    }


    HoldToDelete.prototype.setReferenceElement = function(reference_element){
        this.reference_element = reference_element;
    }

    // Reset the reference element because it is no longer being pressed. This functions is mostly being called allongside the removeFeedbackElement() function, but not always.
    HoldToDelete.prototype.removeReferenceElement = function(){
        this.reference_element = false;
    }

    // Get the standard feedback element
    HoldToDelete.prototype.constructFeedbackElement = function(){
        var feedback_element = document.createElement('i');
            feedback_element.className = 'holdtodelete';
            feedback_element.style.cssText += 'border-top-style: solid;';
            feedback_element.style.cssText += 'display: block;'
            feedback_element.style.cssText += 'position: absolute;'
            feedback_element.style.cssText += 'width: 0px;'
            feedback_element.style.cssText += 'cursor: pointer;'

        return feedback_element;
    }

    // Add to the standard feedback element
    HoldToDelete.prototype.insertFeedbackElement = function(feedback_object){
        var feedback_element = this.constructFeedbackElement();
            feedback_element.style.cssText += 'border-top-width: ' + feedback_object.height + '';
            feedback_element.style.cssText += 'border-top-color: ' + feedback_object.color + '';

            feedback_element.style.cssText += 'top: ' + feedback_object.top + 'px;';
            feedback_element.style.cssText += 'left: ' + feedback_object.left + 'px;';
            feedback_element.style.cssText += 'opacity: ' + feedback_object.opacity + ';'

        if(typeof feedback_object === 'object'){
            for(var css_rule in feedback_object.css){
                feedback_element.style.cssText += css_rule + ': ' + feedback_object.css[css_rule] + ';';
            }
        }
            
        if(feedback_object.hasOwnProperty('border_left_radius')){
            feedback_element.style.cssText += 'border-top-left-radius: ' + feedback_object.border_left_radius + ';';
        }
        if(feedback_object.hasOwnProperty('border_right_radius')){
            feedback_element.style.cssText += 'border-top-right-radius: ' + feedback_object.border_right_radius + ';';
        }

        feedback_object.clicked_element.parentNode.insertBefore(feedback_element, feedback_object.clicked_element.nextSibling);

        return feedback_element;
    }

    // Get the object for the feedback element based on the user settings
    HoldToDelete.prototype.getFeedbackObject = function(element){
        var feedback_object = {};

        feedback_object.clicked_element = element;

        feedback_object.height = this.options.height;
        feedback_object.color = this.options.color;
        feedback_object.css = this.options.css;
        feedback_object.opacity = this.options.opacity;

        feedback_object.width = element.offsetWidth;
        feedback_object.top = element.offsetTop;
        feedback_object.left = element.offsetLeft;

        if(window.getComputedStyle){
            feedback_object.border_left_radius = window.getComputedStyle(element, null).getPropertyValue("border-top-left-radius");
            feedback_object.border_right_radius = window.getComputedStyle(element, null).getPropertyValue("border-top-right-radius");
        }

        return feedback_object;
    }

    // Remove the feedback element from the DOM
    HoldToDelete.prototype.removeFeedbackElement = function(button){
        var remove_element = this.selectFeedbackElement(button);
        
        if(remove_element){
            remove_element.parentNode.removeChild(remove_element);
        }
    }

    // Handle the mouse up checker that determines wether the interval can do certain stuff
    HoldToDelete.prototype.setMouseupCheck = function(value){
        if(typeof value === 'boolean'){
            this.mouseup_check = value;
        }
    }

    // Call the callback on custom events for the users and give the users the current clicked element and the current feedback element
    HoldToDelete.prototype.on = function(event_name, callback) {
        if(document.addEventListener) {

            document.addEventListener(
                event_name,
                function(){ callback(this.reference_element, this.selectFeedbackElement(this.reference_element)) }.bind(this),
                false
            );

        }
    }

    // Create custom event and call it
    HoldToDelete.prototype.callEvent = function(event_name) {
        var holdtodelete_events = [
            'holdtodelete_started',
            'holdtodelete_running',
            'holdtodelete_before_timeout',
            'holdtodelete_finished'
        ];

        if(document.createEvent && typeof event_name === 'string' && holdtodelete_events.indexOf(event_name) > -1) {

            var event = document.createEvent('Event');
            event.initEvent(event_name, true, true);
            document.dispatchEvent(event);

        }
    }

    // Make HoldToDelete available for the global scope
    scope.HoldToDelete = HoldToDelete;

})(window, window.document);