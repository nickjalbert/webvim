/*!
 * Wim v0.1 - Web based vim
 *
 * Author: Nick Jalbert (nickjalbert@gmail.com)
 *
 */

var webvim_controller;


function webvim_object(start_text) {
    this.text = start_text;
    this.display_text = start_text;
    this.command_mode = true;
    this.position = 0;
    this.text_extension = "";



    this.initialize = initialize;
    this.keyAction = keyAction;
    this.insertAtPosition = insertAtPosition;
    this.updateDisplay = updateDisplay;
    this.incrementPosition = incrementPosition;
    this.decrementPosition = decrementPosition;
    this.highlightCurrentPosition = highlightCurrentPosition;
    this.handleCommandMode = handleCommandMode;
    this.handleInsertMode = handleInsertMode;
    this.cleanupCursorPosition = cleanupCursorPosition;
    this.deleteCharAtCurrentPosition = deleteCharAtCurrentPosition;

    function initialize() {
        this.highlightCurrentPosition();
        this.updateDisplay();
    }

    function insertAtPosition(text) {
        var front = this.text.substring(0, this.position);
        var end = this.text.substring(this.position);
        var result_text = front + text + end;
        return result_text;
    }

    function highlightCurrentPosition() {
        var span_start = '<span id="cursor">'; 
        var span_end = '</span>';
        if (this.position < this.text.length) {
            var front = this.text.substring(0, this.position);
            var target_char = this.text.charAt(this.position);
            var end = this.text.substring(this.position + 1);
            this.display_text = front + span_start + target_char + span_end + end;
        } else if (this.position == this.text.length) {
            this.display_text = this.text + span_start + "&nbsp;" + span_end;
        }
    }

    function deleteCharAtCurrentPosition() {
        var front = this.text.substring(0, this.position);
        var end = this.text.substring(this.position + 1);
        this.text = front + end;
        if (this.position >= this.text.length) {
            this.position = this.text.length - 1;
        }
    }

    function updateDisplay() {
        /* need to fix spaces and space highlighting */
        //var result_text = this.display_text.split(" ").join("&nbsp:");
        $("#webvim_text").html(this.display_text);
    }

    function handleCommandMode(event) {
        var typed_key = String.fromCharCode(event.which);

        switch (typed_key) {
            case "i":
            this.command_mode = false;
            break;
            
            case "l":
            if (this.position == this.text.length - 1) {
                break;
            }
            this.incrementPosition();
            break;
            
            case "h":
            this.decrementPosition();
            break;
            
            case "a":
            this.incrementPosition();
            this.command_mode = false;
            break;

            case "$":
            this.position = this.text.length - 1;
            break;

            case "x":
            this.deleteCharAtCurrentPosition();
            break;
        }
        this.highlightCurrentPosition();
        this.updateDisplay();
    }

    function handleInsertMode(event) {
        this.text = this.insertAtPosition(String.fromCharCode(event.which));
        this.incrementPosition();
        this.highlightCurrentPosition();
        this.updateDisplay();
    }

    function cleanupCursorPosition() {
        if (this.position >= this.text.length)  {
            this.position = this.text.length - 1;
            this.highlightCurrentPosition();
            this.updateDisplay();
        }
    }

    function keyAction(event) {
        if (event.which == 27) {
            this.command_mode = true;
            this.cleanupCursorPosition();
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
        if (this.position > (this.text.length)) {
            this.position = this.text.length;
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
    webvim_controller = new webvim_object("text is here");
    webvim_controller.initialize();

    $("#webvim_title").text("webvim: A JavaScript Vim Emulator");

    $(window).keypress(function(event) {
        webvim_controller.keyAction(event);
    });

});

