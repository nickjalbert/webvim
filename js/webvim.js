/*!
 * Wim v0.1 - Web based vim
 *
 * Author: Nick Jalbert (nickjalbert@gmail.com)
 *
 */

var vim_controller;
var vim_view;
var vim_model;


function ScreenPosition(x, y) {
    this.x = x;
    this.y = y;
}

function WebvimView() {
    this.span_start = '<spanid="cursor">'; 
    this.span_end = '</span>';

    this.refreshDisplay = function() {
        var mark_pos = vim_model.mark_position;
        var cursor_pos = vim_model.cursor_position;
        var text = vim_model.getText();
        var display = this.highlightPosition(mark_pos, cursor_pos, text);
        this.drawDisplay(display);
    }

    this.highlightPosition = function(start, cursor, text) {
        if (start.x == cursor.x && start.y == cursor.y) {
            return this.highlightCharAt(cursor, text);
        } else {
            return this.highlightLines(start, cursor, text);
        }
    }

    this.highlightCharAt = function(cursor, text) {
        if (cursor.x < text[cursor.y].length) {
            var front = text[cursor.y].substring(0, cursor.x);
            var target_char = text[cursor.y].charAt(cursor.x);
            var end = text[cursor.y].substring(cursor.x + 1);
            var highlight_char = this.span_start + target_char + this.span_end;
            text[cursor.y] = front + highlight_char + end;
            return text;
        } else if (cursor.x == text[cursor.y].length) {
            var highlight_char = this.span_start + "&nbsp;" + this.span_end;
            text[cursor.y] += highlight_char;
            return text;
        }
    }

    this.highlightLines = function(start, cursor, text) {
        alert("TODO: implement line highlighting");
    }

    this.drawDisplay = function(text) {
        var html_str = "";
        for (var i = 0; i < text.length; i++) {
            html_str += text[i];
            html_str += "<br/>";
        }
        html_str = html_str.split(' ').join("&nbsp;");
        /* TODO: can't type spanid in text anymore */
        html_str = html_str.replace("spanid", "span id");
        $("#webvim_text").html(html_str);
    }
}

function WebvimModel() {
    this.text = new Array();
    this.mark_position = new ScreenPosition(0, 0);
    this.cursor_position = new ScreenPosition(0, 0);

    this.initialize = function(start_text) {
        this.text[0] = start_text;
    }

    this.addLine = function(text) {
        this.text[this.text.length] = text;
    }

    this.getText = function() {
        return this.text.slice();
    }

    this.synchronizeMarkWithCursor = function() {
        this.mark_position.x = this.cursor_position.x;
        this.mark_position.y = this.cursor_position.y;
    }

    this.insertAtCurrentPosition = function(text) {
        var current_text = this.text[this.cursor_position.y];
        var pos_x = this.cursor_position.x;
        var front = current_text.substring(0, pos_x);
        var end = current_text.substring(pos_x);
        var result_text = front + text + end;
        this.text[this.cursor_position.y] = result_text;
        this.synchronizeMarkWithCursor();
    }
    
    this.incrementPosition = function() {
        this.cursor_position.x += 1;
        var line_len = this.text[this.cursor_position.y].length;
        if (this.cursor_position.x >= line_len) {
            this.cursor_position.x = line_len - 1;
        }
        this.synchronizeMarkWithCursor();
    }
    
    this.incrementPositionExtended = function() {
        this.cursor_position.x += 1;
        var line_len = this.text[this.cursor_position.y].length;
        if (this.cursor_position.x > line_len) {
            this.cursor_position.x = line_len;
        }
        this.synchronizeMarkWithCursor();
    }

    this.putCursorInBounds = function() {
        var line_len = this.text[this.cursor_position.y].length;
        if (this.cursor_position.x >= line_len) {
            this.cursor_position.x = line_len - 1;
        }
        this.synchronizeMarkWithCursor();
    }


    this.decrementPosition = function() {
        this.cursor_position.x -= 1;
        if (this.cursor_position.x < 0) {
            this.cursor_position.x = 0;
        }
        this.synchronizeMarkWithCursor();
    }

    this.deleteCharAtCurrentPosition = function() {
        var current_text = this.text[this.cursor_position.y];
        var x_pos = this.cursor_position.x;
        var front = current_text.substring(0, x_pos);
        var end = current_text.substring(x_pos + 1);
        var result_text = front + end;
        this.text[this.cursor_position.y] = result_text;
        if (this.cursor_position.x >= result_text.length) {
            this.cursor_position.x = result_text.length - 1;
        }
        this.synchronizeMarkWithCursor();
    }
    
    this.jumpToNextWord = function() {
        var current_text = this.text[this.cursor_position.y];
        var next_pos = current_text.indexOf(" ", this.cursor_position.x);
        if (next_pos == -1) {
            if (this.cursor_position.y + 1 < this.text.length) {
                this.cursor_position.y += 1;
                this.cursor_position.x = 0;
                this.jumpToNextWord();
            } else {
                this.endOfLine()
            }
            this.synchronizeMarkWithCursor();
            return;
        }
        next_pos += 1;
        this.cursor_position.x = next_pos;
        this.synchronizeMarkWithCursor();
    }

    this.jumpBackWord = function() {
        var current_text = this.text[this.cursor_position.y];
        var next_pos = current_text.lastIndexOf(" ",this.cursor_position.x-2);
        if (next_pos == -1) {
            if (this.cursor_position.y  > 0) {
                this.cursor_position.y -= 1;
                this.endOfLine();
                this.jumpBackWord();
            } else {
                this.startOfLine()
            }
            this.synchronizeMarkWithCursor();
            return;
        } else {
            next_pos += 1;
            this.cursor_position.x = next_pos;
        }
        this.synchronizeMarkWithCursor();
    }

    this.cursorUp = function() {
        if (this.cursor_position.y == 0) {
            return;
        }
        this.cursor_position.y -= 1;
        this.putCursorInBounds();
        this.synchronizeMarkWithCursor();
    }
    
    this.cursorDown = function() {
        if (this.cursor_position.y == this.text.length - 1) {
            return;
        }
        this.cursor_position.y += 1;
        this.putCursorInBounds();
        this.synchronizeMarkWithCursor();
    }

    this.endOfLine = function() {
        var current_text = this.text[this.cursor_position.y];
        this.cursor_position.x = current_text.length - 1;
        this.synchronizeMarkWithCursor();
    }

    this.startOfLine = function() {
        this.cursor_position.x = 0;
        this.synchronizeMarkWithCursor();
    }

    this.breakline = function() {
        var current_y = this.cursor_position.y;
        var current_text = this.text[current_y];
        var oldline_text = current_text.substring(0, this.cursor_position.x);
        var newline_text = current_text.substring(this.cursor_position.x);

        this.text[current_y] = oldline_text;
        this.text.splice(current_y + 1, 0, newline_text);

        this.cursor_position.x = 0;
        this.cursor_position.y = current_y + 1;
        this.synchronizeMarkWithCursor();
    }

    this.backspace = function() {
        if (this.cursor_position.x == 0) {
            var current_y = this.cursor_position.y;
            if (current_y == 0) {
                return;
            }

            this.cursor_position.y = current_y - 1;
            this.cursor_position.x = this.text[this.cursor_position.y].length;
            this.text[this.cursor_position.y] += this.text[current_y];
            this.text.splice(current_y, 1);

        } else {
            this.decrementPosition();
            this.deleteCharAtCurrentPosition();
        }
        this.synchronizeMarkWithCursor();
    }

}

