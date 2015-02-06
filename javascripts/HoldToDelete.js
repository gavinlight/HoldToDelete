(function (scope, document) {
    // Initialize function. This function handles the plugin and sets the private variables
    HoldToDelete = function(element, setup){
        this.dom_elements = this.getDomElements(element);
        this.options = this.getOptions(setup);
        this.timeout_settings = this.getTimeoutSettings();

        this.mouseup_check = false;
        this.reference_element = false;

        // Map the mouse click events to a string
        this.mouse_click_mapping = {
            'left_click': 0,
            'middle_click': 1,
            'right_click': 2
        };

        // The classname that the reference element gets while the event is running
        this.classname_running = 'holdtodelete_running';

        if(this.dom_elements){
            this.registerReferenceEvents();
            this.wrapReferenceElements();
        }

        if(this.options.class_name){
        	this.setClassNames();
        }
    }

    // Check the type of the element parameter. Create a selector if needed
    HoldToDelete.prototype.getDomElements = function(element){
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
        if(feedback_element && feedback_element.className.indexOf('holdtodelete') > -1 && feedback_element.nodeName == "I"){
            return feedback_element;
        } else {
            return false;
        }
    }

    HoldToDelete.prototype.selectFeedbackWrapper = function(element){
    	var feedback_wrapper = element.parentNode;

        // Check if the wrapper is indeed the feedback element
        if(feedback_wrapper && feedback_wrapper.className.indexOf('holdtodelete_parent') > -1 && feedback_wrapper.nodeName == "DIV"){
            return feedback_wrapper;
        } else {
            return false;
        }
    }

    // Override the options with the user's own preferences where needed
    HoldToDelete.prototype.getOptions = function(setup){
        // Standard options object
        var options = {
            seconds: 3,
            timeout: 0,
            remove_feedback: true,
            border_radius_percentage: false,
            class_name: ''
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

        return options;
    }

    // Check if an object is a DOM element
    HoldToDelete.prototype.isDomElement = function(element){
        for (var i = 0; i < element.length; i++){
            if(typeof element[i] == "object" && "nodeType" in element[i] && element[i].nodeType === 1 && element[i].cloneNode){
                return true;
            }
        }
    }

    // Wrap all the chosen elements in a div
    HoldToDelete.prototype.wrapReferenceElements = function(){
    	for(var i = 0; i < this.dom_elements.length; i++){
    		var parent_element = document.createElement('div');
    		parent_element.className = 'holdtodelete_parent';

    		var	button = this.dom_elements[i];

    		button.parentNode.insertBefore(parent_element, button);
    		parent_element.appendChild(button);
    	}
    }

    // Check if the browser supports touch events
    HoldToDelete.prototype.browserSupportsTouchEvents = function(){
    	return 'ontouchstart' in document.documentElement
    }

    // Get the source element of click and touch events for (most) browsers
    HoldToDelete.prototype.getSourceElement = function(event){
        return event.target || event.srcElement;
    }

    // Register the mouse events for the referece element
    HoldToDelete.prototype.registerReferenceEvents = function(){
        for (var i = 0; i < this.dom_elements.length; i++){
            var button = this.dom_elements[i];

            // Register different events depending on if the browser supports touch events or doesn't. Not needed for the registerFeedbackEvents because of the way touchevents works
            if(this.browserSupportsTouchEvents()){
				button.addEventListener('touchstart', function(event){
	            	this.mouseDownHandler(this.getSourceElement(event));
	            }.bind(this));

	            button.addEventListener('touchend', function(event){
	            	this.mouseUpHandler(this.getSourceElement(event));

	            	if( !this.anim_timer ){
	                    this.removeReferenceElement();
	                }
	            }.bind(this));

	            button.addEventListener('touchmove', function(event){
                    var element_moved_to = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
                
	                if(element_moved_to != this.selectFeedbackElement(this.getSourceElement(event)) && element_moved_to != this.reference_element){
                        this.mouseUpHandler(this.getSourceElement(event));

                        if( !this.anim_timer ){
                            this.removeReferenceElement();
                        }
	                }
	            }.bind(this));
            } else {
            	button.addEventListener('mousedown', function(event){
	            	// Reset everything if during the event another mouse button is being clicked
	                if(this.isLeftClick(event)){
	                    this.mouseDownHandler(this.getSourceElement(event));
	                } else {
	                    this.mouseUpHandler(this.getSourceElement(event));
	                    this.removeReferenceElement();
	                }
	            }.bind(this));

	            button.addEventListener('mouseup', function(event){
	                this.mouseUpHandler(this.getSourceElement(event));

	                if( !this.anim_timer ){
	                    this.removeReferenceElement();
	                }
	            }.bind(this));

	            button.addEventListener('mouseout', function(event){
	                // Only call mouseUpHandler if the element the mouse left to is NOT the feedback element
	                if(event.toElement != this.selectFeedbackElement(this.getSourceElement(event))){
	                    this.mouseUpHandler(this.getSourceElement(event));

	                    if( !this.anim_timer ){
	                        this.removeReferenceElement();
	                    }
	                }
	            }.bind(this));
            }

        }
    }

    // Set unique class names for the dom elements
    HoldToDelete.prototype.setClassNames = function(){
    	for (var i = 0; i < this.dom_elements.length; i++){
            var button = this.dom_elements[i];
            button.className += ' ' + this.options.class_name;
        }
    }

    // Check if the button being clicked is a left click
    HoldToDelete.prototype.isLeftClick = function(event){
		if ('buttons' in event) {
			return event.buttons === 1;
		} else if ('which' in event) {
			if(event.which === 1 || event.which === 3){
				return true;
			}
			return event.which === 1;
		} else {
			return event.button === 1;
		}
    }

    // Register the mouse events for the feedback element
    HoldToDelete.prototype.registerFeedbackEvents = function(feedback_element){
        feedback_element.addEventListener('mouseup', function(event){
            this.mouseUpHandler(this.reference_element);
            
            if( !this.anim_timer ){
                this.removeReferenceElement();
            }
        }.bind(this));

        feedback_element.addEventListener('mouseout', function(event){
            if(event.toElement != this.reference_element){
                this.mouseUpHandler(this.reference_element);
                this.removeReferenceElement();
            }
        }.bind(this));

        feedback_element.addEventListener('mousedown', function(event){
        	if(!this.isLeftClick(event)){
        		this.mouseUpHandler(this.reference_element);
                this.removeReferenceElement();
        	}
        }.bind(this));
    }

    // Handle the mouse down event. This is where the interval is being called, the feedback element is inserted and later also deleted
    HoldToDelete.prototype.mouseDownHandler = function(reference_element){
        this.setMouseupCheck(true);
        this.setReferenceElement(reference_element);

        this.reference_element.className += ' ' + this.classname_running;

        var feedback_object = this.getFeedbackObject(this.reference_element);
        var feedback_element = this.insertFeedbackElement(feedback_object, reference_element);

        this.registerFeedbackEvents(feedback_element);

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
        	button.className = button.className.replace(' ' + this.classname_running, '');

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

        return feedback_element;
    }

    // Add to the standard feedback element
    HoldToDelete.prototype.insertFeedbackElement = function(feedback_object){
        var feedback_element = this.constructFeedbackElement();

        if(typeof feedback_object === 'object'){
            for(var css_rule in feedback_object.css){
                feedback_element.style.cssText += css_rule + ': ' + feedback_object.css[css_rule] + ';';
            }
        }
        
        if(feedback_object.border_radius != 0){
        	if(feedback_object.hasOwnProperty('border_left_radius')){
            	feedback_element.style.cssText += 'border-top-left-radius: ' + feedback_object.border_left_radius + 'px;';
	        }

	        if(feedback_object.hasOwnProperty('border_right_radius')){
	            feedback_element.style.cssText += 'border-top-right-radius: ' + feedback_object.border_right_radius + 'px;';
	        }

	        if(feedback_object.hasOwnProperty('border_radius') && feedback_object.border_radius != 0){
	            feedback_element.style.cssText += 'border-top-width: ' + feedback_object.border_radius + 'px;';
	        }
        }
        
        feedback_object.clicked_element.parentNode.insertBefore(feedback_element, feedback_object.clicked_element.nextSibling);

        return feedback_element;
    }

    // Get the object for the feedback element based on the user settings
    HoldToDelete.prototype.getFeedbackObject = function(element){
        var feedback_object = {};

        feedback_object.clicked_element = element;
        feedback_object.wrapper = this.selectFeedbackWrapper(element);
       
        feedback_object.width = feedback_object.wrapper.offsetWidth;

        if(window.getComputedStyle){
            feedback_object.border_left_radius = this.formatStringtoNumber(window.getComputedStyle(element, null).getPropertyValue('border-top-left-radius'));
            feedback_object.border_right_radius = this.formatStringtoNumber(window.getComputedStyle(element, null).getPropertyValue('border-top-right-radius'));

            // Choose which one is the largest
            if(feedback_object.border_left_radius >= feedback_object.border_right_radius){
            	feedback_object.border_radius = this.getBorderRadiusHeight(feedback_object.border_left_radius);
            } else if(feedback_object.border_left_radius < feedback_object.border_right_radius) {
            	feedback_object.border_radius = this.getBorderRadiusHeight(feedback_object.border_right_radius);
            } else {
            	feedback_object.border_radius = 0;
            }
        }

        return feedback_object;
    }

    // Function to format number with px or % at the end into actual numbers
    HoldToDelete.prototype.formatStringtoNumber = function(string_number){
        string_number = string_number.replace(/ /g,'')

        if(string_number.slice(-2) === 'px'){
            string_number = string_number.slice(0, -2);
        } else if(string_number.slice(-1) === '%'){
            string_number = (string_number.slice(0, -1) / 100) * this.reference_element.offsetWidth;
        }

        return Number(string_number);
    }

    HoldToDelete.prototype.getBorderRadiusHeight = function(width_in_pixels){
    	if(this.options.border_radius_percentage){
    		var width_in_percentages = (width_in_pixels / this.reference_element.offsetWidth) * 100;
    		return (width_in_percentages / 100) * this.reference_element.offsetHeight;
    	}
    	
    	return width_in_pixels;
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
            for (var i = 0; i < this.dom_elements.length; i++){
                var button = this.dom_elements[i];

                button.addEventListener(
                    event_name,
                    function(){
                    	callback(
                    		this.reference_element,
                    		this.selectFeedbackElement(this.reference_element)
                    	) 
                    }.bind(this),
                    false
                );
            }
        }
    }

    // Create custom events and call them
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
            
            for (var i = 0; i < this.dom_elements.length; i++){
                var button = this.dom_elements[i];
                button.dispatchEvent(event);
            }
        }
    }

    // Make HoldToDelete available for the global scope
    scope.HoldToDelete = HoldToDelete;

})(window, window.document);