/*!
 * Wim v0.1 - Web based vim
 *
 * Author: Nick Jalbert (nickjalbert@gmail.com)
 *
 */

var wim_master;


function wim_object(start_text) {
    this.text = start_text;
    this.display_text = start_text;
    this.command_mode = true;
    this.position = 0;
    this.initialize = initialize;
    this.key_action = key_action;
    this.insertAtPosition = insertAtPosition;
    this.updateDisplay = updateDisplay;
    this.incrementPosition = incrementPosition;
    this.decrementPosition = decrementPosition;
    this.highlightCurrentPosition = highlightCurrentPosition;
    this.handleCommandMode = handleCommandMode;
    this.handleInsertMode = handleInsertMode;

    function initialize() {
        this.highlightCurrentPosition();
        this.updateDisplay();
    }

    function insertAtPosition(text) {
        var front = this.text.substring(0, this.position);
        var end = this.text.substring(this.position, this.text.length);
        var result_text = front + text + end;
        return result_text;
    }

    function highlightCurrentPosition() {
        var front = this.text.substring(0, this.position);
        var target_char = this.text.charAt(this.position);
        var end = this.text.substring(this.position + 1, this.text.length);
        var div_start = '<span id="cursor">'; 
        var div_end = '</span>';
        this.display_text = front + div_start + target_char + div_end + end;
    }

    function updateDisplay() {
        $("#wim_text").html(this.display_text);
    }

    function handleCommandMode(event) {
        if (String.fromCharCode(event.which) == "i") {
            this.command_mode = false;
        } else if (String.fromCharCode(event.which) == "l") {
            this.incrementPosition();
            this.highlightCurrentPosition();
            this.updateDisplay();
        } else if (String.fromCharCode(event.which) == "h") {
            this.decrementPosition();
            this.highlightCurrentPosition();
            this.updateDisplay();
        } else if (String.fromCharCode(event.which) == "a") {
            if (this.position == this.text.length - 1) {
                this.extendTextLine()
            }
            this.incrementPosition();
            this.highlightCurrentPosition();
            this.updateDisplay();
            this.command_mode = false;
        }
    }

    function extendTextLine() {

        

    }

    function cleanupFromInster() {

    }
    
    function handleInsertMode(event) {
        this.text = this.insertAtPosition(String.fromCharCode(event.which));
        this.incrementPosition();
        this.highlightCurrentPosition();
        this.updateDisplay();
    }

    function key_action(event) {
        if (event.which == 27) {
            this.command_mode = true;
            this.cleanupFromInsert();
            return;
        }

        if (this.command_mode) {
            this.handleCommandMode(event);
        } else {
            this.handleInsertMode(event);
        }
    }

    function incrementPosition() {
        this.position += 1;
        if (this.position > (this.text.length - 1)) {
            this.position = this.text.length -1;
        }
    }
    
    function decrementPosition() {
        this.position -= 1;
        if (this.position < 0) {
            this.position = 0;
        }
    }
}

$(document).ready(function(event) {
    wim_master = new wim_object("test");
    wim_master.initialize();

    $("#wim_title").text("WIM");

    $(window).keypress(function(event) {
        wim_master.key_action(event);
    });

});