function WebvimController() {
    this.command_mode = true;
    
    this.keyAction = function(event) {
        if (event.which == 27) {
            this.command_mode = true;
            vim_model.putCursorInBounds();
            vim_view.refreshDisplay();
            return;
        }

        if (this.command_mode) {
            this.handleCommandMode(event);
        } else {
            this.handleInsertMode(event);
        }
    }
    
    this.handleInsertMode = function(event) {
        switch (event.which)
        {
            case 13:
            vim_model.breakline();
            break;

            case 8:
            event.preventDefault();
            vim_model.backspace();
            break;

            default:
            var typed_char = String.fromCharCode(event.which);
            vim_model.insertAtCurrentPosition(typed_char);
            vim_model.incrementPositionExtended();
            break;
        }
        vim_view.refreshDisplay();
    }

    this.handleCommandMode = function(event) {
        var typed_key = String.fromCharCode(event.which);

        switch (typed_key) {
            case "i":
            this.command_mode = false;
            break;
            
            case "l":
            vim_model.incrementPosition();
            break;
            
            case "h":
            vim_model.decrementPosition();
            break;

            case "j":
            vim_model.cursorDown();
            break;

            case "k":
            vim_model.cursorUp();
            break;
            
            case "a":
            vim_model.incrementPositionExtended();
            this.command_mode = false;
            break;

            case "$":
            vim_model.endOfLine();
            break;

            case "x":
            vim_model.deleteCharAtCurrentPosition();
            break;

            case "w":
            vim_model.jumpToNextWord();
            break;

            case "b":
            vim_model.jumpBackWord();
            break;

            case "0":
            vim_model.startOfLine();
            break;
        }
        vim_view.refreshDisplay();
    }
}

$(document).ready(function(event) {
    vim_controller = new WebvimController();
    vim_model = new WebvimModel();
    vim_view = new WebvimView();


    vim_model.initialize("this is test text");
    vim_model.addLine("this is more test text");
    vim_view.refreshDisplay();

    $("#webvim_title").text("webvim: A JavaScript Vim Emulator");

    $(window).keypress(function(event) {
        vim_controller.keyAction(event);
    });

});
