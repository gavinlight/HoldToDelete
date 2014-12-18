new HoldToDelete('button.simple');

new HoldToDelete(
	'button.simple-options',
	{
		height: '15px',
		color: '#00FF00',
		seconds: 1,
		timeout: 0.5
	}
);

new HoldToDelete(
	'button.advanced-options',
	{
		remove_feedback: false,
		css: {
			'opacity': '0.4',
			'box-shadow': '3px 3px 3px rgba(0,0,0,0.5)'
		}
	}
);

new HoldToDelete('button.border-radius');

var remove_handler_standard = new HoldToDelete('button.custom-event-standard');
remove_handler_standard.on('holdtodelete_started', function(reference_element, feedback_element){
	console.log('Reference element: ', reference_element);
	console.log('Feedback element:', feedback_element);
});

var remove_handler_started = new HoldToDelete('button.custom-event-started');
remove_handler_started.on('holdtodelete_started', function(reference_element, feedback_element){
	console.log('Custom event: Started');
});

var remove_handler_running = new HoldToDelete('button.custom-event-running');
remove_handler_running.on('holdtodelete_running', function(reference_element, feedback_element){
	console.log('Custom event: Running');
});

var remove_handler_before_timeout = new HoldToDelete('button.custom-event-before-timeout');
remove_handler_before_timeout.on('holdtodelete_before_timeout', function(reference_element, feedback_element){
	console.log('Custom event: Before timeout');
});

var remove_handler_finished = new HoldToDelete('button.custom-event-finished');
remove_handler_finished.on('holdtodelete_finished', function(reference_element, feedback_element){
	console.log('Custom event: Finished');
});